import express from 'express';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const LIBS_DIR = path.join(__dirname, '..', 'libs');

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

export default router;
