import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import Progress from '../models/Progress.js';
import jdoodleService from '../services/jdoodleService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const LIBS_DIR = path.join(__dirname, '..', 'libs');

const activeSessions = new Map();

const extractCleanOutput = (output) => {
  if (!output) return '';
  const exceptionPatterns = [
    'Exception in thread',
    'java.util.NoSuchElementException',
    'at java.base/',
    'EOFError',
    'Traceback (most recent call last):',
    '  File '
  ];
  let minIndex = output.length;
  for (const pattern of exceptionPatterns) {
    const idx = output.indexOf(pattern);
    if (idx !== -1 && idx < minIndex) {
      minIndex = idx;
    }
  }
  let clean = output.substring(0, minIndex);
  // JDoodle / Python / Java sometimes adds a newline right before the traceback.
  // We remove trailing newlines to ensure prefix matching works on subsequent runs,
  // but we keep trailing spaces (e.g. "Enter number: ")
  return clean.replace(/[\r\n]+$/, '');
};

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
    return { count: 0, classpath: '.' };
  }
}

function parseCompilationErrors(stderr, className) {
  const errors = [];
  const lines = stderr.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match error pattern: filename.java:lineNumber: error: message
    // Example: Main.java:14: error: cannot find symbol
    const match = line.match(/(\w+\.java):(\d+):\s*(error|warning):\s*(.+)/);
    
    if (match) {
      const [, file, lineNumber, type, message] = match;
      
      // Get the code context (usually the line with the caret ^)
      let context = '';
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        // Look for the line that shows the problematic code or the caret
        if (nextLine && !nextLine.match(/(\w+\.java):/) && !nextLine.startsWith('symbol:') && !nextLine.startsWith('location:')) {
          if (context) context += ' ';
          context += nextLine;
        }
      }
      
      errors.push({
        line: parseInt(lineNumber),
        type,
        message: message.trim(),
        context: context.trim()
      });
    }
  }
  
  return errors;
}

