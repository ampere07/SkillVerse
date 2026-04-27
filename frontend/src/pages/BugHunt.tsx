import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play,
    Menu,
    Send,
    Clock,
    Trophy,
    Bug,
    Zap,
    X,
    RotateCcw,
    SkipForward,
    Lightbulb,
    AlertCircle,
    Flag,
    HelpCircle,
    Info,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { highlightJavaCode, findMissingImports, findLinesWithMissingImports, findUnusedImports, MissingImport, JAVA_SUGGESTIONS } from '../utils/javaUtils';
import { highlightPythonCode, PYTHON_SUGGESTIONS } from '../utils/pythonUtils';
import { highlightCode } from '../utils/compilerUtils';
import { MissingImportsBanner } from '../components/CompilerComponents';

interface BugHuntChallenge {
    _id?: string;
    title: string;
    description: string;
    buggyCode: string;
    correctCode: string;
    hints: string[];
    difficulty: string;
    language: string;
    isFixed?: boolean;
}

interface Suggestion {
    text: string;
    type: "import" | "keyword" | "method" | "auto-import";
    description?: string;
    className?: string;
}

interface BugHuntProps {
    onMenuClick: () => void;
    onGameStatusChange?: (active: boolean) => void;
}

const BugHunt = ({ onMenuClick, onGameStatusChange }: BugHuntProps) => {
    const { user } = useAuth();

    // Tutorial highlighting styles
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.innerHTML = `
            @keyframes tutorial-pulse {
                0% { box-shadow: 0 0 20px 5px rgba(46, 125, 50, 0.4); outline-color: rgba(46, 125, 50, 0.4); }
                50% { box-shadow: 0 0 40px 15px rgba(46, 125, 50, 0.6); outline-color: rgba(46, 125, 50, 1); }
                100% { box-shadow: 0 0 20px 5px rgba(46, 125, 50, 0.4); outline-color: rgba(46, 125, 50, 0.4); }
            }
            .tutorial-highlight {
                position: relative !important;
                z-index: 350 !important;
                outline: 4px solid #2E7D32 !important;
                outline-offset: 4px !important;
                border-radius: 8px !important;
                pointer-events: none !important;
                opacity: 1 !important;
                animation: tutorial-pulse 2s infinite ease-in-out !important;
            }
            .custom-scrollbar-minimal::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar-minimal::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar-minimal::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 10px; }
        `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById('tutorial-styles');
            if (el) el.remove();
        };
    }, []);

    const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'completed'>('start');
    const [challenges, setChallenges] = useState<BugHuntChallenge[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [code, setCode] = useState('');
    const [timer, setTimer] = useState(0);
    const [isSurrendered, setIsSurrendered] = useState(false);
    const [hintsCount, setHintsCount] = useState(0);
    const [output, setOutput] = useState('');
    const [isCompiling, setIsCompiling] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isLastFixSuccessful, setIsLastFixSuccessful] = useState<boolean>(false);
    const [showHint, setShowHint] = useState(false);
    const [aiHint, setAiHint] = useState<string | null>(null);
    const [isRequestingHint, setIsRequestingHint] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [showSurrenderModal, setShowSurrenderModal] = useState(false);
    const [isProcessingSurrender, setIsProcessingSurrender] = useState(false);
    const [compilationErrors, setCompilationErrors] = useState<any[]>([]);
    const [missingImports, setMissingImports] = useState<MissingImport[]>([]);
    const [lineNumbers, setLineNumbers] = useState<number[]>([]);
    const [isHintHovered, setIsHintHovered] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
    const [currentLine, setCurrentLine] = useState(0);
    const [lineSuggestions, setLineSuggestions] = useState<Map<number, { suggestions: Suggestion[]; cursorPos: { top: number; left: number } }>>(new Map());
    const [showMobileBriefing, setShowMobileBriefing] = useState(false);

    const tutorialAudioRef = useRef<HTMLAudioElement | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const timerRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bug-hunt/leaderboard`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                console.error('Leaderboard fetch failed with status:', response.status);
                return;
            }

            const data = await response.json();
            if (data.success) {
                console.log('[BugHunt] Received leaderboard:', data.leaderboard);
                setLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    }, []);

    useEffect(() => {
        if (gameState === 'start') {
            fetchLeaderboard();
        }
    }, [gameState, fetchLeaderboard]);

    useEffect(() => {
        // Setup socket for code execution
        const apiUrl = import.meta.env.VITE_API_URL;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        const baseUrl = (apiUrl && (isLocalhost || !apiUrl.includes('localhost')))
            ? apiUrl.replace('/api', '')
            : 'https://skillverse-ogv1.onrender.com';
        
        console.log(`[BugHunt] Connecting to socket at: ${baseUrl}`);

        const socket = io(baseUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[BugHunt] Socket connected successfully');
        });

        socket.on('connect_error', (err) => {
            console.error('[BugHunt] Socket connection error:', err.message);
            setOutput(prev => prev + `\n[System] Connection error: ${err.message}. Retrying...\n`);
        });

        socket.on('output', (payload: any) => {
            const data = typeof payload === 'string' ? payload : payload.data;
            const type = typeof payload === 'string' ? 'stdout' : payload.type;

            if (type === 'error' || type === 'stderr') {
                setOutput(prev => prev + `\n[ERROR] ${data}`);
            } else if (type === 'info') {
                setOutput(prev => prev + `\n[INFO] ${data}`);
            } else {
                setOutput(prev => prev + data);
            }
        });

        socket.on('compilation-error', (data: any) => {
            if (data.errors && data.errors.length > 0) {
                setCompilationErrors(data.errors);
                const errorDetails = data.errors.map((err: any) =>
                    `Line ${err.line}: ${err.message}${err.context ? `\n  > ${err.context}` : ''}`
                ).join('\n\n');
                setOutput(prev => prev + `\n\n[COMPILATION FAILED]\n${errorDetails}`);
            } else {
                setCompilationErrors([]);
            }
        });

        socket.on('error', (payload: any) => {
            const data = typeof payload === 'string' ? payload : payload.data;
            setOutput(prev => prev + `\n\n[SYSTEM ERROR] ${data}`);
        });

        socket.on('exit', (payload: any) => {
            const code = typeof payload === 'number' ? payload : payload.code;
            setIsCompiling(false);
            setOutput(prev => prev + `\n\n[PROCESS] Program exited with code ${code}`);
        });

        socket.on('execution-complete', () => {
            setIsCompiling(false);
        });

        return () => {
            socket.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        const linesCount = code.split('\n').length;
        setLineNumbers(Array.from({ length: linesCount }, (_, i) => i + 1));

        if (challenges[currentIndex]?.language === 'java') {
            const missing = findMissingImports(code);
            setMissingImports(missing);
        } else {
            setMissingImports([]);
        }
    }, [code, challenges, currentIndex]);

    const addMissingImport = (missing: MissingImport) => {
        const importText = missing.importStatement;
        
        if (code.includes(importText)) {
            setMissingImports(prev => prev.filter(imp => imp.className !== missing.className));
            return;
        }

        const lines = code.split('\n');
        const packageLineIndex = lines.findIndex(line => line.trim().startsWith('package '));
        const newCode = lines.slice();

        if (packageLineIndex !== -1) {
            newCode.splice(packageLineIndex + 1, 0, importText);
        } else {
            newCode.unshift(importText);
        }

        setCode(newCode.join('\n'));
    };

    const getSuggestions = (text: string, cursorPos: number): Suggestion[] => {
        const language = challenges[currentIndex]?.language || 'java';
        const beforeCursor = text.substring(0, cursorPos);
        const currentLineStr = beforeCursor.split('\n').pop() || '';

        const allSuggestions: Suggestion[] = [];
        const langSuggestions = language === 'java' ? JAVA_SUGGESTIONS : PYTHON_SUGGESTIONS;

        if (currentLineStr.trim().startsWith('import ') || currentLineStr.includes('import ') || currentLineStr.includes('from ')) {
            const importText = currentLineStr.includes('import ') ? currentLineStr.substring(currentLineStr.lastIndexOf('import ') + 7) : currentLineStr.substring(currentLineStr.lastIndexOf('from ') + 5);
            langSuggestions.imports.forEach(imp => {
                if (imp.toLowerCase().includes(importText.toLowerCase())) {
                    allSuggestions.push({ text: imp, type: 'import', description: 'Import statement' });
                }
            });
        }

        const lastWord = currentLineStr.split(/[\s(){}[\];,:]/).pop() || '';
        if (lastWord.length >= 2) {
            langSuggestions.keywords.forEach(keyword => {
                if (keyword.toLowerCase().startsWith(lastWord.toLowerCase())) {
                    allSuggestions.push({ text: keyword, type: 'keyword', description: 'Keyword' });
                }
            });
            langSuggestions.methods.forEach(method => {
                if (method.toLowerCase().startsWith(lastWord.toLowerCase())) {
                    allSuggestions.push({ text: method, type: 'method', description: 'Method' });
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
        const top = (currentLineNumber - 1) * lineHeight + 30; // approx padding
        const left = currentLineText.length * charWidth + 30;

        setCursorPosition({ top, left });
        setCurrentLine(currentLineNumber);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newCode = e.target.value;
        setCode(newCode);

        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = newCode.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const newLineNumber = lines.length;

        if (newLineNumber !== currentLine) {
            setShowSuggestions(false);
            setCurrentLine(newLineNumber);

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
                const textBeforeCur = textarea.value.substring(0, textarea.selectionStart);
                const lns = textBeforeCur.split('\n');
                const curLineNum = lns.length;
                const curLineText = lns[lns.length - 1];

                const lineHeight = 24;
                const charWidth = 8;
                pos.top = (curLineNum - 1) * lineHeight + 30;
                pos.left = curLineText.length * charWidth + 30;
            }

            const newLineSuggestions = new Map(lineSuggestions);
            newLineSuggestions.set(newLineNumber, { suggestions: newSuggestions, cursorPos: pos });
            setLineSuggestions(newLineSuggestions);

            setSuggestions(newSuggestions);
            setShowSuggestions(true);
            setSelectedSuggestion(0);
            setCursorPosition(pos);
        } else {
            setShowSuggestions(false);
            const newLineSuggestions = new Map(lineSuggestions);
            newLineSuggestions.delete(newLineNumber);
            setLineSuggestions(newLineSuggestions);
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
            const curLine = lines[lines.length - 1];
            const beforeImport = textBefore.substring(0, textBefore.length - curLine.length);
            newText = beforeImport + suggestion.text + textAfter;
            newCursorPos = beforeImport.length + suggestion.text.length;
        } else {
            const lastWord = textBefore.split(/[\s(){}[\];,]/).pop() || '';
            const beforeWord = textBefore.substring(0, textBefore.length - lastWord.length);
            
            const suggestionLower = suggestion.text.toLowerCase();
            const lastWordLower = lastWord.toLowerCase();

            if (suggestionLower.startsWith(lastWordLower)) {
                newText = beforeWord + suggestion.text + textAfter;
                newCursorPos = beforeWord.length + suggestion.text.length;
            } else {
                newText = textBefore + suggestion.text + textAfter;
                newCursorPos = textBefore.length + suggestion.text.length;
            }
        }

        setCode(newText);
        setShowSuggestions(false);

        const newLineSuggestions = new Map(lineSuggestions);
        newLineSuggestions.delete(currentLine);
        setLineSuggestions(newLineSuggestions);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBefore = code.substring(0, cursorPos);
        const textAfter = code.substring(cursorPos);
        const nextChar = textAfter[0];

        if (e.key === 'Tab') {
            e.preventDefault();
            if (showSuggestions) {
                insertSuggestion(suggestions[selectedSuggestion]);
            } else {
                const spaces = '  ';
                const newCode = textBefore + spaces + textAfter;
                setCode(newCode);
                setTimeout(() => {
                    textarea.setSelectionRange(cursorPos + spaces.length, cursorPos + spaces.length);
                }, 0);
            }
            return;
        }

        const closingPairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
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

        if ((e.key === ')' || e.key === ']' || e.key === '}' || e.key === '"' || e.key === "'") && nextChar === e.key) {
            e.preventDefault();
            textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
            return;
        }

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

    const handleCursorMove = () => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = code.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const newLineNumber = lines.length;

        if (newLineNumber !== currentLine) {
            setShowSuggestions(false);
            setCurrentLine(newLineNumber);

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
        }
    };

    useEffect(() => {
        const stepTargets = [
            null,
            'tutorial-mission-briefing',
            null,
            'tutorial-editor',
            ['tutorial-execute-btn', 'tutorial-hint-btn', 'tutorial-mission-control'],
            'tutorial-patch-btn', // 46s to 50s
            ['tutorial-timer', 'tutorial-score'], // 50s to 54s
            null
        ];

        if (showTutorial) {
            // Remove previous highlights
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

            const currentTargetIds = stepTargets[tutorialStep];
            if (currentTargetIds) {
                const ids = Array.isArray(currentTargetIds) ? currentTargetIds : [currentTargetIds];
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.classList.add('tutorial-highlight');
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }
        } else {
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        }
    }, [showTutorial, tutorialStep, gameState]);

    useEffect(() => {
        const audio = tutorialAudioRef.current;
        if (!audio || !showTutorial) return;

        const handleTimeUpdate = () => {
            const time = audio.currentTime;
            let nextStep = 0;

            if (time < 8) nextStep = 0;
            else if (time < 16) nextStep = 1;
            else if (time < 26) nextStep = 2;
            else if (time < 35) nextStep = 3;
            else if (time < 46) nextStep = 4;
            else if (time < 50) nextStep = 5;
            else if (time < 54) nextStep = 6;
            else nextStep = 7;

            if (nextStep !== tutorialStep) {
                setTutorialStep(nextStep);
            }
        };

        const handleEnded = () => {
            setShowTutorial(false);
            setGameState('start');
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [showTutorial, tutorialStep]);

    // Handle state transitions based on tutorial step
    useEffect(() => {
        if (!showTutorial) return;

        if (tutorialStep < 3) {
            setGameState('start');
        } else if (tutorialStep >= 3 && tutorialStep <= 6) {
            if (gameState !== 'playing') {
                setGameState('playing');
                setChallenges([{
                    title: "Tutorial Mission",
                    description: "Fix the missing semicolon to restore the signal.",
                    buggyCode: "public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello System\") // BUG: Missing semicolon\n    }\n}",
                    correctCode: "",
                    hints: ["Logic is sound, but syntax is critical.", "Check the end of the print statement."],
                    difficulty: "EASY",
                    language: "java"
                }]);
                setCode("public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello System\") // BUG: Missing semicolon\n    }\n}");
            }
        } else if (tutorialStep === 7) {
            setGameState('start');
        }
    }, [tutorialStep, showTutorial]);

    useEffect(() => {
        if (onGameStatusChange) {
            onGameStatusChange(gameState === 'playing' || gameState === 'loading' || showTutorial);
        }
    }, [gameState, onGameStatusChange, showTutorial]);

    const startSession = async () => {
        setGameState('loading');
        try {
            const token = localStorage.getItem('token');
            const lang = user?.primaryLanguage || 'java';
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bug-hunt/generate-session?language=${lang}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            console.log('[BugHunt] Session generated:', data);
            if (data.success && data.challenges && data.challenges.length > 0) {
                setSessionId(data.sessionId);
                setChallenges(data.challenges);
                setCurrentIndex(0);
                const firstCode = data.challenges[0].buggyCode;
                console.log('[BugHunt] First challenge raw code:', firstCode);

                // Enhanced newline cleaning
                let finalCode = typeof firstCode === 'string' ? firstCode : JSON.stringify(firstCode, null, 2);

                // Replace escaped newlines (both single and double backslash)
                finalCode = finalCode
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '')
                    .replace(/\\"/g, '"');

                setCode(finalCode);
                setGameState('playing');
                setTimer(0);
                setScore(0);
                startTimer();
            } else {
                throw new Error('No challenges received');
            }
        } catch (error) {
            console.error('Failed to start bug hunt:', error);
            alert('Failed to generate challenges. Please check your AI connection.');
            setGameState('start');
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const runCode = () => {
        if (!socketRef.current || !challenges[currentIndex]) return;
        
        console.log("[BugHunt] Run clicked. Socket status:", socketRef.current?.connected ? "Connected" : "Disconnected", "ID:", socketRef.current?.id);

        if (!socketRef.current.connected) {
            setOutput(prev => prev + "\n[System] Error: Not connected to execution server. Attempting to reconnect...\n");
            socketRef.current.connect();
            setIsCompiling(false);
            return;
        }

        setOutput('');
        setCompilationErrors([]);
        setIsCompiling(true);

        const lang = challenges[currentIndex].language;
        const event = lang === 'java' ? 'compile-java' : 'run-python';
        const token = localStorage.getItem('token');

        socketRef.current.emit(event, {
            code,
            userId: user?.id,
            sessionId: sessionId || `bughunt_${Date.now()}`,
            token,
            language: lang,
            input: ''
        });
    };

    const submitFix = async () => {
        if (isValidating || isCompiling || !sessionId) return;

        setIsValidating(true);
        setFeedback(null);
        setIsLastFixSuccessful(false);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bug-hunt/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sessionId,
                    challengeIndex: currentIndex,
                    code,
                    timeTaken: timer
                })
            });

            const data = await response.json();

            if (data.success && data.fixed) {
                // Check for Level Up
                if (data.leveledUp) {
                    window.dispatchEvent(new CustomEvent('level-up', {
                        detail: { level: data.newLevel }
                    }));
                }

                setScore(data.totalScore || score);
                setChallenges(prev => {
                    const newChallenges = [...prev];
                    if (newChallenges[currentIndex]) {
                        newChallenges[currentIndex] = { ...newChallenges[currentIndex], isFixed: true };
                    }
                    return newChallenges;
                });
                setIsLastFixSuccessful(true);
                setFeedback(data.feedback || "Bug Caught! Excellent work.");
                window.dispatchEvent(new CustomEvent('refresh-user'));
                setShowSuccessModal(true);
            } else {
                setFeedback(data.feedback || "Not quite. The bugs are still hiding! Keep looking.");
            }
        } catch (error) {
            setFeedback("Something went wrong testing your code.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleNextPhase = () => {
        setShowSuccessModal(false);
        if (currentIndex < challenges.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            const nextCode = challenges[nextIndex].buggyCode;

            let finalNextCode = typeof nextCode === 'string' ? nextCode : JSON.stringify(nextCode, null, 2);
            finalNextCode = finalNextCode
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\"/g, '"');

            setCode(finalNextCode);
            setCompilationErrors([]);
            setFeedback(null);
            setIsLastFixSuccessful(false);
            setShowHint(false);
            setAiHint(null);
        } else {
            setGameState('completed');
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const requestHint = async () => {
        if (!sessionId || isRequestingHint || score < 0) return;

        setIsRequestingHint(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bug-hunt/hint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sessionId,
                    challengeIndex: currentIndex,
                    currentCode: code
                })
            });
            const data = await response.json();
            if (data.success) {
                setAiHint(data.hint);
                setShowHint(true);
                // Reduce score for hint
                setScore(prev => prev - 10);
                setHintsCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to get hint:', error);
        } finally {
            setIsRequestingHint(false);
        }
    };

    const handleSurrender = async () => {
        if (!sessionId || isProcessingSurrender) return;

        setIsProcessingSurrender(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bug-hunt/surrender`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sessionId,
                    totalTime: timer,
                    totalScore: score
                })
            });
            const data = await response.json();

            // Check for Level Up
            if (data.leveledUp) {
                window.dispatchEvent(new CustomEvent('level-up', {
                    detail: { level: data.newLevel }
                }));
            }

            setIsSurrendered(true);
            setGameState('completed');
            setShowSurrenderModal(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        } catch (error) {
            console.error('Failed to surrender:', error);
            alert('Emergency transmission failed. The bugs have blocked the signal.');
        } finally {
            setIsProcessingSurrender(false);
        }
    };

    return (
        <div className="w-full h-full">
            {/* Start & Loading Screen */}
            {(gameState === 'start' || gameState === 'loading') && (
                <div className="w-full h-full bg-white overflow-y-auto text-[#2D2D2D]">
                    <div className="min-h-full flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-16 animate-in fade-in zoom-in duration-500 p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto w-full">
                        {/* Main Content Column */}
                        <div className="w-full lg:flex-1 max-w-md space-y-6 sm:space-y-8 lg:space-y-10 text-center py-6 sm:py-12 lg:py-0">
                            <div className="relative inline-block mx-auto">
                                <div className="absolute -inset-4 bg-gradient-to-r from-[#1B5E20] to-[#4CAF50] rounded-full blur-xl opacity-10 animate-pulse"></div>
                                <div className="relative bg-[#F8F9FA] rounded-full p-6 sm:p-10 shadow-xl border border-[#E0E0E0]">
                                    <Bug className="w-14 h-14 sm:w-20 sm:h-20 text-[#2E7D32]" />
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#1B5E20] to-[#2E7D32]">BUG HUNT</h1>
                                <p className="text-base sm:text-xl text-[#666] font-medium italic leading-tight px-2">3 Buggy Projects. One Master Debugger.<br />Speed is of the essence.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="bg-white p-4 rounded-xl border border-[#E0E0E0] shadow-sm">
                                    <div className="flex items-center gap-2 text-[#2E7D32] mb-2">
                                        <Zap className="w-4 h-4" />
                                        <span className="font-bold text-[10px] uppercase tracking-wider">Speed Bonus</span>
                                    </div>
                                    <p className="text-[11px] text-[#888]">Fix bugs faster to earn higher score multipliers.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#E0E0E0] shadow-sm">
                                    <div className="flex items-center gap-2 text-[#F57C00] mb-2">
                                        <Trophy className="w-4 h-4" />
                                        <span className="font-bold text-[10px] uppercase tracking-wider">Elite Ranks</span>
                                    </div>
                                    <p className="text-[11px] text-[#888]">Master debuggers get exclusive profile badges.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:gap-4">
                                <button
                                    onClick={startSession}
                                    disabled={gameState === 'loading' || showTutorial}
                                    className="w-full py-4 sm:py-5 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] hover:from-[#388E3C] hover:to-[#2E7D32] rounded-2xl text-base sm:text-xl font-bold text-white shadow-[0_10px_30px_rgba(27,94,32,0.4)] transform transition hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3 overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                    {gameState === 'loading' ? (
                                        <>
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                            LOADING MISSIONS...
                                        </>
                                    ) : (
                                        <>
                                            START MISSION
                                            <SkipForward className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <button
                                    id="tutorial-how-btn"
                                    onClick={() => {
                                        setTutorialStep(0);
                                        setShowTutorial(true);
                                        if (tutorialAudioRef.current) {
                                            tutorialAudioRef.current.currentTime = 0;
                                            tutorialAudioRef.current.play().catch(e => console.error("Audio playback failed", e));
                                        }
                                    }}
                                    disabled={showTutorial}
                                    className="w-full py-4 bg-white hover:bg-[#F5F5F5] border-2 border-[#E0E0E0] rounded-2xl text-sm font-black text-[#666] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <HelpCircle className="w-5 h-5 text-[#2E7D32] group-hover:rotate-12 transition-transform" />
                                    How to Play
                                </button>
                            </div>
                        </div>

                        {/* Leaderboard Column */}
                        <div className="w-full lg:w-[380px] space-y-6">
                            <div className="bg-[#F8F9FA] rounded-3xl border border-[#E0E0E0] p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[11px] font-black text-[#555] uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Trophy className="w-4 h-4 text-[#F57C00]" />
                                        Leaderboard
                                    </h3>
                                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-[#E0E0E0] rounded-lg">
                                        <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full animate-pulse"></span>
                                        <span className="text-[9px] font-bold text-[#888] uppercase tracking-wider">Top Students</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {leaderboard.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 opacity-50">
                                            <Trophy className="w-10 h-10 text-[#CCC] mb-3" />
                                            <p className="text-sm font-bold text-[#AAA]">No data yet</p>
                                            <p className="text-[10px] text-[#CCC] mt-1">Be the first to complete a mission!</p>
                                        </div>
                                    ) : (
                                        leaderboard.slice(0, 5).map((entry, i) => (
                                            <div key={i} className="flex items-center justify-between group p-1.5 hover:bg-white hover:rounded-2xl transition-all duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl shadow-sm ${i === 0 ? 'bg-[#FFD700] text-white' :
                                                        i === 1 ? 'bg-[#C0C0C0] text-white' :
                                                            i === 2 ? 'bg-[#CD7F32] text-white' :
                                                                'bg-white text-[#AAA] border border-[#E0E0E0]'
                                                        }`}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#212121]">
                                                            {entry.name}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-[#AAA] uppercase tracking-tighter">
                                                            {(entry.sessionsCompleted || 0) + (entry.sessionsSurrendered || 0)} Missions • {entry.totalBugsFixed || 0} Bugs Fixed
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E0E0E0] shadow-sm">
                                                    <Zap className="w-3 h-3 text-[#F57C00]" />
                                                    <span className="text-[12px] font-mono font-black text-[#212121]">
                                                        {entry.totalScore.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Completed Screen */}
            {gameState === 'completed' && (
                <div className="flex flex-col items-center justify-center w-full h-full bg-[#F5F5F5] text-[#2D2D2D]">
                    <div className="max-w-lg w-full bg-white rounded-3xl p-10 border border-[#E0E0E0] shadow-xl text-center space-y-8 animate-in zoom-in slide-in-from-bottom-5 duration-500">
                        <div className="relative inline-block">
                            <div className="absolute -inset-4 bg-[#F57C00] rounded-full blur-2xl opacity-10"></div>
                            <div className="w-24 h-24 bg-[#F57C00] rounded-full flex items-center justify-center mx-auto shadow-lg relative border-4 border-white">
                                <Trophy className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className={`text-4xl font-extrabold tracking-tight ${isSurrendered ? 'text-[#D32F2F]' : 'text-[#2E7D32]'}`}>
                                {isSurrendered ? 'Mission Aborted' : 'Mission Accomplished!'}
                            </h2>
                            <p className="text-[#808080] text-lg font-medium">
                                {isSurrendered ? 'You have surrendered the mission. Intel has been saved.' : 'The codebase is safe. Excellent work, Student.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-[#E0E0E0] text-left animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
                                <p className="text-[#999] text-[9px] uppercase font-black tracking-widest mb-1">Total Time</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[#2E7D32]" />
                                    <p className="text-2xl font-mono font-black text-[#212121]">{formatTime(timer)}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-[#E0E0E0] text-left animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                                <p className="text-[#999] text-[9px] uppercase font-black tracking-widest mb-1">Final Score</p>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-[#F57C00]" />
                                    <p className="text-2xl font-mono font-black text-[#212121]">{score}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-[#E0E0E0] text-left animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
                                <p className="text-[#999] text-[9px] uppercase font-black tracking-widest mb-1">Hints Requested</p>
                                <div className="flex items-center gap-2">
                                    <Lightbulb className={`w-4 h-4 ${hintsCount > 0 ? 'text-[#F57C00]' : 'text-[#999]'}`} />
                                    <p className="text-2xl font-mono font-black text-[#212121]">{hintsCount}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-[#E0E0E0] text-left animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 fill-mode-both">
                                <p className="text-[#999] text-[9px] uppercase font-black tracking-widest mb-1">Bugs Patched</p>
                                <div className="flex items-center gap-2">
                                    <Bug className="w-4 h-4 text-[#2E7D32]" />
                                    <p className="text-2xl font-mono font-black text-[#212121]">
                                        {challenges.filter(c => c.isFixed).length} / {challenges.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setGameState('start');
                                setIsSurrendered(false);
                                setHintsCount(0);
                                setScore(0);
                                setTimer(0);
                                setChallenges([]);
                            }}
                            className="w-full py-5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                        >
                            <RotateCcw className="w-6 h-6" />
                            RETURN TO HQ
                        </button>
                    </div>
                </div>
            )}

            {/* Playing Screen */}
            {gameState === 'playing' && (
                (() => {
                    const currentChallenge = challenges[currentIndex];
                    return (
                        <>
                            <div className="flex flex-col w-full h-full bg-[#F5F5F5] text-[#2D2D2D] font-sans selection:bg-[#4CAF50]/20 selection:text-[#1B5E20]">
                                {/* HUD Header */}
                                <header className={`h-14 sm:h-16 flex items-center justify-between px-2 sm:px-6 bg-white border-b border-[#E0E0E0] shadow-sm gap-2 ${tutorialStep === 6 ? '' : 'relative z-20'}`}>
                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                        <button onClick={onMenuClick} disabled={showTutorial} className="p-2 hover:bg-[#F5F5F5] rounded-xl transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                                            <Menu className="w-5 h-5 text-[#666]" />
                                        </button>
                                        <div className="h-4 w-px bg-[#E0E0E0] hidden sm:block"></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] text-[#2E7D32]">Phase 0{currentIndex + 1}</span>
                                            <span className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-[250px] tracking-tight text-[#212121]">{currentChallenge?.title}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                                        <button
                                            onClick={() => setShowSurrenderModal(true)}
                                            disabled={showTutorial}
                                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-[#FFEBEE] text-[#D32F2F] font-black text-[10px] uppercase tracking-widest rounded-lg border border-transparent hover:border-[#FFCDD2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Surrender"
                                        >
                                            <Flag className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Surrender</span>
                                        </button>
                                        <div id="tutorial-timer" className="flex items-center gap-1.5 sm:gap-3 bg-[#F8F9FA] px-2 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-[#E0E0E0] shadow-sm">
                                            <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${timer > 180 ? 'text-[#D32F2F] animate-pulse' : 'text-[#2E7D32]'}`} />
                                            <span className="font-mono text-xs sm:text-xl font-black text-[#212121]">{formatTime(timer)}</span>
                                        </div>
                                        <div id="tutorial-score" className="flex items-center gap-1.5 sm:gap-3 bg-[#F8F9FA] px-2 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-[#E0E0E0] shadow-sm">
                                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F57C00]" />
                                            <span className="font-mono text-xs sm:text-xl font-black text-[#212121]">{score}</span>
                                        </div>
                                        <button
                                            onClick={() => setShowMobileBriefing(true)}
                                            disabled={showTutorial}
                                            className="lg:hidden flex items-center justify-center p-2 bg-[#F8F9FA] hover:bg-[#E8F5E9] rounded-xl border border-[#E0E0E0] transition-all active:scale-90 disabled:opacity-50"
                                            aria-label="Mission briefing"
                                        >
                                            <Info className="w-4 h-4 text-[#2E7D32]" />
                                        </button>
                                    </div>
                                </header>

                                <div className="flex-1 flex overflow-hidden">
                                    {/* Code Editor Side */}
                                    <div className="flex-1 flex flex-col relative border-r border-[#E0E0E0]">
                                        <div className="flex items-center justify-between px-4 h-10 bg-[#F8F9FA] border-b border-[#E0E0E0]">
                                            <div className="flex gap-1">
                                                <div className="flex items-center gap-2 px-4 h-10 bg-white rounded-t-xl border-t border-x border-[#E0E0E0] mt-[1px]">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${currentChallenge?.language === 'java' ? 'bg-[#E76F51]' : 'bg-[#3776AB]'}`}></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#666]">{currentChallenge?.language} source code</span>
                                                </div>
                                            </div>
                                            {feedback && (
                                                <div className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${isLastFixSuccessful ? 'bg-[#C8E6C9] text-[#2E7D32]' : 'bg-[#FFCDD2] text-[#D32F2F]'} animate-in fade-in slide-in-from-top-2`}>
                                                    {feedback}
                                                </div>
                                            )}
                                        </div>

                                        <MissingImportsBanner
                                            language={currentChallenge?.language || 'java'}
                                            missingImports={missingImports}
                                            onAddImport={addMissingImport}
                                        />

                                        <div id="tutorial-editor" className="flex-1 relative font-mono text-[14px] overflow-hidden bg-white flex">
                                            {/* Line Numbers */}
                                            <div ref={lineNumbersRef} className="bg-[#F8F9FA] border-r border-[#E0E0E0] select-none flex-shrink-0 overflow-hidden" style={{ width: '50px' }}>
                                                <div className="py-8 pr-2 text-right">
                                                    {(() => {
                                                        const linesWithMissingImports = findLinesWithMissingImports(code, missingImports);
                                                        const unusedImports = findUnusedImports(code);
                                                        
                                                        return lineNumbers.map(num => {
                                                            const hasError = compilationErrors.some(err => err.line === num);
                                                            const error = compilationErrors.find(err => err.line === num);
                                                            const hasMissingImport = !hasError && linesWithMissingImports.has(num);
                                                            const hasUnusedImport = !hasError && !hasMissingImport && unusedImports.has(num);
                                                            const hasWarning = hasMissingImport || hasUnusedImport;

                                                            return (
                                                                <div key={num} className={`text-xs font-mono flex items-center justify-end space-x-1 ${hasError ? "text-red-600 font-bold" : hasWarning ? "text-yellow-600 font-bold" : "text-[#999]"}`} style={{ height: "24px", minHeight: "24px", lineHeight: "24px" }} title={hasError ? error?.message : (hasMissingImport ? "Missing import" : (hasUnusedImport ? "Unused import" : ""))}>
                                                                    <span>{num}</span>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Editor Code Area */}
                                            <div className="flex-1 relative overflow-hidden">
                                                <textarea
                                                    ref={textareaRef}
                                                    value={code}
                                                    onChange={handleCodeChange}
                                                    onKeyDown={handleKeyDown}
                                                    onKeyUp={handleCursorMove}
                                                    onScroll={handleScroll}
                                                    onClick={() => {
                                                        handleCursorMove();
                                                        updateCursorPosition();
                                                        setShowSuggestions(false);
                                                    }}
                                                    disabled={showTutorial}
                                                    className="absolute inset-0 w-full h-full p-4 sm:p-8 pt-4 sm:pt-8 bg-transparent text-transparent caret-[#212121] resize-none outline-none z-10 whitespace-pre overflow-auto leading-relaxed disabled:cursor-not-allowed"
                                                    spellCheck={false}
                                                    wrap="off"
                                                    style={{ lineHeight: "24px" }}
                                                />
                                                <div ref={highlightRef} className="absolute inset-0 w-full h-full p-4 sm:p-8 pt-4 sm:pt-8 whitespace-pre overflow-auto pointer-events-none leading-relaxed" style={{ lineHeight: "24px" }}>
                                                    {highlightCode(
                                                        code,
                                                        currentChallenge?.language || 'java',
                                                        compilationErrors,
                                                        new Set([...findLinesWithMissingImports(code, missingImports), ...findUnusedImports(code)])
                                                    )}
                                                </div>

                                                {/* Suggestions Dropdown */}
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div
                                                        ref={suggestionsRef}
                                                        className="absolute bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-auto"
                                                        style={{
                                                            top: `${cursorPosition.top}px`,
                                                            left: `${cursorPosition.left}px`,
                                                            minWidth: "300px",
                                                        }}
                                                    >
                                                        {suggestions.map((suggestion, index) => (
                                                            <div
                                                                key={index}
                                                                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${index === selectedSuggestion ? "bg-blue-100" : "hover:bg-gray-100"}`}
                                                                onClick={() => insertSuggestion(suggestion)}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-mono text-gray-900">{suggestion.text}</span>
                                                                    <span className="text-xs text-gray-500">{suggestion.description}</span>
                                                                </div>
                                                                <span className={`text-xs px-2 py-1 rounded ml-4 ${suggestion.type === "import" ? "bg-purple-100 text-purple-700" : suggestion.type === "keyword" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                                                    {suggestion.type}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-16 sm:h-20 flex items-center justify-between px-3 sm:px-8 bg-[#F8F9FA] border-t border-[#E0E0E0] gap-2">
                                            <div className="relative flex-shrink-0">
                                                <button
                                                    id="tutorial-hint-btn"
                                                    onClick={requestHint}
                                                    onMouseEnter={() => setIsHintHovered(true)}
                                                    onMouseLeave={() => setIsHintHovered(false)}
                                                    disabled={isRequestingHint || showHint || score < 0 || showTutorial}
                                                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black tracking-widest transition-all ${showTutorial ? 'bg-white shadow-sm' : ''} ${showHint ? 'text-[#F57C00] cursor-default' : (score < 0 ? 'text-[#D32F2F] opacity-50 cursor-not-allowed' : 'text-[#999] hover:text-[#F57C00] disabled:opacity-50')}`}
                                                >
                                                    {isRequestingHint ? (
                                                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#F57C00] border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Lightbulb className={`w-4 h-4 sm:w-5 sm:h-5 ${showHint ? 'text-[#F57C00]' : ''}`} />
                                                    )}
                                                    <span className="hidden sm:inline">{showHint ? 'INTEL RECEIVED' : 'REQUEST HINT (-10 PTS)'}</span>
                                                    <span className="sm:hidden">{showHint ? 'INTEL' : 'HINT -10'}</span>
                                                </button>

                                                {isHintHovered && !showHint && (
                                                    <div className="absolute bottom-full left-0 mb-4 w-60 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-[#E0E0E0] animate-in fade-in slide-in-from-bottom-2 duration-200 z-[100]">
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-1 p-2 bg-[#FFF9C4] rounded-xl text-[#F57C00]">
                                                                <Lightbulb className="w-4 h-4" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[11px] font-black tracking-widest text-[#212121] uppercase">Intelligence Report</p>
                                                                <p className="text-[13px] text-[#666] leading-relaxed font-medium">
                                                                    Receive a strategic hint to help identify the code defects.
                                                                </p>
                                                                <div className="pt-2 flex items-center gap-2">
                                                                    <div className="px-2 py-0.5 bg-[#FFEBEE] text-[#D32F2F] text-[9px] font-black rounded-md uppercase tracking-tighter">
                                                                        Cost: 10 PTS
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white rotate-45 border-r border-b border-[#E0E0E0]"></div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 sm:gap-4 flex-shrink-0">
                                                <button
                                                    id="tutorial-execute-btn"
                                                    onClick={runCode}
                                                    disabled={isCompiling || isValidating || showTutorial}
                                                    className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-[#F5F5F5] text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all border border-[#E0E0E0] text-[#444] active:scale-95 shadow-sm disabled:opacity-50"
                                                >
                                                    {isCompiling ? (
                                                        <div className="w-4 h-4 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Play className="w-4 h-4" />
                                                    )}
                                                    EXECUTE
                                                </button>
                                                <button
                                                    id="tutorial-patch-btn"
                                                    onClick={submitFix}
                                                    disabled={isValidating || isCompiling || showTutorial}
                                                    className="px-4 sm:px-10 py-2.5 sm:py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all shadow-[0_4px_12px_rgba(46,125,50,0.2)] text-white active:scale-95 disabled:opacity-50"
                                                >
                                                    {(isValidating || isCompiling) ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Send className="w-4 h-4" />
                                                    )}
                                                    PATCH CODE
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mission Control Side - desktop only */}
                                    <div id="tutorial-mission-control" className="hidden lg:flex w-[380px] flex-col bg-white">
                                        <div className="p-8 border-b border-[#E0E0E0]" id="tutorial-mission-briefing">
                                            <h3 className="text-[10px] font-black text-[#888] uppercase tracking-[0.3em] mb-6">Mission Briefing</h3>
                                            <div className="p-5 bg-[#F8F9FA] border border-[#E0E0E0] rounded-2xl space-y-4 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#2E7D32] opacity-0 group-hover:opacity-5 -mr-12 -mt-12 rounded-full transition-opacity duration-500"></div>
                                                <p className="text-[14px] leading-relaxed text-[#444] italic font-medium">
                                                    "{currentChallenge?.description}"
                                                </p>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <span className="text-[9px] px-2.5 py-1 bg-black/5 text-[#666] font-black rounded-lg uppercase border border-black/5 tracking-tighter">LVL: {currentChallenge?.difficulty}</span>
                                                    <span className="text-[9px] px-2.5 py-1 bg-black/5 text-[#666] font-black rounded-lg uppercase border border-black/5 tracking-tighter">THREAT: CRITICAL</span>
                                                </div>
                                            </div>

                                            {showHint && (
                                                <div className="mt-6 p-5 bg-[#FFF9C4] border-l-4 border-[#F57C00] rounded-r-2xl animate-in slide-in-from-right-5 duration-300">
                                                    <p className="text-[10px] text-[#E65100] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <AlertCircle className="w-3.5 h-3.5" /> Intelligence Report
                                                    </p>
                                                    <div className="text-[13px] text-[#444] leading-relaxed font-medium italic mt-2 animate-in fade-in duration-500">
                                                        "{aiHint || (currentChallenge?.hints && currentChallenge.hints[0])}"
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-black/5 space-y-2">
                                                        <p className="text-[9px] text-[#888] font-black uppercase tracking-widest">Archive Details:</p>
                                                        <ul className="text-[11px] text-[#666] space-y-1">
                                                            {currentChallenge?.hints?.slice(1).map((hint, i) => (
                                                                <li key={i} className="flex gap-2">
                                                                    <span className="text-[#CCC]">•</span>
                                                                    {hint}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col min-h-0 bg-[#F0F2F5]">
                                            <div className="flex items-center px-8 h-12 border-b border-[#E0E0E0] bg-[#EBEDF0]">
                                                <span className="text-[10px] font-black text-[#888] uppercase tracking-[0.3em]">Console Terminal</span>
                                            </div>
                                            <div className="flex-1 p-8 font-mono text-[13px] overflow-auto custom-scrollbar-minimal text-[#212121]">
                                                {output ? (
                                                    <div className="space-y-1 animate-in fade-in duration-300">
                                                        <div className="flex gap-2 opacity-50 mb-2">
                                                            <span className="text-[#2E7D32] font-bold">&gt;</span>
                                                            <span className="text-[#666]">Process initiated...</span>
                                                        </div>
                                                        <div className="whitespace-pre-wrap leading-relaxed">
                                                            {output}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full opacity-20 pointer-events-none grayscale">
                                                        <Bug className="w-12 h-12 mb-4 text-[#888]" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#888]">No signals detected</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Mission Briefing Drawer */}
                            {showMobileBriefing && (
                                <div className="lg:hidden fixed inset-0 z-[90] flex animate-in fade-in duration-200">
                                    <div
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                        onClick={() => setShowMobileBriefing(false)}
                                    ></div>
                                    <div className="relative ml-auto w-full max-w-sm h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                                        <div className="flex items-center justify-between px-5 h-14 border-b border-[#E0E0E0]">
                                            <h3 className="text-[10px] font-black text-[#888] uppercase tracking-[0.3em]">Mission Briefing</h3>
                                            <button
                                                onClick={() => setShowMobileBriefing(false)}
                                                className="p-2 text-[#999] hover:text-[#212121] hover:bg-[#F5F5F5] rounded-full transition-all"
                                                aria-label="Close briefing"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            <div className="p-5 border-b border-[#E0E0E0]">
                                                <div className="p-5 bg-[#F8F9FA] border border-[#E0E0E0] rounded-2xl space-y-4">
                                                    <p className="text-[14px] leading-relaxed text-[#444] italic font-medium">
                                                        "{currentChallenge?.description}"
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-wrap pt-2">
                                                        <span className="text-[9px] px-2.5 py-1 bg-black/5 text-[#666] font-black rounded-lg uppercase border border-black/5 tracking-tighter">LVL: {currentChallenge?.difficulty}</span>
                                                        <span className="text-[9px] px-2.5 py-1 bg-black/5 text-[#666] font-black rounded-lg uppercase border border-black/5 tracking-tighter">THREAT: CRITICAL</span>
                                                    </div>
                                                </div>

                                                {showHint && (
                                                    <div className="mt-5 p-5 bg-[#FFF9C4] border-l-4 border-[#F57C00] rounded-r-2xl">
                                                        <p className="text-[10px] text-[#E65100] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                            <AlertCircle className="w-3.5 h-3.5" /> Intelligence Report
                                                        </p>
                                                        <div className="text-[13px] text-[#444] leading-relaxed font-medium italic mt-2">
                                                            "{aiHint || (currentChallenge?.hints && currentChallenge.hints[0])}"
                                                        </div>
                                                        {currentChallenge?.hints && currentChallenge.hints.length > 1 && (
                                                            <div className="mt-4 pt-4 border-t border-black/5 space-y-2">
                                                                <p className="text-[9px] text-[#888] font-black uppercase tracking-widest">Archive Details:</p>
                                                                <ul className="text-[11px] text-[#666] space-y-1">
                                                                    {currentChallenge.hints.slice(1).map((hint, i) => (
                                                                        <li key={i} className="flex gap-2">
                                                                            <span className="text-[#CCC]">•</span>
                                                                            {hint}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-[#F0F2F5] flex flex-col">
                                                <div className="flex items-center px-5 h-12 border-b border-[#E0E0E0] bg-[#EBEDF0]">
                                                    <span className="text-[10px] font-black text-[#888] uppercase tracking-[0.3em]">Console Terminal</span>
                                                </div>
                                                <div className="p-5 font-mono text-[13px] text-[#212121] min-h-[200px]">
                                                    {output ? (
                                                        <div className="space-y-1">
                                                            <div className="flex gap-2 opacity-50 mb-2">
                                                                <span className="text-[#2E7D32] font-bold">&gt;</span>
                                                                <span className="text-[#666]">Process initiated...</span>
                                                            </div>
                                                            <div className="whitespace-pre-wrap leading-relaxed">{output}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-10 opacity-20 pointer-events-none grayscale">
                                                            <Bug className="w-10 h-10 mb-3 text-[#888]" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#888]">No signals detected</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showSurrenderModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                                    <div className="bg-white w-full max-w-sm rounded-xl p-8 border border-[#E0E0E0] shadow-2xl space-y-6 animate-in zoom-in slide-in-from-bottom-5 duration-400">
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">Surrender Mission?</h2>
                                            <p className="text-sm text-[#666] leading-relaxed">
                                                Are you sure you want to surrender? Your current progress and intel will be recorded as-is.
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                onClick={() => setShowSurrenderModal(false)}
                                                disabled={isProcessingSurrender}
                                                className="px-4 py-2 text-sm font-semibold text-[#666] hover:bg-[#F5F5F5] rounded-lg transition-all disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSurrender}
                                                disabled={isProcessingSurrender}
                                                className="px-4 py-2 text-sm font-semibold text-white bg-[#D32F2F] hover:bg-[#B71C1C] rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isProcessingSurrender ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    "Confirm Surrender"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()
            )}

            {/* Common Tutorial & Audio elements */}
            {showTutorial && (
                <>
                    {/* Global semi-transparent backdrop for tutorials */}
                    <div className="fixed inset-0 bg-black/60 z-[340] pointer-events-auto transition-opacity duration-500"></div>

                    <div className={`fixed w-[calc(100%-2rem)] max-w-sm bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto duration-700 transition-all border border-[#E0E0E0] z-[360] animate-in ${
                        (tutorialStep >= 4 && tutorialStep <= 6)
                            ? 'top-4 left-4 lg:top-10 lg:left-[260px] slide-in-from-left-10'
                            : 'bottom-4 right-4 lg:bottom-10 lg:right-10 slide-in-from-right-10'
                    }`}>
                        <button
                            onClick={() => {
                                setShowTutorial(false);
                                setGameState('start');
                                if (tutorialAudioRef.current) {
                                    tutorialAudioRef.current.pause();
                                    tutorialAudioRef.current.currentTime = 0;
                                }
                            }}
                            className="absolute top-4 right-4 p-2 text-[#999] hover:text-[#212121] hover:bg-[#F5F5F5] rounded-full transition-all z-50"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center border border-[#C8E6C9]">
                                    <Bug className="w-5 h-5 text-[#2E7D32]" />
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black text-[#2E7D32] uppercase tracking-[0.2em]">{`Briefing 0${tutorialStep >= 6 ? tutorialStep : tutorialStep + 1}`}</h4>
                                    <h3 className="text-sm font-black text-[#212121]">Agent Instruction</h3>
                                </div>
                            </div>

                            <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-[#E0E0E0] min-h-[100px] flex items-center">
                                <p className="text-[#444] text-sm leading-relaxed font-medium italic">
                                    {tutorialStep === 0 && "Good day agent. The SkillVerse system is under a critical bug invasion, and we need your expertise to restore the line."}
                                    {tutorialStep === 1 && "If you're new to the field, start by checking our new Mission Briefing. This guide will walk you through the protocol."}
                                    {tutorialStep === 2 && "Your mission is simple: Identify and patch vulnerabilities in 3 critical projects. Remember, speed is key—the faster you solve it, the higher your score multiplier."}
                                    {tutorialStep === 3 && "On the Left Panel, you’ll find your Development Terminal. This is where the IDE is shown. This is where you apply your fixes directly."}
                                    {tutorialStep === 4 && "The Right Panel is your Mission Control. Use the 'Execute' button to run your code and see live output in the console. If you hit a wall, request AI Intel—but use it wisely, as it costs points."}
                                    {(tutorialStep === 5 || tutorialStep === 6) && "Once the bug is squashed, click 'Patch Code' to submit. Successful patches earn you points and level up your account."}
                                    {tutorialStep === 7 && "Briefing complete. The system is counting on you, Agent."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                        const displayIndex = tutorialStep >= 6 ? tutorialStep - 1 : tutorialStep;
                                        return (
                                            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${displayIndex === i ? 'w-4 bg-[#2E7D32]' : 'w-1 bg-[#E0E0E0]'}`}></div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-[#888] uppercase tracking-widest animate-pulse">Auto-Navigating Briefing...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <audio ref={tutorialAudioRef} src="/assets/tutorial.mp3" />
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-[#E0E0E0]">
                        <div className="w-16 h-16 bg-[#C8E6C9] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-[#212121]">BUG SQUASHED!</h2>
                        <p className="text-[#666] mb-6 font-medium">{feedback}</p>
                        <div className="flex bg-[#F8F9FA] border border-[#E0E0E0] rounded-lg p-3 justify-center items-center mb-6">
                            <span className="text-[#F57C00] font-bold mr-2">+50 XP</span>
                            <span className="text-[#888] text-sm font-medium">Earned for this fix</span>
                        </div>
                        <button 
                            onClick={handleNextPhase}
                            className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {currentIndex < challenges.length - 1 ? 'Continue Mission' : 'Complete Mission'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugHunt;
