import express from 'express';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { Ollama } from 'ollama';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const LIBS_DIR = path.join(__dirname, '..', 'libs');

const MODEL_NAME = OLLAMA_CONFIG.model;
const OLLAMA_URL = OLLAMA_CONFIG.url;

const ollama = new Ollama({ host: OLLAMA_URL });

console.log('Compiler Route - Ollama Config:');
console.log('Model:', MODEL_NAME);
console.log('URL:', OLLAMA_URL);

async function ensureDirectories() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
  
  try {
    await fs.access(LIBS_DIR);
  } catch {
    await fs.mkdir(LIBS_DIR, { recursive: true });
  }
}

ensureDirectories();

async function getLibraries() {
  try {
    const files = await fs.readdir(LIBS_DIR);
    const jarFiles = files.filter(file => file.endsWith('.jar'));
    console.log(`Loaded ${jarFiles.length} JAR files:`, jarFiles);
    return jarFiles;
  } catch (error) {
    console.error('Error reading libs directory:', error);
    return [];
  }
}

async function copyLibrariesAndBuildClasspath(userDir) {
  try {
    const files = await fs.readdir(LIBS_DIR);
    const jarFiles = files.filter(file => file.endsWith('.jar'));
    
    const jarPaths = ['.'];
    
    for (const jar of jarFiles) {
      const source = path.join(LIBS_DIR, jar);
      const dest = path.join(userDir, jar);
      await fs.copyFile(source, dest);
      jarPaths.push(jar);
    }
    
    const sep = process.platform === 'win32' ? ';' : ':';
    const classpath = jarPaths.join(sep);
    
    return { count: jarFiles.length, classpath };
  } catch (error) {
    console.error('Error copying libraries:', error);
    return { count: 0, classpath: '.' };
  }
}