export function setupCompilerSocket(io) {
  io.on('connection', (socket) => {
    const handleJavaCompile = async (data) => {
      const { code, sessionId, token, language } = data;
      
      console.log(`[Compiler] Received execution request for session ${sessionId}. Language: ${language || 'java'}`);
      socket.emit('output', { type: 'info', data: `Starting execution (${language || 'java'})...\n` });

      // Authenticate user and get userId
      let userId = null;
      try {
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } else if (data.userId) {
          // Compatibility with BugHunt which sends userId directly
          userId = data.userId;
        }
      } catch (error) {
        console.error('Authentication error in compiler socket:', error);
      }

      if (activeSessions.has(sessionId)) {
        const existingSession = activeSessions.get(sessionId);
        if (existingSession.process && !existingSession.process.killed) {
          existingSession.process.kill();
        }
      }

      // Track code execution and award XP - Non-blocking to ensure compiler starts fast
      if (userId && (language === 'java' || !language)) {
        (async () => {
          try {
            // Find all progress records for this student
            const Progress = (await import('../models/Progress.js')).default;
            const progressRecords = await Progress.find({ student: userId });
            
            // Update each progress record
            for (const progress of progressRecords) {
              progress.activities.codeExecutions.total += 1;
              progress.activities.codeExecutions.java += 1;
              progress.activities.codeExecutions.lastExecution = new Date();
              
              // Update time spent (estimate 5 minutes per execution)
              progress.timeSpent.totalMinutes += 5;
              progress.timeSpent.thisWeek += 5;
              progress.timeSpent.thisMonth += 5;
              progress.timeSpent.lastUpdated = new Date();
              
              // Update Java skills
              progress.skills.java.lastActivity = new Date();
              
              // Recalculate job readiness
              progress.jobReadiness = Progress.calculateJobReadiness(progress);
              
              await progress.save();
            }
            
            // Award small XP for code execution (1 XP per execution, max 20 per day)
            const { awardXp } = await import('../services/xpService.js');
            await awardXp(
              userId,
              1,
              'Java code execution',
              'codeExecutions'
            );
          } catch (progressError) {
            console.error('Error updating progress (non-blocking):', progressError);
          }
        })();
      }

      try {
        const jdClientId = process.env.JDOODLE_CLIENT_ID;
        const jdClientSecret = process.env.JDOODLE_CLIENT_SECRET;

        // Check if JDoodle should be used
        if (jdClientId && jdClientSecret && jdClientId.trim() !== '' && jdClientSecret.trim() !== '') {
          
          // Helper: run code on JDoodle with given stdin and handle input buffering
          const runWithJDoodle = async (stdinInput) => {
            try {
              const result = await jdoodleService.execute(code, language || 'java', stdinInput);
              if (result.success) {
                // Check if the output contains NoSuchElementException (needs more input)
                if (result.output && result.output.includes('java.util.NoSuchElementException')) {
                  // Extract the useful output before the exception
                  const cleanOutput = extractCleanOutput(result.output);
                  
                  // Store the JDoodle input session
                  activeSessions.set(sessionId, {
                    type: 'jdoodle',
                    code: code,
                    language: language || 'java',
                    inputBuffer: stdinInput ? stdinInput.split('\n') : [],
                    lastCleanOutput: cleanOutput,
                  });
                  
                  // Show the partial output and wait for input
                  if (cleanOutput.trim()) {
                    socket.emit('output', { type: 'stdout', data: cleanOutput });
                  }
                  socket.emit('output', { type: 'info', data: '' });
                  socket.emit('waiting-for-input');
                  // Don't emit execution-complete — keep the session running
                  return;
                }
                
                socket.emit('output', { type: 'stdout', data: result.output });
                socket.emit('output', { 
                  type: 'info', 
                  data: `\nExecution complete\n` 
                });
              } else {
                // Check if it's a Python-style input error
                if (result.error && (result.error.includes('EOFError') || result.error.includes('NoSuchElementException'))) {
                  activeSessions.set(sessionId, {
                    type: 'jdoodle',
                    code: code,
                    language: language || 'java',
                    inputBuffer: stdinInput ? stdinInput.split('\n') : [],
                    lastCleanOutput: '',
                  });
                  socket.emit('waiting-for-input');
                  return;
                }
                socket.emit('output', { type: 'error', data: `Compiler Error: ${result.error}` });
              }
            } catch (error) {
              console.error('[JDoodle Socket Error]', error);
              socket.emit('output', { type: 'error', data: `Internal Compiler Error: ${error.message}` });
            }
            
            activeSessions.delete(sessionId);
            socket.emit('execution-complete');
          };

          await runWithJDoodle(data.input || '');
          return;
        }

        // If JDoodle is not available, warn the console and try local
        if (!jdClientId || !jdClientSecret) {
          console.warn('[Compiler] JDoodle credentials missing. Falling back to local javac (requires Java installed on server).');
        }

        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        if (!classNameMatch) {
          socket.emit('compilation-error', { 
            errors: [{
              line: 1,
              type: 'error',
              message: 'No public class found',
              context: ''
            }]
          });
          socket.emit('output', { 
            type: 'error', 
            data: 'Invalid Java code: No public class found' 
          });
          socket.emit('execution-complete');
          return;
        }

        const className = classNameMatch[1];
        const timestamp = Date.now();
        const userDir = path.join(TEMP_DIR, `session_${sessionId}_${timestamp}`);
        const javaFilePath = path.join(userDir, `${className}.java`);

        await fs.mkdir(userDir, { recursive: true });
        await fs.writeFile(javaFilePath, code);

        const { classpath } = await copyLibrariesAndBuildClasspath(userDir);

        socket.emit('output', { type: 'info', data: 'Compiling locally...\n' });

        const compileProcess = spawn('javac', ['-cp', classpath, `${className}.java`], {
          cwd: userDir
        });

        let compileError = '';

        compileProcess.on('error', (err) => {
          console.error('[Compiler] Failed to start javac:', err);
          socket.emit('output', { 
            type: 'error', 
            data: `Failed to start local compiler: ${err.message}. \nTip: Make sure Java is installed on the server or JDoodle credentials are provided in .env` 
          });
          socket.emit('execution-complete');
        });

        compileProcess.stderr.on('data', (data) => {
          compileError += data.toString();
        });

        compileProcess.on('close', async (exitCode) => {
          if (exitCode !== 0) {
            const errors = parseCompilationErrors(compileError, className);
            
            if (errors.length > 0) {
              socket.emit('compilation-error', { errors });
            }
            
            socket.emit('output', { 
              type: 'error', 
              data: `Compilation Error:\n${compileError}` 
            });
            socket.emit('execution-complete');
            await fs.rm(userDir, { recursive: true, force: true });
            return;
          }

          // Clear any previous errors
          socket.emit('compilation-error', { errors: [] });
          socket.emit('output', { type: 'success', data: 'Compilation successful. Running...\n\n' });

          const javaProcess = spawn('java', ['-cp', classpath, className], {
            cwd: userDir
          });

          activeSessions.set(sessionId, {
            process: javaProcess,
            userDir: userDir
          });

          javaProcess.stdout.on('data', (data) => {
            socket.emit('output', { type: 'stdout', data: data.toString() });
          });

          javaProcess.stderr.on('data', (data) => {
            socket.emit('output', { type: 'stderr', data: data.toString() });
          });

          javaProcess.on('close', async (code) => {
            socket.emit('output', { 
              type: 'info', 
              data: `\n\nProcess exited with code ${code}\n` 
            });
            socket.emit('execution-complete');
            
            activeSessions.delete(sessionId);
            
            setTimeout(async () => {
              try {
                await fs.rm(userDir, { recursive: true, force: true });
              } catch (err) {
                // Cleanup error
              }
            }, 100);
          });

          javaProcess.on('error', (error) => {
            socket.emit('output', { 
              type: 'error', 
              data: `Execution Error: ${error.message}` 
            });
            socket.emit('execution-complete');
          });
        });

      } catch (error) {
        socket.emit('output', { 
          type: 'error', 
          data: `Error: ${error.message}` 
        });
        socket.emit('execution-complete');
      }
    };

    socket.on('compile-and-run', handleJavaCompile);
    socket.on('compile-java', handleJavaCompile);

    socket.on('stdin-input', async (data) => {
      const { sessionId, input } = data;
      const session = activeSessions.get(sessionId);
      
      if (!session) return;

      // Handle JDoodle input buffering — re-execute with all collected inputs
      if (session.type === 'jdoodle') {
        session.inputBuffer.push(input);
        const allInputs = session.inputBuffer.join('\n');
        
        // Clear previous output and re-run (Wait, we do NOT want to clear!)
        // socket.emit('output', { type: 'clear' });
        
        try {
          const result = await jdoodleService.execute(session.code, session.language, allInputs);
          if (result.success) {
            const cleanOutput = extractCleanOutput(result.output);
            let newToPrint = cleanOutput;
            if (cleanOutput.startsWith(session.lastCleanOutput)) {
              newToPrint = cleanOutput.substring(session.lastCleanOutput.length);
            }
            
            // Check if still needs more input
            if (result.output && result.output.includes('java.util.NoSuchElementException')) {
              session.lastCleanOutput = cleanOutput;
              
              if (newToPrint) {
                socket.emit('output', { type: 'stdout', data: newToPrint });
              }
              socket.emit('waiting-for-input');
              return;
            }
            
            // Execution completed successfully
            if (newToPrint) {
              socket.emit('output', { type: 'stdout', data: newToPrint });
            }
            socket.emit('output', { 
              type: 'info', 
              data: `\nExecution complete\n` 
            });
          } else {
            // Check if needs more input (Python EOFError)
            if (result.error && (result.error.includes('EOFError') || result.error.includes('NoSuchElementException'))) {
              socket.emit('waiting-for-input');
              return;
            }
            socket.emit('output', { type: 'error', data: `Compiler Error: ${result.error}` });
          }
        } catch (error) {
          console.error('[JDoodle Retry Error]', error);
          socket.emit('output', { type: 'error', data: `Internal Compiler Error: ${error.message}` });
        }
        
        activeSessions.delete(sessionId);
        socket.emit('execution-complete');
        return;
      }

      // Handle local process stdin
      if (session.process && !session.process.killed) {
        session.process.stdin.write(input + '\n');
      }
    });

    socket.on('kill-process', (data) => {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      
      if (session) {
        if (session.type === 'jdoodle') {
          // JDoodle session — just clean up the buffered session
          activeSessions.delete(sessionId);
          socket.emit('output', { 
            type: 'info', 
            data: '\n\nProcess terminated by user\n' 
          });
          socket.emit('execution-complete');
        } else if (session.process && !session.process.killed) {
          session.process.kill();
          socket.emit('output', { 
            type: 'info', 
            data: '\n\nProcess terminated by user\n' 
          });
          socket.emit('execution-complete');
        }
      }
    });

    socket.on('disconnect', () => {
      activeSessions.forEach((session, sessionId) => {
        if (session.process && !session.process.killed) {
          session.process.kill();
        }
      });
    });
  });
}
