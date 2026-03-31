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

      try {
        // Track code execution in progress
        if (userId && (language === 'java' || !language)) {
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
            console.error('Error updating progress:', progressError);
          }
        }

        console.log(`[Compiler] Starting execution for session ${sessionId}. Language: ${language || 'java'}`);
        
        const jdClientId = process.env.JDOODLE_CLIENT_ID;
        const jdClientSecret = process.env.JDOODLE_CLIENT_SECRET;

        // Check if JDoodle should be used
        if (jdClientId && jdClientSecret && jdClientId.trim() !== '' && jdClientSecret.trim() !== '') {
          socket.emit('output', { type: 'info', data: 'Compiling and Running online with JDoodle...\n' });
          
          try {
            const result = await jdoodleService.execute(code, 'java', data.input || '');
            if (result.success) {
              socket.emit('output', { type: 'stdout', data: result.output });
              socket.emit('output', { 
                type: 'info', 
                data: `\nExecution complete (Memory: ${result.memory}KB, CPU: ${result.cpuTime}s)\n` 
              });
            } else {
              socket.emit('output', { type: 'error', data: `JDoodle Error: ${result.error}` });
            }
          } catch (error) {
            socket.emit('output', { type: 'error', data: `Error calling JDoodle: ${error.message}` });
          }
          
          socket.emit('execution-complete');
          return;
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

        socket.emit('output', { type: 'info', data: 'Compiling...\n' });

        const compileProcess = spawn('javac', ['-cp', classpath, `${className}.java`], {
          cwd: userDir
        });

        let compileError = '';

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

    socket.on('stdin-input', (data) => {
      const { sessionId, input } = data;
      const session = activeSessions.get(sessionId);
      
      if (session && session.process && !session.process.killed) {
        session.process.stdin.write(input + '\n');
      }
    });

    socket.on('kill-process', (data) => {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      
      if (session && session.process && !session.process.killed) {
        session.process.kill();
        socket.emit('output', { 
          type: 'info', 
          data: '\n\nProcess terminated by user\n' 
        });
        socket.emit('execution-complete');
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
