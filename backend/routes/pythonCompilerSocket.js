import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '..', 'temp');

const activePythonSessions = new Map();

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

    socket.on('compile-and-run-python', async (data) => {
      const { code, sessionId } = data;

      if (activePythonSessions.has(sessionId)) {
        const existingSession = activePythonSessions.get(sessionId);
        if (existingSession.process && !existingSession.process.killed) {
          existingSession.process.kill();
        }
      }

      try {
        const timestamp = Date.now();
        const userDir = path.join(TEMP_DIR, `python_session_${sessionId}_${timestamp}`);
        const pythonFilePath = path.join(userDir, 'main.py');

        await fs.mkdir(userDir, { recursive: true });
        await fs.writeFile(pythonFilePath, code);

        socket.emit('output', { type: 'info', data: 'Running Python...\n' });

        const pythonProcess = spawn('python', ['main.py'], {
          cwd: userDir
        });

        activePythonSessions.set(sessionId, {
          process: pythonProcess,
          userDir: userDir
        });

        let errorOutput = '';

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
    });

    socket.on('stdin-input-python', (data) => {
      const { sessionId, input } = data;
      const session = activePythonSessions.get(sessionId);
      
      if (session && session.process && !session.process.killed) {
        session.process.stdin.write(input + '\n');
      }
    });

    socket.on('kill-process-python', (data) => {
      const { sessionId } = data;
      const session = activePythonSessions.get(sessionId);
      
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
      activePythonSessions.forEach((session, sessionId) => {
        if (session.process && !session.process.killed) {
          session.process.kill();
        }
      });
    });
  });
}
