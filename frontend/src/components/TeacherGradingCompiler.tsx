import { useState, useRef, useEffect } from 'react';
import { Play, X, Square, ArrowLeft, Send } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import {
  highlightJavaCode,
  CompilationError as JavaCompilationError
} from '../utils/javaUtils';
import {
  highlightPythonCode,
  CompilationError as PythonCompilationError
} from '../utils/pythonUtils';
import { activityAPI } from '../utils/api';

type CompilationError = JavaCompilationError | PythonCompilationError;

const highlightCode = (code: string, language: string, errors: CompilationError[] = []) => {
  if (language === 'java') {
    return highlightJavaCode(code, errors, new Set());
  }
  
  if (language === 'python') {
    return highlightPythonCode(code, errors);
  }
  
  return code.split('\n').map((line, index) => (
    <div key={index} style={{ height: '24px', minHeight: '24px' }}>
      {line || '\u00A0'}
    </div>
  ));
};

interface TeacherGradingCompilerProps {
  submission: any;
  activity: any;
  onBack: () => void;
  onGradeSuccess: () => void;
}

export default function TeacherGradingCompiler({
  submission,
  activity,
  onBack,
  onGradeSuccess
}: TeacherGradingCompilerProps) {
  const [code] = useState(submission.codeBase || submission.content || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [compilationErrors, setCompilationErrors] = useState<CompilationError[]>([]);
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  const language = activity.language?.toLowerCase() || 'java';

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [code]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    
    newSocket.on('output', (data: { type: string; data: string }) => {
      setOutput(prev => prev + data.data);
      setTimeout(() => {
        if (consoleRef.current) {
          consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
      }, 0);
    });

    newSocket.on('execution-complete', () => {
      setIsRunning(false);
    });

    newSocket.on('compilation-error', (data: { errors: CompilationError[] }) => {
      setCompilationErrors(data.errors);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (isRunning && consoleRef.current) {
      consoleRef.current.focus();
    }
  }, [isRunning, output]);

  const handleRun = () => {
    if (!socket) {
      setOutput('Error: Not connected to server');
      return;
    }

    setOutput('');
    setCurrentInput('');
    setCompilationErrors([]);
    setIsRunning(true);
    
    if (language === 'java') {
      socket.emit('compile-and-run', { code, sessionId });
    } else if (language === 'python') {
      socket.emit('compile-and-run-python', { code, sessionId });
    }
  };

  const handleStop = () => {
    if (socket && isRunning) {
      if (language === 'java') {
        socket.emit('kill-process', { sessionId });
      } else if (language === 'python') {
        socket.emit('kill-process-python', { sessionId });
      }
      setIsRunning(false);
    }
  };

  const handleConsoleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isRunning) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (socket && currentInput.trim()) {
        if (language === 'java') {
          socket.emit('stdin-input', { sessionId, input: currentInput });
        } else if (language === 'python') {
          socket.emit('stdin-input-python', { sessionId, input: currentInput });
        }
        setOutput(prev => prev + currentInput + '\n');
        setCurrentInput('');
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      e.preventDefault();
      setCurrentInput(prev => prev + e.key);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current && highlightRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      
      lineNumbersRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const gradeNum = parseFloat(grade);

    if (isNaN(gradeNum) || gradeNum < 0) {
      setError('Please enter a valid grade');
      return;
    }

    if (gradeNum > activity.points) {
      setError(`Grade cannot exceed ${activity.points} points`);
      return;
    }

    setSubmitting(true);
    try {
      await activityAPI.gradeSubmission(
        activity._id,
        submission.student._id,
        {
          grade: gradeNum,
          feedback: feedback.trim() || undefined
        }
      );
      onGradeSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade submission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{activity.title}</h2>
              <p className="text-sm text-gray-500">{submission.student.name}</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {language.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {isRunning && (
              <button
                onClick={handleStop}
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            )}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Student's Code (Read-Only)
            </h3>
          </div>
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div
              ref={lineNumbersRef}
              className="bg-gray-50 border-r border-gray-200 select-none overflow-hidden flex-shrink-0"
              style={{ width: '60px' }}
            >
              <div className="py-3 pr-2 text-right">
                {lineNumbers.map((num) => {
                  const hasError = compilationErrors.some(err => err.line === num);
                  const error = compilationErrors.find(err => err.line === num);
                  
                  return (
                    <div
                      key={num}
                      className={`text-xs font-mono ${hasError ? 'text-red-600 font-bold' : 'text-gray-400'}`}
                      style={{ height: '24px', minHeight: '24px', lineHeight: '24px' }}
                      title={hasError ? error?.message : ''}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden min-h-0">
              <div
                ref={highlightRef}
                className="absolute inset-0 px-4 py-3 text-sm font-mono overflow-hidden whitespace-pre pointer-events-none"
                style={{ lineHeight: '24px' }}
              >
                {highlightCode(code, language, compilationErrors)}
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                readOnly
                onScroll={handleScroll}
                className="absolute inset-0 px-4 py-3 bg-transparent text-sm font-mono text-transparent resize-none focus:outline-none overflow-auto whitespace-pre cursor-default"
                style={{ 
                  lineHeight: '24px',
                  caretColor: 'transparent'
                }}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Console and Grading Panel */}
        <div className="w-96 flex flex-col overflow-hidden">
          {/* Console */}
          <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
            <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Console Output
              </h3>
            </div>
            <div 
              ref={consoleRef}
              className="flex-1 overflow-auto min-h-0 focus:outline-none p-4"
              tabIndex={0}
              onKeyDown={handleConsoleKeyDown}
              style={{ cursor: isRunning ? 'text' : 'default' }}
            >
              <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap">
                {output || 'Click "Run Code" to test the student\'s submission.\n\nWhen the program asks for input, type directly here and press Enter.'}
                {isRunning && <span className="text-green-400">{currentInput}</span>}
                {isRunning && <span className="animate-pulse text-green-400">█</span>}
              </pre>
            </div>
          </div>

          {/* Grading Panel */}
          <div className="border-t border-gray-200 bg-white overflow-y-auto" style={{ maxHeight: '50%' }}>
            <div className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Grade Submission</h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmitGrade} className="space-y-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade (out of {activity.points} points)
                  </label>
                  <input
                    id="grade"
                    type="number"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder={`0 - ${activity.points}`}
                    min="0"
                    max={activity.points}
                    step="0.5"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  />
                </div>

                {submission.grade !== undefined && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-2">CURRENT GRADE</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {submission.grade}/{activity.points}
                    </p>
                    {submission.feedback && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-1">PREVIOUS FEEDBACK</p>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : submission.grade !== undefined ? 'Update Grade' : 'Grade Submission'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
