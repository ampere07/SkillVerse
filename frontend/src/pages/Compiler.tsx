import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Menu, BookOpen, X, Square, Lightbulb, ArrowLeft, Save, Send } from 'lucide-react';
import UnsavedChangesModal from '../components/UnsavedChangesModal';
import { io, Socket } from 'socket.io-client';
import {
  JAVA_SUGGESTIONS,
  highlightJavaCode,
  findMissingImports,
  findLinesWithMissingImports,
  findUnusedImports,
  MissingImport,
  CompilationError as JavaCompilationError
} from '../utils/javaUtils';
import {
  PYTHON_SUGGESTIONS,
  highlightPythonCode,
  CompilationError as PythonCompilationError
} from '../utils/pythonUtils';

type CompilationError = JavaCompilationError | PythonCompilationError;

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' }
];

const DEFAULT_CODE: Record<string, string> = {
  python: `# Python Code
def greet(name):
    return f"Hello, {name}!"

print(greet('World'))`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        
        System.out.print("Enter your age: ");
        int age = scanner.nextInt();
        
        System.out.println("Hello, " + name + "!");
        System.out.println("You are " + age + " years old.");
        
        scanner.close();
    }
}`
};



interface Library {
  filename: string;
  name: string;
  version: string;
}

interface Suggestion {
  text: string;
  type: 'import' | 'keyword' | 'method' | 'auto-import';
  description?: string;
  className?: string;
}

const highlightCode = (code: string, language: string, errors: CompilationError[] = [], warningLines: Set<number> = new Set()) => {
  if (language === 'java') {
    return highlightJavaCode(code, errors, warningLines);
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

interface ProjectDetails {
  title: string;
  description: string;
  language: string;
  requirements: string;
}

interface CompilerProps {
  onMenuClick: () => void;
  projectDetails?: ProjectDetails;
  onBack?: () => void;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
  isActivityMode?: boolean;
}

const Compiler = forwardRef<any, CompilerProps>(({ onMenuClick, projectDetails, onBack, onHasUnsavedChanges, isActivityMode = false }, ref) => {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(DEFAULT_CODE.java);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [showLibraries, setShowLibraries] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [currentLine, setCurrentLine] = useState(0);
  const [missingImports, setMissingImports] = useState<MissingImport[]>([]);
  const [compilationErrors, setCompilationErrors] = useState<CompilationError[]>([]);
  const [lineSuggestions, setLineSuggestions] = useState<Map<number, { suggestions: Suggestion[], cursorPos: { top: number, left: number } }>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [highlightedBrackets, setHighlightedBrackets] = useState<{start: number, end: number} | null>(null);
  const [typedFeedback, setTypedFeedback] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{type: 'ai' | 'user', text: string}>>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastHintTime, setLastHintTime] = useState<number>(0);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    saveProgress: handleSaveProgress,
    getCode: () => code
  }));
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const bracketHighlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectDetails) {
      const projectLang = projectDetails.language.toLowerCase();
      setLanguage(projectLang);
      loadSavedProgress();
    }
  }, [projectDetails]);

  const loadSavedProgress = async () => {
    if (!projectDetails) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/mini-projects/project-progress/${encodeURIComponent(projectDetails.title)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.found && data.task.codeBase) {
        setCode(data.task.codeBase);
      } else {
        const projectLang = projectDetails.language.toLowerCase();
        setCode(DEFAULT_CODE[projectLang] || DEFAULT_CODE.java);
      }
    } catch (error) {
      const projectLang = projectDetails.language.toLowerCase();
      setCode(DEFAULT_CODE[projectLang] || DEFAULT_CODE.java);
    }
  };

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
    
    if (language === 'java') {
      const missing = findMissingImports(code);
      setMissingImports(missing);
    } else {
      setMissingImports([]);
    }
  }, [code, language]);

  useEffect(() => {
    fetchLibraries();
  }, []);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      // Connected to server
    });

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
      
      // Restore AI assistant after execution completes
      if (projectDetails && !isActivityMode) {
        setTimeout(() => {
          setAiMessages([]);
          startStreamingMessage('Great! Your code finished running. I\'m here if you need help with anything else!');
          setLastHintTime(Date.now());
        }, 500);
      }
    });

    newSocket.on('compilation-error', (data: { errors: CompilationError[] }) => {
      setCompilationErrors(data.errors);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // AI Hint Timer - runs every 30 seconds when not running code
  useEffect(() => {
    if (!projectDetails || isRunning || isActivityMode) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastHintTime >= 30000) {
        analyzeCodeAndGiveHint();
        setLastHintTime(now);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [projectDetails, isRunning, code, lastHintTime, isActivityMode]);

  const sendAiGreeting = () => {
    const greeting = `Hello! I'm your SkillVerse coding assistant. I'll analyze your code and provide hints to help you complete the project. Let me know if you need help!`;
    setAiMessages([{ type: 'ai', text: greeting }]);
  };

  const analyzeCodeAndGiveHint = async () => {
    if (!projectDetails || isRunning || isAiThinking || isStreaming || isActivityMode) return;
    
    setIsAiThinking(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/compiler/analyze-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          projectTitle: projectDetails.title,
          requirements: projectDetails.requirements,
          language: projectDetails.language
        })
      });

      const data = await response.json();
      
      if (response.ok && data.hint) {
        setIsAiThinking(false);
        startStreamingMessage(data.hint);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setIsAiThinking(false);
    }
  };

  const startStreamingMessage = (message: string) => {
    setIsStreaming(true);
    setStreamingText('');
    setAiMessages([]);
    
    let currentIndex = 0;
    
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }
    
    streamingIntervalRef.current = setInterval(() => {
      if (currentIndex < message.length) {
        setStreamingText(message.substring(0, currentIndex + 1));
        currentIndex++;
        
        if (consoleRef.current) {
          consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
      } else {
        setIsStreaming(false);
        setAiMessages([{ type: 'ai', text: message }]);
        setStreamingText('');
        
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
        
        setTimeout(() => {
          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
        }, 100);
      }
    }, 20);
  };

  useEffect(() => {
    if (isRunning && consoleRef.current) {
      consoleRef.current.focus();
    }
  }, [isRunning, output]);

  const fetchLibraries = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/compiler/libraries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setLibraries(data.libraries);
      }
    } catch (error) {
      // Error fetching libraries
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage]);
    setOutput('');
    setCurrentInput('');
    setShowSuggestions(false);
  };

  const handleRun = () => {
    if (!socket) {
      setOutput('Error: Not connected to server');
      return;
    }

    setOutput('');
    setCurrentInput('');
    setCompilationErrors([]);
    setIsRunning(true);
    
    // Clear AI messages and stop streaming when running code
    if (projectDetails && !isActivityMode) {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
      setAiMessages([]);
      setIsStreaming(false);
      setStreamingText('');
    }
    
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
      
      // Restore AI assistant after stopping
      if (projectDetails && !isActivityMode) {
        setTimeout(() => {
          setAiMessages([]);
          startStreamingMessage('Code execution stopped. I\'m back to help! Ask me anything or I\'ll analyze your code in 30 seconds.');
          setLastHintTime(Date.now());
        }, 500);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

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

  const getSuggestions = (text: string, cursorPos: number): Suggestion[] => {
    const beforeCursor = text.substring(0, cursorPos);
    const currentLine = beforeCursor.split('\n').pop() || '';
    
    const allSuggestions: Suggestion[] = [];
    const suggestions = language === 'java' ? JAVA_SUGGESTIONS : PYTHON_SUGGESTIONS;

    if (currentLine.trim().startsWith('import ') || currentLine.includes('import ') || currentLine.includes('from ')) {
      const importText = currentLine.includes('import ') 
        ? currentLine.substring(currentLine.lastIndexOf('import ') + 7)
        : currentLine.substring(currentLine.lastIndexOf('from ') + 5);
      suggestions.imports.forEach(imp => {
        if (imp.toLowerCase().includes(importText.toLowerCase())) {
          allSuggestions.push({
            text: imp,
            type: 'import',
            description: 'Import statement'
          });
        }
      });
    }

    const lastWord = currentLine.split(/[\s\(\)\{\}\[\];,:]/).pop() || '';
    
    if (lastWord.length >= 2) {
      suggestions.keywords.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(lastWord.toLowerCase())) {
          allSuggestions.push({
            text: keyword,
            type: 'keyword',
            description: 'Keyword'
          });
        }
      });

      suggestions.methods.forEach(method => {
        if (method.toLowerCase().startsWith(lastWord.toLowerCase())) {
          allSuggestions.push({
            text: method,
            type: 'method',
            description: 'Method'
          });
        }
      });
    }

    return allSuggestions.slice(0, 10);
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLineNumber = lines.length;
    const currentLineText = lines[lines.length - 1];
    
    const lineHeight = 24;
    const charWidth = 8;
    
    const top = (currentLineNumber - 1) * lineHeight + 30;
    const left = currentLineText.length * charWidth + 70;
    
    setCursorPosition({ top, left });
    setCurrentLine(currentLineNumber);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    // Mark as having unsaved changes
    if (projectDetails) {
      setHasUnsavedChanges(true);
      if (onHasUnsavedChanges) {
        onHasUnsavedChanges(true);
      }
    }
    
    // Clear bracket highlighting when typing
    setHighlightedBrackets(null);
    
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newCode.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const newLineNumber = lines.length;
    
    // Check if we're on the same line
    if (newLineNumber !== currentLine) {
      // Moved to a different line, hide suggestions but don't clear line cache
      setShowSuggestions(false);
      setCurrentLine(newLineNumber);
      
      // Check if this line has cached suggestions
      const cachedData = lineSuggestions.get(newLineNumber);
      if (cachedData && cachedData.suggestions.length > 0) {
        setSuggestions(cachedData.suggestions);
        setCursorPosition(cachedData.cursorPos);
        setShowSuggestions(true);
        setSelectedSuggestion(0);
      }
      return;
    }
    
    const newSuggestions = getSuggestions(newCode, cursorPos);
    
    if (newSuggestions.length > 0) {
      updateCursorPosition();
      const pos = { top: 0, left: 0 };
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
        const lines = textBeforeCursor.split('\n');
        const currentLineNumber = lines.length;
        const currentLineText = lines[lines.length - 1];
        
        const lineHeight = 24;
        const charWidth = 8;
        
        pos.top = (currentLineNumber - 1) * lineHeight + 30;
        pos.left = currentLineText.length * charWidth + 70;
      }
      
      // Store suggestions for this line
      const newLineSuggestions = new Map(lineSuggestions);
      newLineSuggestions.set(newLineNumber, { suggestions: newSuggestions, cursorPos: pos });
      setLineSuggestions(newLineSuggestions);
      
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
      setSelectedSuggestion(0);
      setCursorPosition(pos);
    } else {
      setShowSuggestions(false);
      // Clear suggestions for this line
      const newLineSuggestions = new Map(lineSuggestions);
      newLineSuggestions.delete(newLineNumber);
      setLineSuggestions(newLineSuggestions);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;

    // Clear bracket highlighting on any key press
    if (highlightedBrackets) {
      setHighlightedBrackets(null);
    }

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const textBefore = code.substring(0, cursorPos);
    const textAfter = code.substring(cursorPos);
    const nextChar = textAfter[0];

    // Handle Ctrl+/ for commenting/uncommenting
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      
      const commentPrefix = language === 'python' ? '#' : '//';
      const commentRegex = language === 'python' ? /^(\s*)?#\s?/ : /^(\s*)?\/\/\s?/;
      const commentCheck = language === 'python' 
        ? (line: string) => line.trim().startsWith('#')
        : (line: string) => line.trim().startsWith('//');
      
      const hasSelection = cursorPos !== selectionEnd;
      const selectedText = code.substring(cursorPos, selectionEnd);
      
      if (hasSelection) {
        const beforeSelection = code.substring(0, cursorPos);
        const afterSelection = code.substring(selectionEnd);
        
        const lines = selectedText.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        const allCommented = nonEmptyLines.length > 0 && nonEmptyLines.every(commentCheck);
        
        const newLines = lines.map(line => {
          if (line.trim().length === 0) {
            return line;
          }
          
          if (allCommented) {
            return line.replace(commentRegex, '$1');
          } else {
            const match = line.match(/^(\s*)/);
            const indent = match ? match[1] : '';
            const restOfLine = line.substring(indent.length);
            return indent + commentPrefix + ' ' + restOfLine;
          }
        });
        
        const newSelectedText = newLines.join('\n');
        const newCode = beforeSelection + newSelectedText + afterSelection;
        setCode(newCode);
        
        setTimeout(() => {
          textarea.setSelectionRange(cursorPos, cursorPos + newSelectedText.length);
        }, 0);
      } else {
        const lines = code.split('\n');
        const beforeCursor = code.substring(0, cursorPos);
        const currentLineIndex = beforeCursor.split('\n').length - 1;
        const currentLine = lines[currentLineIndex];
        
        const isCommented = commentCheck(currentLine);
        
        let newLine;
        if (isCommented) {
          newLine = currentLine.replace(commentRegex, '$1');
        } else {
          const match = currentLine.match(/^(\s*)/);
          const indent = match ? match[1] : '';
          const restOfLine = currentLine.substring(indent.length);
          newLine = indent + commentPrefix + ' ' + restOfLine;
        }
        
        lines[currentLineIndex] = newLine;
        const newCode = lines.join('\n');
        setCode(newCode);
        
        setTimeout(() => {
          const linesBefore = lines.slice(0, currentLineIndex).join('\n');
          const newCursorPos = linesBefore.length + (linesBefore ? 1 : 0) + newLine.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
      return;
    }

    // Handle Tab key - insert spaces instead of tab character
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indentation (un-indent)
        const lines = textBefore.split('\n');
        const currentLine = lines[lines.length - 1];
        const beforeCurrentLine = textBefore.substring(0, textBefore.length - currentLine.length);
        
        // Remove up to 2 spaces from the beginning of the current line
        const spacesToRemove = currentLine.match(/^( {1,2})/);
        if (spacesToRemove) {
          const newCurrentLine = currentLine.substring(spacesToRemove[1].length);
          const newCode = beforeCurrentLine + newCurrentLine + textAfter;
          setCode(newCode);
          
          setTimeout(() => {
            const newPos = cursorPos - spacesToRemove[1].length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        }
      } else if (showSuggestions) {
        // Tab with suggestions: insert suggestion
        insertSuggestion(suggestions[selectedSuggestion]);
      } else {
        // Tab without suggestions: insert spaces
        const spaces = '  '; // 2 spaces (you can change to '    ' for 4 spaces)
        const newCode = textBefore + spaces + textAfter;
        setCode(newCode);
        
        setTimeout(() => {
          textarea.setSelectionRange(cursorPos + spaces.length, cursorPos + spaces.length);
        }, 0);
      }
      return;
    }

    // Hide suggestions when navigating with arrow keys (not when suggestions are open)
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !showSuggestions) {
      // Let the handleCodeChange detect line changes and hide suggestions
    }

    // Handle auto-closing brackets
    const closingPairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'"
    };

    // Auto-close brackets, braces, and quotes
    if (closingPairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const closing = closingPairs[e.key];
      const newCode = textBefore + e.key + closing + textAfter;
      setCode(newCode);
      
      setTimeout(() => {
        textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
      }, 0);
      return;
    }

    // Skip over closing bracket if it's already there
    if ((e.key === ')' || e.key === ']' || e.key === '}' || e.key === '"' || e.key === "'") && nextChar === e.key) {
      e.preventDefault();
      textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
      return;
    }

    // Handle suggestions
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestion]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const insertSuggestion = (suggestion: Suggestion) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBefore = code.substring(0, cursorPos);
    const textAfter = code.substring(cursorPos);
    
    let newText = '';
    let newCursorPos = cursorPos;

    if (suggestion.type === 'import') {
      const lines = textBefore.split('\n');
      const currentLine = lines[lines.length - 1];
      const beforeImport = textBefore.substring(0, textBefore.length - currentLine.length);
      newText = beforeImport + suggestion.text + textAfter;
      newCursorPos = beforeImport.length + suggestion.text.length;
    } else {
      // Find the partial text that the user has typed
      const lastWord = textBefore.split(/[\s\(\)\{\}\[\];,]/).pop() || '';
      const beforeWord = textBefore.substring(0, textBefore.length - lastWord.length);
      
      // Check if suggestion starts with what user typed (case insensitive)
      const suggestionLower = suggestion.text.toLowerCase();
      const lastWordLower = lastWord.toLowerCase();
      
      if (suggestionLower.startsWith(lastWordLower)) {
        // Replace the partial text with the full suggestion
        newText = beforeWord + suggestion.text + textAfter;
        newCursorPos = beforeWord.length + suggestion.text.length;
      } else {
        // Just insert the suggestion after current position
        newText = textBefore + suggestion.text + textAfter;
        newCursorPos = textBefore.length + suggestion.text.length;
      }
    }

    setCode(newText);
    setShowSuggestions(false);
    
    // Clear cached suggestions for current line since we just inserted
    const newLineSuggestions = new Map(lineSuggestions);
    newLineSuggestions.delete(currentLine);
    setLineSuggestions(newLineSuggestions);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const addMissingImport = (importStatement: string) => {
    // Find where to insert the import (after package if exists, or at the top)
    const lines = code.split('\n');
    let insertIndex = 0;
    
    // Find the last import line or package line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('package ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() && !lines[i].trim().startsWith('//')) {
        break;
      }
    }
    
    // Insert the import
    lines.splice(insertIndex, 0, importStatement);
    const newCode = lines.join('\n');
    setCode(newCode);
    
    // Focus back to editor
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCursorMove = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = code.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const newLineNumber = lines.length;
    
    // If we moved to a different line
    if (newLineNumber !== currentLine) {
      setShowSuggestions(false);
      setCurrentLine(newLineNumber);
      
      // Check if this line has cached suggestions
      const cachedData = lineSuggestions.get(newLineNumber);
      if (cachedData && cachedData.suggestions.length > 0) {
        setSuggestions(cachedData.suggestions);
        setCursorPosition(cachedData.cursorPos);
        setShowSuggestions(true);
        setSelectedSuggestion(0);
      }
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current && highlightRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      
      lineNumbersRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
      
      if (bracketHighlightRef.current) {
        bracketHighlightRef.current.scrollTop = scrollTop;
        bracketHighlightRef.current.scrollLeft = scrollLeft;
      }
    }
  };

  const findMatchingBracket = (text: string, clickPos: number): {start: number, end: number} | null => {
    const char = text[clickPos];
    const bracketPairs: Record<string, string> = {
      '{': '}',
      '}': '{',
      '[': ']',
      ']': '[',
      '(': ')',
      ')': '('
    };

    if (!bracketPairs[char]) return null;

    const isOpening = ['{', '[', '('].includes(char);
    const matchChar = bracketPairs[char];
    const direction = isOpening ? 1 : -1;
    let count = 1;
    let pos = clickPos + direction;

    while (pos >= 0 && pos < text.length) {
      const currentChar = text[pos];
      
      if (currentChar === char) {
        count++;
      } else if (currentChar === matchChar) {
        count--;
        if (count === 0) {
          return isOpening 
            ? {start: clickPos, end: pos}
            : {start: pos, end: clickPos};
        }
      }
      
      pos += direction;
    }

    return null;
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;

    const clickPos = textareaRef.current.selectionStart;
    const matched = findMatchingBracket(code, clickPos);
    
    setHighlightedBrackets(matched);
  };

  const handleSaveProgress = async () => {
    if (!projectDetails || isSaving) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveMessage('Error: Not authenticated');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/mini-projects/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectTitle: projectDetails.title,
          codeBase: code
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage('Progress saved successfully');
        setHasUnsavedChanges(false);
        if (onHasUnsavedChanges) {
          onHasUnsavedChanges(false);
        }
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(data.message || 'Error saving progress');
      }
    } catch (error) {
      setSaveMessage('Error saving progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackClick = () => {
    if (projectDetails && hasUnsavedChanges) {
      setPendingNavigation(() => onBack || (() => {}));
      setShowNavigationWarning(true);
    } else if (onBack) {
      onBack();
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const handleConfirmNavigation = () => {
    setShowNavigationWarning(false);
    if (pendingNavigation) {
      pendingNavigation();
    }
    setPendingNavigation(null);
  };

  const handleSaveAndNavigate = async () => {
    if (!projectDetails || isSaving) return;

    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/mini-projects/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectTitle: projectDetails.title,
          codeBase: code
        })
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        if (onHasUnsavedChanges) {
          onHasUnsavedChanges(false);
        }
        setShowNavigationWarning(false);
        if (pendingNavigation) {
          pendingNavigation();
        }
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!projectDetails || isSaving || isGrading) return;
    setShowSubmitConfirmModal(true);
  };

  const confirmSubmitProject = async () => {
    setShowSubmitConfirmModal(false);
    setIsSaving(true);
    setIsGrading(true);
    setSaveMessage('Submitting and grading your project...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveMessage('Error: Not authenticated');
        setIsGrading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/mini-projects/submit-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectTitle: projectDetails.title,
          codeBase: code
        })
      });

      const data = await response.json();

      if (response.ok) {
        setGradingResult(data.gradingResult);
        setShowGradingModal(true);
        setSaveMessage('');
        
        // Start typing effect
        setTypedFeedback('');
        setIsTyping(true);
        const fullText = data.gradingResult.feedback || '';
        let currentIndex = 0;
        
        const typingInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            setTypedFeedback(fullText.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            setIsTyping(false);
            clearInterval(typingInterval);
          }
        }, 20);
      } else {
        setSaveMessage(data.message || 'Error submitting project');
      }
    } catch (error) {
      setSaveMessage('Error submitting project');
    } finally {
      setIsSaving(false);
      setIsGrading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Project Details Banner */}
      {projectDetails && !isActivityMode && (
        <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {onBack && (
                  <button
                    onClick={handleBackClick}
                    className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-base font-semibold text-gray-900">{projectDetails.title}</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {projectDetails.language}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{projectDetails.description}</p>
              {projectDetails.requirements && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Requirements:</p>
                  <div className="text-xs text-gray-600 whitespace-pre-line">
                    {projectDetails.requirements}
                  </div>
                </div>
              )}
            </div>
          </div>
          {saveMessage && (
            <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.includes('Error') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      )}
      
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!projectDetails && !isActivityMode && (
              <button
                onClick={onMenuClick}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {!isActivityMode && (
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRunning || !!projectDetails}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {projectDetails && !isActivityMode && (
              <>
                <button
                  onClick={handleSaveProgress}
                  disabled={isSaving}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save Progress"
                >
                  <Save className="w-5 h-5" />
                  {hasUnsavedChanges && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={handleSubmitProject}
                  disabled={isSaving || isGrading}
                  className="flex items-center gap-1.5 px-2 py-2 text-gray-600 hover:text-gray-900 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Submit Project"
                >
                  <Send className="w-5 h-5" />
                  <span className="text-sm font-medium">{isGrading ? 'Grading...' : isSaving ? 'Submitting...' : 'Submit'}</span>
                </button>
              </>
            )}
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

      {/* Missing Imports Banner */}
      {language === 'java' && missingImports.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">
                Missing imports detected: {missingImports.map(m => m.className).join(', ')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {missingImports.map((missing, index) => (
                <button
                  key={index}
                  onClick={() => addMissingImport(missing.importStatement)}
                  className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Add {missing.className}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Libraries Panel */}
      {showLibraries && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">Available Libraries</h4>
            <button
              onClick={() => setShowLibraries(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {libraries.map((lib) => (
              <div
                key={lib.filename}
                className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="text-xs font-medium text-gray-900">{lib.name}</div>
                <div className="text-xs text-gray-500">v{lib.version}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Import these libraries in your Java code. Missing imports will be suggested automatically.
          </div>
        </div>
      )}

      {/* Editor and Output */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden" style={{ height: isActivityMode ? '100%' : (projectDetails ? 'calc(100vh - 300px)' : 'calc(100vh - 200px)') }}>
        {/* Code Editor */}
        <div className="flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Code Editor {language === 'java'}
            </h3>
          </div>
          <div className="flex-1 flex overflow-hidden min-h-0 relative">
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="bg-gray-50 border-r border-gray-200 select-none overflow-hidden flex-shrink-0"
              style={{ width: '60px' }}
            >
              <div className="py-3 pr-2 text-right">
                {(() => {
                  const linesWithMissingImports = findLinesWithMissingImports(code, missingImports);
                  const unusedImports = findUnusedImports(code);
                  
                  return lineNumbers.map((num) => {
                    const hasError = compilationErrors.some(err => err.line === num);
                    const error = compilationErrors.find(err => err.line === num);
                    const hasMissingImport = !hasError && linesWithMissingImports.has(num);
                    const hasUnusedImport = !hasError && !hasMissingImport && unusedImports.has(num);
                    const hasWarning = hasMissingImport || hasUnusedImport;
                    
                    return (
                    <div
                      key={num}
                      className={`text-xs font-mono flex items-center justify-end space-x-1 ${
                        hasError ? 'text-red-600 font-bold' : 
                        hasWarning ? 'text-yellow-600 font-bold' : 
                        'text-gray-400'
                      }`}
                      style={{ height: '24px', minHeight: '24px', lineHeight: '24px' }}
                      title={
                        hasError ? error?.message : 
                        hasMissingImport ? 'Missing import - click the lightbulb icon above to add' :
                        hasUnusedImport ? 'Unused import' :
                        ''
                      }
                    >
                      <span>{num}</span>
                    </div>
                  );
                });
              })()}
              </div>
            </div>
            {/* Code Area */}
            <div className="flex-1 relative overflow-hidden min-h-0">
              {/* Syntax Highlighted Display */}
              <div
                ref={highlightRef}
                className="absolute inset-0 px-4 py-3 text-sm font-mono overflow-hidden whitespace-pre pointer-events-none"
                style={{ lineHeight: '24px' }}
              >
                {highlightCode(
                  code, 
                  language, 
                  compilationErrors, 
                  new Set([...findLinesWithMissingImports(code, missingImports), ...findUnusedImports(code)])
                )}
              </div>
              
              {/* Bracket Matching Highlights */}
              {highlightedBrackets && (
                <div
                  ref={bracketHighlightRef}
                  className="absolute inset-0 px-4 py-3 text-sm font-mono overflow-hidden whitespace-pre pointer-events-none"
                  style={{ lineHeight: '24px' }}
                >
                  {(() => {
                    const beforeStart = code.substring(0, highlightedBrackets.start);
                    const startChar = code[highlightedBrackets.start];
                    const betweenBrackets = code.substring(highlightedBrackets.start + 1, highlightedBrackets.end);
                    const endChar = code[highlightedBrackets.end];
                    const afterEnd = code.substring(highlightedBrackets.end + 1);
                    
                    return (
                      <>
                        <span style={{ color: 'transparent' }}>{beforeStart}</span>
                        <span style={{
                          backgroundColor: '#fbbf24',
                          color: '#000000',
                          fontWeight: 'bold',
                          borderRadius: '2px',
                          padding: '0 1px'
                        }}>
                          {startChar}
                        </span>
                        <span style={{ color: 'transparent' }}>{betweenBrackets}</span>
                        <span style={{
                          backgroundColor: '#fbbf24',
                          color: '#000000',
                          fontWeight: 'bold',
                          borderRadius: '2px',
                          padding: '0 1px'
                        }}>
                          {endChar}
                        </span>
                        <span style={{ color: 'transparent' }}>{afterEnd}</span>
                      </>
                    );
                  })()}
                </div>
              )}
              
              {/* Input Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleCursorMove}
                onScroll={handleScroll}
                onClick={(e) => {
                  handleTextareaClick(e);
                  handleCursorMove();
                  updateCursorPosition();
                  setShowSuggestions(false);
                }}
                className="absolute inset-0 px-4 py-3 bg-transparent text-sm font-mono text-transparent caret-black resize-none focus:outline-none overflow-auto whitespace-pre"
                style={{ 
                  lineHeight: '24px',
                  caretColor: '#000000'
                }}
                spellCheck={false}
                placeholder="Write your code here..."
                disabled={isRunning}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-auto"
                  style={{
                    top: `${cursorPosition.top}px`,
                    left: `${cursorPosition.left}px`,
                    minWidth: '300px'
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                        index === selectedSuggestion ? 'bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => insertSuggestion(suggestion)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-mono text-gray-900">{suggestion.text}</span>
                        <span className="text-xs text-gray-500">{suggestion.description}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        suggestion.type === 'import' ? 'bg-purple-100 text-purple-700' :
                        suggestion.type === 'keyword' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {suggestion.type}
                      </span>
                    </div>
                  ))}
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                    ↑↓ Navigate • Tab/Enter Select • Esc Close
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Console */}
        <div className="flex flex-col bg-gray-900 overflow-hidden">
          <div className="px-1 py-1 bg-gray-800 border-b border-gray-700 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              {projectDetails && !isRunning ? 'SkillVerse Coding Assistant' : 'Interactive Console'}
            </h3>
          </div>
          
          {/* Console Area */}
          <div 
            ref={consoleRef}
            className="flex-1 overflow-auto min-h-0 focus:outline-none"
            tabIndex={0}
            onKeyDown={handleConsoleKeyDown}
            style={{ cursor: isRunning ? 'text' : 'default' }}
          >
            {projectDetails && !isRunning && !isActivityMode ? (
              // AI Assistant Mode
              <div className="space-y-2 p-2">
                {aiMessages.length === 0 && !isStreaming && !isAiThinking ? (
                  <div className="text-sm text-gray-400 font-mono">
                    Waiting for AI hints...
                  </div>
                ) : (
                  <>
                    {aiMessages.map((msg, index) => (
                      <div key={index} className="flex justify-start">
                        <div className="max-w-full">
                          <div className="text-xs font-semibold mb-1 text-gray-400">
                            SkillVerse Assistant
                          </div>
                          <div className="text-sm font-mono text-gray-100 whitespace-pre-wrap">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isStreaming && (
                      <div className="flex justify-start">
                        <div className="max-w-full">
                          <div className="text-xs font-semibold mb-1 text-gray-400">
                            SkillVerse Assistant
                          </div>
                          <div className="text-sm font-mono text-gray-100 whitespace-pre-wrap">
                            {streamingText}<span className="animate-pulse">|</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {isAiThinking && (
                      <div className="flex justify-start">
                        <div className="max-w-full">
                          <div className="text-xs font-semibold mb-1 text-gray-400">
                            SkillVerse Assistant
                          </div>
                          <div className="text-sm font-mono text-gray-100">
                            Analyzing your code<span className="animate-pulse">...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Regular Console Mode
              <div className="p-4">
                <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap">
                  {output || 'Click "Run Code" to execute your program.\n\nMissing imports are automatically detected!\nWhen the program asks for input, type directly here and press Enter.'}
                  {isRunning && <span className="text-green-400">{currentInput}</span>}
                  {isRunning && <span className="animate-pulse text-green-400">█</span>}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesModal
        isOpen={showNavigationWarning}
        onCancel={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        onSaveAndLeave={handleSaveAndNavigate}
        isSaving={isSaving}
      />

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Confirm Submission</h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to submit this project? The AI will grade your submission and you cannot edit it after submission.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmitProject}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Results Modal */}
      {showGradingModal && gradingResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Grading Results</h2>
                <button
                  onClick={() => {
                    setShowGradingModal(false);
                    if (onBack) onBack();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Section */}
              <div className="text-center py-4">
                <div className="text-6xl font-bold text-black mb-2">
                  {gradingResult.score}/100
                </div>
                <div className="text-lg font-semibold text-gray-600">
                  {gradingResult.passed ? 'You Passed!' : 'Keep Practicing!'}
                </div>
              </div>

              {/* AI Feedback with Typing Effect */}
              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="text-sm text-gray-800 whitespace-pre-line font-mono">
                  {typedFeedback}
                  {isTyping && <span className="animate-pulse">|</span>}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowGradingModal(false);
                  if (onBack) onBack();
                }}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Compiler.displayName = 'Compiler';

export default Compiler;