router.post('/compile-java', authenticateToken, async (req, res) => {
  const { code, input } = req.body;
  const userId = req.user.userId;

  if (!code) {
    return res.status(400).json({ message: 'Code is required' });
  }

  const classNameMatch = code.match(/public\s+class\s+(\w+)/);
  if (!classNameMatch) {
    return res.status(400).json({ 
      message: 'Invalid Java code: No public class found' 
    });
  }

  const className = classNameMatch[1];
  const timestamp = Date.now();
  const userDir = path.join(TEMP_DIR, `user_${userId}_${timestamp}`);
  const javaFilePath = path.join(userDir, `${className}.java`);

  try {
    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(javaFilePath, code);

    const { count, classpath } = await copyLibrariesAndBuildClasspath(userDir);
    console.log(`Copied ${count} libraries to user directory`);

    const compileCommand = `javac -cp "${classpath}" ${className}.java`;
    
    console.log('Compiling:', compileCommand);
    
    await new Promise((resolve, reject) => {
      exec(compileCommand, { 
        timeout: 10000,
        cwd: userDir
      }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });

    const runCommand = `java -cp "${classpath}" ${className}`;
    
    console.log('Executing:', runCommand);
    
    const output = await new Promise((resolve, reject) => {
      const childProcess = exec(runCommand, { 
        timeout: 10000,
        cwd: userDir,
        maxBuffer: 1024 * 1024
      }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });

      if (input && input.trim()) {
        childProcess.stdin.write(input);
        childProcess.stdin.end();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    
    await fs.rm(userDir, { recursive: true, force: true });

    res.json({
      success: true,
      output: output || 'Program executed successfully with no output',
      error: null
    });

  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      await fs.rm(userDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }

    res.json({
      success: false,
      output: null,
      error: error.message
    });
  }
});

router.get('/libraries', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(LIBS_DIR);
    const jarFiles = files.filter(file => file.endsWith('.jar'));
    
    const libraries = jarFiles.map(jar => {
      const name = jar.replace('.jar', '');
      const parts = name.split('-');
      const version = parts[parts.length - 1];
      const libName = parts.slice(0, -1).join('-');
      
      return {
        filename: jar,
        name: libName,
        version: version
      };
    });
    
    res.json({
      success: true,
      libraries: libraries,
      count: libraries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reading libraries',
      error: error.message
    });
  }
});

router.post('/analyze-code', authenticateToken, async (req, res) => {
  try {
    const { code, projectTitle, requirements, language } = req.body;

    if (!code || !projectTitle || !requirements) {
      return res.status(400).json({ hint: 'Missing required information for analysis.' });
    }

    console.log('[AI Hint] Analyzing code for project:', projectTitle);

    const prompt = `You are a friendly coding mentor helping a student. Give feedback in ONE simple paragraph.

REQUIREMENTS:
${requirements}

STUDENT CODE:
${code}

INSTRUCTIONS:
1. Check if the code does all the requirements (don't show this check)
2. Look at the code quality (don't show this)
3. Write your response:

IF ALL REQUIREMENTS ARE DONE:
Write one paragraph that:
- Says congrats for finishing all requirements
- Give 2-3 simple tips to make the code better (like: add comments, use better names, fix errors)
- Keep it happy and positive
- Use simple, easy words

IF REQUIREMENTS ARE NOT DONE:
Write one paragraph that:
- Say something nice and encouraging
- Give a hint about what's missing (don't say it directly)
- Tell them what to work on next
- Keep it positive and helpful
- Use simple, easy words

IMPORTANT: Write ONLY one paragraph. Don't show any analysis, lists, or code. Use simple English. No complicated words.`;

    const response = await ollama.chat({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: 0.7,
        num_predict: 150,
        num_ctx: 2048
      }
    });

    let hint = response.message.content.trim();
    
    // Programmatic fallback check
    const reqLower = requirements.toLowerCase();
    const codeLower = code.toLowerCase();
    
    const codeLines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
    });
    
    const hasSubstantialCode = codeLines.length > 15;
    
    const checkRequirementKeywords = () => {
      const requirementLines = requirements.split('\n').filter(line => line.trim().startsWith('-'));
      let matchCount = 0;
      
      for (const req of requirementLines) {
        const reqText = req.toLowerCase();
        if (reqText.includes('addition') || reqText.includes('add')) {
          if (codeLower.includes('+') || codeLower.includes('add')) matchCount++;
        }
        if (reqText.includes('subtraction') || reqText.includes('subtract')) {
          if (codeLower.includes('-') || codeLower.includes('subtract')) matchCount++;
        }
        if (reqText.includes('multiplication') || reqText.includes('multiply')) {
          if (codeLower.includes('*') || codeLower.includes('multiply')) matchCount++;
        }
        if (reqText.includes('division') || reqText.includes('divide')) {
          if (codeLower.includes('/') || codeLower.includes('divide')) matchCount++;
        }
        if (reqText.includes('input') || reqText.includes('user')) {
          if (codeLower.includes('scanner') || codeLower.includes('input()') || codeLower.includes('readline')) matchCount++;
        }
        if (reqText.includes('display') || reqText.includes('output') || reqText.includes('result')) {
          if (codeLower.includes('print') || codeLower.includes('system.out')) matchCount++;
        }
      }
      
      return matchCount >= requirementLines.length;
    };
    
    const likelyComplete = hasSubstantialCode && checkRequirementKeywords();
    
    if (likelyComplete && !hint.toLowerCase().includes('complete')) {
      hint = 'Great job! Your code does everything it needs to do. To make it even better, try adding some comments to explain what your code does, use clearer names for your variables, and add checks to make sure the user types in the right stuff.';
    } else if (!likelyComplete && hint.toLowerCase().includes('complete')) {
      hint = 'You\'re doing well! Your code looks good so far, but you still need to add a few more things. Try to finish the main parts first, then test each part to make sure it works before you move to the next one.';
    }
    
    console.log('[AI Hint] Generated hint successfully');
    res.json({ hint });
  } catch (error) {
    console.error('[AI Hint] Error:', error);
    res.status(500).json({ 
      error: `AI hint service failed: ${error.message}`,
      hint: null 
    });
  }
});

export default router;
