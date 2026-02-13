import { useState, useRef, useEffect } from 'react';
import {
    Play,
    Menu,
    Send,
    Clock,
    Trophy,
    Bug,
    Zap,
    RotateCcw,
    SkipForward,
    Lightbulb,
    AlertCircle,
    Flag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { highlightJavaCode } from '../utils/javaUtils';
import { highlightPythonCode } from '../utils/pythonUtils';

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

interface BugHuntProps {
    onMenuClick: () => void;
    onGameStatusChange?: (active: boolean) => void;
}

const BugHunt = ({ onMenuClick, onGameStatusChange }: BugHuntProps) => {
    const { user } = useAuth();
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
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [aiHint, setAiHint] = useState<string | null>(null);
    const [isRequestingHint, setIsRequestingHint] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    const socketRef = useRef<Socket | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (gameState === 'start') {
            fetchLeaderboard();
        }
    }, [gameState]);

    const fetchLeaderboard = async () => {
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
                setLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    };

    useEffect(() => {
        // Setup socket for code execution
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socketRef.current = socket;

        socket.on('output', (data: string) => {
            setOutput(prev => prev + data);
        });

        socket.on('error', (data: string) => {
            setOutput(prev => prev + `\nError: ${data}`);
        });

        socket.on('exit', (code: number) => {
            setIsCompiling(false);
            setOutput(prev => prev + `\n\nProgram exited with code ${code}`);
        });

        return () => {
            socket.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (onGameStatusChange) {
            onGameStatusChange(gameState === 'playing' || gameState === 'loading');
        }
    }, [gameState, onGameStatusChange]);

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
                // Final safety check: if it's an object, stringify it
                const finalCode = typeof firstCode === 'string' ? firstCode : JSON.stringify(firstCode, null, 2);
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
        setOutput('');
        setIsCompiling(true);

        const lang = challenges[currentIndex].language;
        const event = lang === 'java' ? 'compile-java' : 'run-python';

        socketRef.current.emit(event, {
            code,
            userId: user?.id,
            input: ''
        });
    };

    const submitFix = async () => {
        if (isCompiling || !sessionId) return;

        setIsCompiling(true);
        setFeedback(null);
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
                setScore(data.totalScore || score);
                setFeedback(data.feedback || "Bug Caught! Excellent work.");

                setTimeout(() => {
                    if (currentIndex < challenges.length - 1) {
                        const nextIndex = currentIndex + 1;
                        setCurrentIndex(nextIndex);
                        setCode(challenges[nextIndex].buggyCode);
                        setFeedback(null);
                        setShowHint(false);
                        setAiHint(null);
                    } else {
                        setGameState('completed');
                        if (timerRef.current) clearInterval(timerRef.current);
                    }
                }, 2000);
            } else {
                setFeedback(data.feedback || "Not quite. The bugs are still hiding! Keep looking.");
            }
        } catch (error) {
            setFeedback("Something went wrong testing your code.");
        } finally {
            setIsCompiling(false);
        }
    };

    const requestHint = async () => {
        if (!sessionId || isRequestingHint) return;

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
                setScore(prev => Math.max(0, prev - 10));
                setHintsCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to get hint:', error);
        } finally {
            setIsRequestingHint(false);
        }
    };

    const handleSurrender = async () => {
        if (!window.confirm("Are you sure you want to surrender? Your current progress and intel will be recorded.")) return;

        if (!sessionId) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/bug-hunt/surrender`, {
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
            setIsSurrendered(true);
            setGameState('completed');
        } catch (error) {
            console.error('Failed to surrender:', error);
        }
    };

    if (gameState === 'start' || gameState === 'loading') {
        return (
            <div className="w-full h-full bg-white overflow-y-auto text-[#2D2D2D]">
                <div className="min-h-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 animate-in fade-in zoom-in duration-500 p-8 lg:p-12 max-w-6xl mx-auto w-full">
                    {/* Main Content Column */}
                    <div className="w-full lg:flex-1 max-w-md space-y-8 lg:space-y-10 text-center py-12 lg:py-0">
                        <div className="relative inline-block mx-auto">
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#1B5E20] to-[#4CAF50] rounded-full blur-xl opacity-10 animate-pulse"></div>
                            <div className="relative bg-[#F8F9FA] rounded-full p-10 shadow-xl border border-[#E0E0E0]">
                                <Bug className="w-20 h-20 text-[#2E7D32]" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#1B5E20] to-[#2E7D32]">BUG HUNT</h1>
                            <p className="text-xl text-[#666] font-medium italic leading-tight">3 Buggy Projects. One Master Debugger.<br />Speed is of the essence.</p>
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

                        <button
                            onClick={startSession}
                            disabled={gameState === 'loading'}
                            className="w-full py-5 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] hover:from-[#388E3C] hover:to-[#2E7D32] rounded-2xl text-xl font-bold text-white shadow-[0_10px_30px_rgba(27,94,32,0.4)] transform transition hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3 overflow-hidden relative"
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
                    </div>

                    {/* Leaderboard Column */}
                    <div className="w-full lg:w-[380px] space-y-6">
                        <div className="bg-[#F8F9FA] rounded-3xl border border-[#E0E0E0] p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[11px] font-black text-[#555] uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Trophy className="w-4 h-4 text-[#F57C00]" />
                                    Global Leaderboard
                                </h3>
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-[#E0E0E0] rounded-lg">
                                    <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full animate-pulse"></span>
                                    <span className="text-[9px] font-bold text-[#888] uppercase tracking-wider">Top Students</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[0, 1, 2, 3, 4].map((i) => {
                                    const entry = leaderboard[i];
                                    return (
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
                                                    <span className={`text-sm font-bold ${entry ? 'text-[#212121]' : 'text-[#CCC] italic'}`}>
                                                        {entry ? entry.name : 'Searching for signal...'}
                                                    </span>
                                                    {entry && (
                                                        <span className="text-[9px] font-bold text-[#AAA] uppercase tracking-tighter">
                                                            {entry.sessionsCompleted} Extractions
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E0E0E0] shadow-sm">
                                                <Zap className="w-3 h-3 text-[#F57C00]" />
                                                <span className={`text-[12px] font-mono font-black ${entry ? 'text-[#212121]' : 'text-[#CCC]'}`}>
                                                    {entry ? entry.totalScore.toLocaleString() : '---'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-8 border-t border-[#E0E0E0]">
                                <p className="text-[10px] text-[#AAA] font-medium leading-relaxed italic text-center">
                                    "Students are ranked by total extracted intel points across all successful missions."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'completed') {
        return (
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
                        }}
                        className="w-full py-5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                    >
                        <RotateCcw className="w-6 h-6" />
                        RETURN TO HQ
                    </button>
                </div>
            </div>
        );
    }

    const currentChallenge = challenges[currentIndex];

    return (
        <div className="flex flex-col w-full h-full bg-[#F5F5F5] text-[#2D2D2D] font-sans selection:bg-[#4CAF50]/20 selection:text-[#1B5E20]">
            {/* HUD Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-[#E0E0E0] shadow-sm relative z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="p-2 hover:bg-[#F5F5F5] rounded-xl transition-all active:scale-90">
                        <Menu className="w-5 h-5 text-[#666]" />
                    </button>
                    <div className="h-4 w-px bg-[#E0E0E0]"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#2E7D32]">Phase 0{currentIndex + 1}</span>
                        <span className="text-sm font-bold truncate max-w-[250px] tracking-tight text-[#212121]">{currentChallenge?.title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleSurrender} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#FFEBEE] text-[#D32F2F] font-black text-[10px] uppercase tracking-widest rounded-lg border border-transparent hover:border-[#FFCDD2] transition-all">
                        <Flag className="w-3.5 h-3.5" />
                        Surrender
                    </button>
                    <div className="flex items-center gap-3 bg-[#F8F9FA] px-5 py-2 rounded-2xl border border-[#E0E0E0] shadow-sm">
                        <Clock className={`w-4 h-4 ${timer > 180 ? 'text-[#D32F2F] animate-pulse' : 'text-[#2E7D32]'}`} />
                        <span className="font-mono text-xl font-black text-[#212121]">{formatTime(timer)}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-[#F8F9FA] px-5 py-2 rounded-2xl border border-[#E0E0E0] shadow-sm">
                        <Zap className="w-4 h-4 text-[#F57C00]" />
                        <span className="font-mono text-xl font-black text-[#212121]">{score}</span>
                    </div>
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
                            <div className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${feedback.includes('Caught') ? 'bg-[#C8E6C9] text-[#2E7D32]' : 'bg-[#FFCDD2] text-[#D32F2F]'} animate-in fade-in slide-in-from-top-2`}>
                                {feedback}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative font-mono text-[15px] overflow-hidden bg-white">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="absolute inset-0 w-full h-full p-8 bg-transparent text-transparent caret-[#212121] resize-none outline-none z-10 whitespace-pre overflow-auto leading-relaxed"
                            spellCheck={false}
                            wrap="off"
                        />
                        <div className="absolute inset-0 w-full h-full p-8 whitespace-pre overflow-auto pointer-events-none leading-relaxed">
                            {currentChallenge?.language === 'java' ? highlightJavaCode(code) : highlightPythonCode(code)}
                        </div>
                    </div>

                    <div className="h-20 flex items-center justify-between px-8 bg-[#F8F9FA] border-t border-[#E0E0E0]">
                        <button
                            onClick={requestHint}
                            disabled={isRequestingHint || showHint}
                            className={`flex items-center gap-2 text-xs font-black tracking-widest transition-all ${showHint ? 'text-[#F57C00] cursor-default' : 'text-[#999] hover:text-[#F57C00] disabled:opacity-50'}`}
                        >
                            {isRequestingHint ? (
                                <div className="w-5 h-5 border-2 border-[#F57C00] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Lightbulb className={`w-5 h-5 ${showHint ? 'text-[#F57C00]' : ''}`} />
                            )}
                            {showHint ? 'INTEL RECEIVED' : 'REQUEST HINT (-10 PTS)'}
                        </button>

                        <div className="flex gap-4">
                            <button
                                onClick={runCode}
                                disabled={isCompiling}
                                className="px-6 py-3 bg-white hover:bg-[#F5F5F5] text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all border border-[#E0E0E0] text-[#444] active:scale-95 shadow-sm"
                            >
                                <Play className="w-4 h-4" />
                                EXECUTE
                            </button>
                            <button
                                onClick={submitFix}
                                disabled={isCompiling}
                                className="px-10 py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(46,125,50,0.2)] text-white active:scale-95 disabled:opacity-50"
                            >
                                {isCompiling ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                PATCH CODE
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mission Control Side */}
                <div className="w-[380px] flex flex-col bg-white">
                    {/* Mission Briefing */}
                    <div className="p-8 border-b border-[#E0E0E0]">
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

                    {/* Console Output */}
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
        </div >
    );
};

export default BugHunt;
