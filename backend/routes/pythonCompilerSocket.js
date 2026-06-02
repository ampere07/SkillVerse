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

const activePythonSessions = new Map();

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
  return output.substring(0, minIndex);
};

function parsePythonErrors(stderr) {
  const errors = [];
  const lines = stderr.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const match = line.match(/File "(.+)", line (\d+)/);
    
    if (match) {
      const [, file, lineNumber] = match;
      
      let message = '';
      let context = '';
      
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.match(/File "(.+)", line (\d+)/)) {
          if (nextLine.includes('Error:') || nextLine.includes('Exception:')) {
            message = nextLine;
            break;
          } else if (nextLine && !context) {
            context = nextLine;
          }
        }
      }
      
      if (!message && i + 1 < lines.length) {
        message = lines[i + 1].trim();
      }
      
      errors.push({
        line: parseInt(lineNumber),
        type: 'error',
        message: message || 'Python Error',
        context: context
      });
    }
  }
  
  if (errors.length === 0 && stderr.includes('SyntaxError')) {
    const syntaxMatch = stderr.match(/line (\d+)/);
    if (syntaxMatch) {
      errors.push({
        line: parseInt(syntaxMatch[1]),
        type: 'error',
        message: 'SyntaxError',
        context: stderr.split('\n').find(l => l.includes('^')) || ''
      });
    }
  }
  
  return errors;
}

export function setupPythonCompilerSocket(io) {
  io.on('connection', (socket) => {
    const handlePythonCompile = async (data) => {
      const { code, sessionId, token, language } = data;

      console.log(`[Python Compiler] Received execution request for session ${sessionId}.`);
      socket.emit('output', { type: 'info', data: 'Starting Python execution...\n' });

      // Authenticate user and get userId
      let userId = null;
      try {
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } else if (data.userId) {
          userId = data.userId;
        }
      } catch (error) {
        console.error('Authentication error in Python compiler socket:', error);
      }

      if (activePythonSessions.has(sessionId)) {
        const existingSession = activePythonSessions.get(sessionId);
        if (existingSession.process && !existingSession.process.killed) {
          existingSession.process.kill();
        }
      }

      // Track code execution and award XP - Non-blocking
      if (userId && (language === 'python' || !language)) {
        (async () => {
          try {
            // Find all progress records for this student
            const Progress = (await import('../models/Progress.js')).default;
            const progressRecords = await Progress.find({ student: userId });
            
            // Update each progress record
            for (const progress of progressRecords) {
              progress.activities.codeExecutions.total += 1;
              progress.activities.codeExecutions.python += 1;
              progress.activities.codeExecutions.lastExecution = new Date();
              
              // Update time spent (estimate 5 minutes per execution)
              progress.timeSpent.totalMinutes += 5;
              progress.timeSpent.thisWeek += 5;
              progress.timeSpent.thisMonth += 5;
              progress.timeSpent.lastUpdated = new Date();
              
              // Update Python skills
              progress.skills.python.lastActivity = new Date();
              
              // Recalculate job readiness
              progress.jobReadiness = Progress.calculateJobReadiness(progress);
              
              await progress.save();
            }
            
            // Award small XP for code execution (1 XP per execution, max 20 per day)
            const { awardXp } = await import('../services/xpService.js');
            await awardXp(
              userId,
              1,
              'Python code execution',
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
              const result = await jdoodleService.execute(code, 'python3', stdinInput);
              if (result.success) {
                // Check if output contains EOFError (Python needs more input)
                if (result.output && (result.output.includes('EOFError') || result.output.includes('Traceback'))) {
                  const cleanOutput = extractCleanOutput(result.output);
                  
                  activePythonSessions.set(sessionId, {
                    type: 'jdoodle',
                    code: code,
                    language: 'python3',
                    inputBuffer: stdinInput ? stdinInput.split('\n') : [],
                    lastCleanOutput: cleanOutput,
                  });
                  
                  if (cleanOutput.trim()) {
                    socket.emit('output', { type: 'stdout', data: cleanOutput });
                  }
                  socket.emit('output', { type: 'info', data: '' });
                  socket.emit('waiting-for-input');
                  return;
                }
                
                socket.emit('output', { type: 'stdout', data: result.output });
                socket.emit('output', { 
                  type: 'info', 
                  data: `\nExecution complete\n` 
                });
              } else {
                if (result.error && (result.error.includes('EOFError') || result.error.includes('NoSuchElementException'))) {
                  activePythonSessions.set(sessionId, {
                    type: 'jdoodle',
                    code: code,
                    language: 'python3',
                    inputBuffer: stdinInput ? stdinInput.split('\n') : [],
                    lastCleanOutput: '',
                  });
                  socket.emit('waiting-for-input');
                  return;
                }
                socket.emit('output', { type: 'error', data: `JDoodle Error: ${result.error}` });
              }
            } catch (error) {
              console.error('[JDoodle Python Socket Error]', error);
              socket.emit('output', { type: 'error', data: `Error calling JDoodle: ${error.message}` });
            }
            
            activePythonSessions.delete(sessionId);
            socket.emit('execution-complete');
          };

          await runWithJDoodle(data.input || '');
          return;
        }

        // If JDoodle is not available, warn the console and try local
        if (!jdClientId || !jdClientSecret) {
          console.warn('[Python Compiler] JDoodle credentials missing. Falling back to local python (requires Python installed on server).');
        }

        const timestamp = Date.now();
        const userDir = path.join(TEMP_DIR, `python_session_${sessionId}_${timestamp}`);
        const pythonFilePath = path.join(userDir, 'main.py');

        await fs.mkdir(userDir, { recursive: true });
        await fs.writeFile(pythonFilePath, code);

        socket.emit('output', { type: 'info', data: 'Running Python locally...\n' });

        const pythonProcess = spawn('python', ['main.py'], {
          cwd: userDir
        });

        activePythonSessions.set(sessionId, {
          process: pythonProcess,
          userDir: userDir
        });

        let errorOutput = '';

        pythonProcess.on('error', (err) => {
          console.error('[Python Compiler] Failed to start python:', err);
          socket.emit('output', { 
            type: 'error', 
            data: `Failed to start local python: ${err.message}. \nTip: Make sure Python is installed on the server or JDoodle credentials are provided in .env` 
          });
          socket.emit('execution-complete');
        });

        pythonProcess.stdout.on('data', (data) => {
          socket.emit('output', { type: 'stdout', data: data.toString() });
        });

        pythonProcess.stderr.on('data', (data) => {
          const errorText = data.toString();
          errorOutput += errorText;
          socket.emit('output', { type: 'stderr', data: errorText });
        });

        pythonProcess.on('close', async (code) => {
          if (code !== 0 && errorOutput) {
            const errors = parsePythonErrors(errorOutput);
            if (errors.length > 0) {
              socket.emit('compilation-error', { errors });
            }
          } else {
            socket.emit('compilation-error', { errors: [] });
          }

          socket.emit('output', { 
            type: 'info', 
            data: `\n\nProcess exited with code ${code}\n` 
          });
          socket.emit('execution-complete');
          
          activePythonSessions.delete(sessionId);
          
          setTimeout(async () => {
            try {
              await fs.rm(userDir, { recursive: true, force: true });
            } catch (err) {
              // Cleanup error
            }
          }, 100);
        });

        pythonProcess.on('error', (error) => {
          socket.emit('output', { 
            type: 'error', 
            data: `Execution Error: ${error.message}` 
          });
          socket.emit('execution-complete');
        });

      } catch (error) {
        socket.emit('output', { 
          type: 'error', 
          data: `Error: ${error.message}` 
        });
        socket.emit('execution-complete');
      }
    };

    socket.on('compile-and-run-python', handlePythonCompile);
    socket.on('run-python', handlePythonCompile);

    socket.on('stdin-input-python', async (data) => {
      const { sessionId, input } = data;
      const session = activePythonSessions.get(sessionId);
      
      if (!session) return;

      // Handle JDoodle input buffering
      if (session.type === 'jdoodle') {
        session.inputBuffer.push(input);
        const allInputs = session.inputBuffer.join('\n');
        
        // socket.emit('output', { type: 'clear' });
        
        try {
          const result = await jdoodleService.execute(session.code, session.language, allInputs);
          if (result.success) {
            const cleanOutput = extractCleanOutput(result.output);
            let newToPrint = cleanOutput;
            if (cleanOutput.startsWith(session.lastCleanOutput)) {
              newToPrint = cleanOutput.substring(session.lastCleanOutput.length);
            }
            
            if (result.output && (result.output.includes('EOFError') || result.output.includes('Traceback'))) {
              session.lastCleanOutput = cleanOutput;
              
              if (newToPrint) {
                socket.emit('output', { type: 'stdout', data: newToPrint });
              }
              socket.emit('waiting-for-input');
              return;
            }
            
            if (newToPrint) {
              socket.emit('output', { type: 'stdout', data: newToPrint });
            }
            socket.emit('output', { 
              type: 'info', 
              data: `\nExecution complete\n` 
            });
          } else {
            if (result.error && (result.error.includes('EOFError') || result.error.includes('NoSuchElementException'))) {
              socket.emit('waiting-for-input');
              return;
            }
            socket.emit('output', { type: 'error', data: `JDoodle Error: ${result.error}` });
          }
        } catch (error) {
          console.error('[JDoodle Python Retry Error]', error);
          socket.emit('output', { type: 'error', data: `Error calling JDoodle: ${error.message}` });
        }
        
        activePythonSessions.delete(sessionId);
        socket.emit('execution-complete');
        return;
      }

      // Handle local process stdin
      if (session.process && !session.process.killed) {
        session.process.stdin.write(input + '\n');
      }
    });

    socket.on('kill-process-python', (data) => {
      const { sessionId } = data;
      const session = activePythonSessions.get(sessionId);
      
      if (session) {
        if (session.type === 'jdoodle') {
          activePythonSessions.delete(sessionId);
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
      activePythonSessions.forEach((session, sessionId) => {
        if (session.process && !session.process.killed) {
          session.process.kill();
        }
      });
    });
  });
}
