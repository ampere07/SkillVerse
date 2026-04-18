import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import OnboardingSurveyModal from "../components/OnboardingSurveyModal";
import { 
  MissingImport, 
  JAVA_SUGGESTIONS, 
  findMissingImports, 
  findLinesWithMissingImports, 
  findUnusedImports 
} from "../utils/javaUtils";
import { PYTHON_SUGGESTIONS } from "../utils/pythonUtils";
import { 
  CompilationError, 
  DEFAULT_CODE, 
  highlightCode
} from "../utils/compilerUtils";
import { 
  CompilerHeader, 
  MissingImportsBanner, 
  OutputConsole, 
  TimeUpModal, 
  SubmitConfirmModal, 
  GradingLoadingModal, 
  GradingResultsModal, 
  ActivityStatusModals, 
  LanguageSwitchModal 
} from "../components/CompilerComponents";

interface Library {
  filename: string;
  name: string;
  version: string;
}

interface Suggestion {
  text: string;
  type: "import" | "keyword" | "method" | "auto-import";
  description?: string;
  className?: string;
}

interface ProjectDetails {
  _id?: string;
  title: string;
  description: string;
  language: string;
  requirements: string;
  duration?: { hours: number; minutes: number };
}

interface CompilerProps {
  onMenuClick: () => void;
  projectDetails?: ProjectDetails;
  onBack?: () => void;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
  isActivityMode?: boolean;
  readOnly?: boolean;
  onSubmitSuccess?: () => void;
  initialCode?: string | null;
  initialLanguage?: string | null;
}

const Compiler = forwardRef<any, CompilerProps>(
  (
    {
      onMenuClick,
      projectDetails,
      onBack,
      onHasUnsavedChanges,
      isActivityMode = false,
      onSubmitSuccess,
      initialCode,
      initialLanguage,
    },
    ref,
  ) => {
    const { user } = useAuth();
    const [language, setLanguage] = useState(initialLanguage || "java");
    const [code, setCode] = useState(initialCode || DEFAULT_CODE[initialLanguage || "java"]);
    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [lineNumbers, setLineNumbers] = useState<number[]>([]);
    const [libraries, setLibraries] = useState<Library[]>([]);
    const [showLibraries, setShowLibraries] = useState(false);
    const [currentInput, setCurrentInput] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [sessionId] = useState(
      () => `session_${Date.now()}_${Math.random()}`,
    );
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
    const [currentLine, setCurrentLine] = useState(0);
    const [missingImports, setMissingImports] = useState<MissingImport[]>([]);
    const [compilationErrors, setCompilationErrors] = useState<
      CompilationError[]
    >([]);
    const [lineSuggestions, setLineSuggestions] = useState<
      Map<
        number,
        { suggestions: Suggestion[]; cursorPos: { top: number; left: number } }
      >
    >(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [isGrading, setIsGrading] = useState(false);
    const [gradingResult, setGradingResult] = useState<any>(null);
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
    const [highlightedBrackets, setHighlightedBrackets] = useState<{
      start: number;
      end: number;
    } | null>(null);
    const [typedFeedback, setTypedFeedback] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [aiMessages, setAiMessages] = useState<
      Array<{ type: "ai" | "user"; text: string }>
    >([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [lastHintTime, setLastHintTime] = useState<number>(0);
    const [streamingText, setStreamingText] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [timerStarted, setTimerStarted] = useState(false);
    const [showTimeUpModal, setShowTimeUpModal] = useState(false);
    const [showActivitySubmitModal, setShowActivitySubmitModal] =
      useState(false);
    const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useImperativeHandle(ref, () => ({
      saveProgress: () => handleSaveProgress(),
      getCode: () => code,
    }));

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const consoleRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const bracketHighlightRef = useRef<HTMLDivElement>(null);

    const hasLoadedRef = useRef(false);

    useEffect(() => {
      if (projectDetails && !hasLoadedRef.current) {
        const projectLang = projectDetails.language.toLowerCase();
        setLanguage(projectLang);
        loadSavedProgress(projectLang);
        hasLoadedRef.current = true;
      }
    }, [projectDetails]);

    useEffect(() => {
      if (initialCode !== null && initialCode !== undefined) {
        setCode(initialCode);
      }
      if (initialLanguage !== null && initialLanguage !== undefined) {
        setLanguage(initialLanguage);
      }
    }, [initialCode, initialLanguage]);

    useEffect(() => {
      if (isActivityMode && projectDetails && !timerStarted) {
        const durationHours = projectDetails.duration?.hours || 0;
        const durationMinutes = projectDetails.duration?.minutes || 0;
        const totalSeconds = durationHours * 3600 + durationMinutes * 60;

        if (totalSeconds > 0) {
          setTimeRemaining(totalSeconds);
          setTimerStarted(true);
        }
      }
    }, [isActivityMode, projectDetails, timerStarted]);

    useEffect(() => {
      if (timeRemaining !== null && timeRemaining > 0 && isActivityMode) {
        timerIntervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
              }
              setShowTimeUpModal(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
        };
      }
    }, [timeRemaining, isActivityMode]);

    useEffect(() => {
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }, []);

    const loadSavedProgress = async (projectLang?: string) => {
      if (!projectDetails) return;

      const lang = projectLang || projectDetails.language.toLowerCase();

      // Don't load saved progress for activities - activities should start fresh
      if (isActivityMode) {
        setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.java);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.java);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/mini-projects/project-progress/${encodeURIComponent(projectDetails.title)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();
        if (data.found && data.task.codeBase) {
          setCode(data.task.codeBase);
        } else {
          setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.java);
        }
      } catch {
        setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.java);
      }
    };

    useEffect(() => {
      const lines = code.split("\n").length;
      setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));

      if (language === "java") {
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
      const apiUrl = import.meta.env.VITE_API_URL;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // If we are in production but the baked-in URL is localhost, use the production fallback
      const baseUrl = (apiUrl && (isLocalhost || !apiUrl.includes('localhost')))
          ? apiUrl.replace("/api", "")
          : "https://skillverse-ogv1.onrender.com";
      
      console.log(`[Compiler] Connecting to socket at: ${baseUrl}`);

      const newSocket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("[Compiler] Socket connected successfully");
      });

      newSocket.on("connect_error", (err) => {
        console.error("[Compiler] Socket connection error:", err.message);
        setOutput((prev) => prev + `\n[System] Connection error: ${err.message}. Retrying...\n`);
      });

      newSocket.on("output", (data: { type: string; data: string }) => {
        setOutput((prev) => prev + data.data);
        setTimeout(() => {
          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
        }, 0);
      });

      newSocket.on("execution-complete", () => {
        setIsRunning(false);

        // Reset the hint timer when execution completes, but don't show AI message immediately
        if (projectDetails && !isActivityMode) {
          setLastHintTime(Date.now());
        }
      });

      newSocket.on(
        "compilation-error",
        (data: { errors: CompilationError[] }) => {
          setCompilationErrors(data.errors);
        },
      );

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }, []);

    const startStreamingMessage = useCallback((message: string) => {
      setIsStreaming(true);
      setStreamingText("");
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
          setAiMessages([{ type: "ai", text: message }]);
          setStreamingText("");

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
    }, []);

    const analyzeCodeAndGiveHint = useCallback(async () => {
      if (
        !projectDetails ||
        isRunning ||
        isAiThinking ||
        isStreaming ||
        isActivityMode
      )
        return;

      setIsAiThinking(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/compiler/analyze-code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              code,
              projectTitle: projectDetails.title,
              requirements: projectDetails.requirements,
              language: projectDetails.language,
            }),
          },
        );

        const data = await response.json();

        if (response.ok && data.hint) {
          setIsAiThinking(false);
          startStreamingMessage(data.hint);
        }
      } catch {
        setIsAiThinking(false);
      }
    }, [projectDetails, isRunning, isAiThinking, isStreaming, isActivityMode, code, startStreamingMessage]);

    useEffect(() => {
      if (!projectDetails || isRunning || isActivityMode) return;

      const interval = setInterval(() => {
        const now = Date.now();
        if (now - lastHintTime >= 300000) {
          analyzeCodeAndGiveHint();
          setLastHintTime(now);
        }
      }, 60000);

      return () => clearInterval(interval);
    }, [projectDetails, isRunning, code, lastHintTime, isActivityMode, analyzeCodeAndGiveHint]);

    // AI messages initialization
    useEffect(() => {
      if (projectDetails && !isActivityMode) {
        const greeting = `Hello! I'm your SkillVerse coding assistant. I'll analyze your code and provide hints to help you complete the project. Let me know if you need help!`;
        setAiMessages([{ type: "ai", text: greeting }]);
      }
    }, [projectDetails, isActivityMode, analyzeCodeAndGiveHint]);

    useEffect(() => {
      if (isRunning && consoleRef.current) {
        consoleRef.current.focus();
      }
    }, [isRunning, output]);

    const fetchLibraries = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/compiler/libraries`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();
        if (data.success) {
          setLibraries(data.libraries);
        }
      } catch {
        // Silent error
      }
    };

    const handleLanguageChange = async (newLanguage: string) => {
      // If no project details, allow free switching without survey check
      if (!projectDetails) {
        setLanguage(newLanguage);
        setCode(DEFAULT_CODE[newLanguage]);
        setOutput("");
        setCurrentInput("");
        setShowSuggestions(false);
        setCompilationErrors([]);
        setMissingImports([]);
        return;
      }

      // If there's a project, this code should not run anyway
      // because the dropdown is disabled
      if (!user?.id) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/survey/check-language/${user.id}/${newLanguage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          setPendingLanguage(newLanguage);
          setShowSurveyModal(true);
          return;
        }

        const data = await response.json();

        if (data.hasCompleted) {
          setLanguage(newLanguage);
          setCode(DEFAULT_CODE[newLanguage]);
          setOutput("");
          setCurrentInput("");
          setShowSuggestions(false);
          setCompilationErrors([]);
          setMissingImports([]);
        } else {
          setPendingLanguage(newLanguage);
          setShowConfirmationModal(true);
        }
      } catch {
        setPendingLanguage(newLanguage);
        setShowConfirmationModal(true);
      }
    };

    const handleSurveyComplete = () => {
      setShowSurveyModal(false);
      if (pendingLanguage) {
        setLanguage(pendingLanguage);
        setCode(DEFAULT_CODE[pendingLanguage]);
        setOutput("");
        setCurrentInput("");
        setShowSuggestions(false);
        setPendingLanguage(null);
      }
    };

    const handleSurveyCancel = () => {
      setShowSurveyModal(false);
      setPendingLanguage(null);
    };

    const handleRun = () => {
      console.log("[Compiler] Run clicked. Socket status:", socket?.connected ? "Connected" : "Disconnected", "ID:", socket?.id);
      
      if (!socket || !socket.connected) {
        setOutput("Error: Not connected to execution server. Please refresh or check your internet connection.");
        if (!socket) {
          console.error("[Compiler] Socket object is null");
        } else {
          console.warn("[Compiler] Socket exists but is not connected. Attempting to connect...");
          socket.connect();
        }
        return;
      }

      setOutput("");
      setCurrentInput("");
      setCompilationErrors([]);
      setIsRunning(true);

      if (projectDetails && !isActivityMode) {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
        setAiMessages([]);
        setIsStreaming(false);
        setStreamingText("");
      }

      if (language === "java") {
        const token = localStorage.getItem("token");
        socket.emit("compile-and-run", { code, sessionId, token, language });
      } else if (language === "python") {
        const token = localStorage.getItem("token");
        socket.emit("compile-and-run-python", {
          code,
          sessionId,
          token,
          language,
        });
      }
    };

    const handleStop = () => {
      if (socket && isRunning) {
        if (language === "java") {
          socket.emit("kill-process", { sessionId });
        } else if (language === "python") {
          socket.emit("kill-process-python", { sessionId });
        }
        setIsRunning(false);

        if (projectDetails && !isActivityMode) {
          setTimeout(() => {
            setAiMessages([]);
            startStreamingMessage(
              "Code execution stopped. I'm back to help! Ask me anything or I'll analyze your code in 30 seconds.",
            );
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

      if (e.key === "Enter") {
        e.preventDefault();
        if (socket && currentInput.trim()) {
          if (language === "java") {
            socket.emit("stdin-input", { sessionId, input: currentInput });
          } else if (language === "python") {
            socket.emit("stdin-input-python", {
              sessionId,
              input: currentInput,
            });
          }
          setOutput((prev) => prev + currentInput + "\n");
          setCurrentInput("");
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setCurrentInput((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        e.preventDefault();
        setCurrentInput((prev) => prev + e.key);
      }
    };

    const getSuggestions = (text: string, cursorPos: number): Suggestion[] => {
      const beforeCursor = text.substring(0, cursorPos);
      const currentLine = beforeCursor.split("\n").pop() || "";

      const allSuggestions: Suggestion[] = [];
      const suggestions =
        language === "java" ? JAVA_SUGGESTIONS : PYTHON_SUGGESTIONS;

      if (
        currentLine.trim().startsWith("import ") ||
        currentLine.includes("import ") ||
        currentLine.includes("from ")
      ) {
        const importText = currentLine.includes("import ")
          ? currentLine.substring(currentLine.lastIndexOf("import ") + 7)
          : currentLine.substring(currentLine.lastIndexOf("from ") + 5);
        suggestions.imports.forEach((imp) => {
          if (imp.toLowerCase().includes(importText.toLowerCase())) {
            allSuggestions.push({
              text: imp,
              type: "import",
              description: "Import statement",
            });
          }
        });
      }

      const lastWord = currentLine.split(/[\s(){}[\];,:]/).pop() || "";

      if (lastWord.length >= 2) {
        suggestions.keywords.forEach((keyword) => {
          if (keyword.toLowerCase().startsWith(lastWord.toLowerCase())) {
            allSuggestions.push({
              text: keyword,
              type: "keyword",
              description: "Keyword",
            });
          }
        });

        suggestions.methods.forEach((method) => {
          if (method.toLowerCase().startsWith(lastWord.toLowerCase())) {
            allSuggestions.push({
              text: method,
              type: "method",
              description: "Method",
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
      const lines = textBeforeCursor.split("\n");
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

      if (projectDetails) {
        setHasUnsavedChanges(true);
        if (onHasUnsavedChanges) {
          onHasUnsavedChanges(true);
        }
      }

      setHighlightedBrackets(null);

      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = newCode.substring(0, cursorPos);
      const lines = textBeforeCursor.split("\n");
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
          const textBeforeCursor = textarea.value.substring(
            0,
            textarea.selectionStart,
          );
          const lines = textBeforeCursor.split("\n");
          const currentLineNumber = lines.length;
          const currentLineText = lines[lines.length - 1];

          const lineHeight = 24;
          const charWidth = 8;

          pos.top = (currentLineNumber - 1) * lineHeight + 30;
          pos.left = currentLineText.length * charWidth + 70;
        }

        const newLineSuggestions = new Map(lineSuggestions);
        newLineSuggestions.set(newLineNumber, {
          suggestions: newSuggestions,
          cursorPos: pos,
        });
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      if (highlightedBrackets) {
        setHighlightedBrackets(null);
      }

      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const textBefore = code.substring(0, cursorPos);
      const textAfter = code.substring(cursorPos);
      const nextChar = textAfter[0];

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();

        const commentPrefix = language === "python" ? "#" : "//";
        const commentRegex =
          language === "python" ? /^(\s*)?#\s?/ : /^(\s*)?\/\/\s?/;
        const commentCheck =
          language === "python"
            ? (line: string) => line.trim().startsWith("#")
            : (line: string) => line.trim().startsWith("//");

        const hasSelection = cursorPos !== selectionEnd;
        const selectedText = code.substring(cursorPos, selectionEnd);

        if (hasSelection) {
          const beforeSelection = code.substring(0, cursorPos);
          const afterSelection = code.substring(selectionEnd);

          const lines = selectedText.split("\n");
          const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
          const allCommented =
            nonEmptyLines.length > 0 && nonEmptyLines.every(commentCheck);

          const newLines = lines.map((line) => {
            if (line.trim().length === 0) {
              return line;
            }

            if (allCommented) {
              return line.replace(commentRegex, "$1");
            } else {
              const match = line.match(/^(\s*)/);
              const indent = match ? match[1] : "";
              const restOfLine = line.substring(indent.length);
              return indent + commentPrefix + " " + restOfLine;
            }
          });

          const newSelectedText = newLines.join("\n");
          const newCode = beforeSelection + newSelectedText + afterSelection;
          setCode(newCode);

          setTimeout(() => {
            textarea.setSelectionRange(
              cursorPos,
              cursorPos + newSelectedText.length,
            );
          }, 0);
        } else {
          const lines = code.split("\n");
          const beforeCursor = code.substring(0, cursorPos);
          const currentLineIndex = beforeCursor.split("\n").length - 1;
          const currentLine = lines[currentLineIndex];

          const isCommented = commentCheck(currentLine);

          let newLine;
          if (isCommented) {
            newLine = currentLine.replace(commentRegex, "$1");
          } else {
            const match = currentLine.match(/^(\s*)/);
            const indent = match ? match[1] : "";
            const restOfLine = currentLine.substring(indent.length);
            newLine = indent + commentPrefix + " " + restOfLine;
          }

          lines[currentLineIndex] = newLine;
          const newCode = lines.join("\n");
          setCode(newCode);

          setTimeout(() => {
            const linesBefore = lines.slice(0, currentLineIndex).join("\n");
            const newCursorPos =
              linesBefore.length + (linesBefore ? 1 : 0) + newLine.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        }
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();

        if (e.shiftKey) {
          const lines = textBefore.split("\n");
          const currentLine = lines[lines.length - 1];
          const beforeCurrentLine = textBefore.substring(
            0,
            textBefore.length - currentLine.length,
          );

          const spacesToRemove = currentLine.match(/^( {1,2})/);
          if (spacesToRemove) {
            const newCurrentLine = currentLine.substring(
              spacesToRemove[1].length,
            );
            const newCode = beforeCurrentLine + newCurrentLine + textAfter;
            setCode(newCode);

            setTimeout(() => {
              const newPos = cursorPos - spacesToRemove[1].length;
              textarea.setSelectionRange(newPos, newPos);
            }, 0);
          }
        } else if (showSuggestions) {
          insertSuggestion(suggestions[selectedSuggestion]);
        } else {
          const spaces = "  ";
          const newCode = textBefore + spaces + textAfter;
          setCode(newCode);

          setTimeout(() => {
            textarea.setSelectionRange(
              cursorPos + spaces.length,
              cursorPos + spaces.length,
            );
          }, 0);
        }
        return;
      }

      if (
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") &&
        !showSuggestions
      ) {
        // Handle cursor movement if needed
      }

      const closingPairs: Record<string, string> = {
        "(": ")",
        "[": "]",
        "{": "}",
        '"': '"',
        "'": "'",
      };

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

      if (
        (e.key === ")" ||
          e.key === "]" ||
          e.key === "}" ||
          e.key === '"' ||
          e.key === "'") &&
        nextChar === e.key
      ) {
        e.preventDefault();
        textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
        return;
      }

      if (showSuggestions) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSuggestion((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSuggestion(
            (prev) => (prev - 1 + suggestions.length) % suggestions.length,
          );
        } else if (e.key === "Enter") {
          e.preventDefault();
          insertSuggestion(suggestions[selectedSuggestion]);
        } else if (e.key === "Escape") {
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

      let newText = "";
      let newCursorPos = cursorPos;

      if (suggestion.type === "import") {
        const lines = textBefore.split("\n");
        const currentLine = lines[lines.length - 1];
        const beforeImport = textBefore.substring(
          0,
          textBefore.length - currentLine.length,
        );
        newText = beforeImport + suggestion.text + textAfter;
        newCursorPos = beforeImport.length + suggestion.text.length;
      } else {
        const lastWord = textBefore.split(/[\s(){}[\];,]/).pop() || "";
        const beforeWord = textBefore.substring(
          0,
          textBefore.length - lastWord.length,
        );

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

    const addMissingImport = (importStatement: string) => {
      const lines = code.split("\n");
      let insertIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith("package ")) {
          insertIndex = i + 1;
        } else if (lines[i].trim().startsWith("import ")) {
          insertIndex = i + 1;
        } else if (lines[i].trim() && !lines[i].trim().startsWith("//")) {
          break;
        }
      }

      lines.splice(insertIndex, 0, importStatement);
      const newCode = lines.join("\n");
      setCode(newCode);

      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    const handleCursorMove = () => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = code.substring(0, cursorPos);
      const lines = textBeforeCursor.split("\n");
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
      if (
        textareaRef.current &&
        lineNumbersRef.current &&
        highlightRef.current
      ) {
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

    const findMatchingBracket = (
      text: string,
      clickPos: number,
    ): { start: number; end: number } | null => {
      const char = text[clickPos];
      const bracketPairs: Record<string, string> = {
        "{": "}",
        "}": "{",
        "[": "]",
        "]": "[",
        "(": ")",
        ")": "(",
      };

      if (!bracketPairs[char]) return null;

      const isOpening = ["{", "[", "("].includes(char);
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
              ? { start: clickPos, end: pos }
              : { start: pos, end: clickPos };
          }
        }

        pos += direction;
      }

      return null;
    };

    const handleTextareaClick = () => {
      if (!textareaRef.current) return;

      const clickPos = textareaRef.current.selectionStart;
      const matched = findMatchingBracket(code, clickPos);

      setHighlightedBrackets(matched);
    };

    const handleSaveProgress = async () => {
      if (!projectDetails || isSaving) return;

      setIsSaving(true);
      setSaveMessage("");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSaveMessage("Error: Not authenticated");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/mini-projects/save-progress`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectTitle: projectDetails.title,
              codeBase: code,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          setSaveMessage("Progress saved successfully");
          setHasUnsavedChanges(false);
          if (onHasUnsavedChanges) {
            onHasUnsavedChanges(false);
          }
          setTimeout(() => setSaveMessage(""), 3000);
        } else {
          setSaveMessage(data.message || "Error saving progress");
        }
      } catch {
        setSaveMessage("Error saving progress");
      } finally {
        setIsSaving(false);
      }
    };

    const handleBackClick = () => {
      if (onBack) {
        onBack();
      }
    };



    const handleAutoSubmit = async (): Promise<{
      success: boolean;
      error?: string;
    }> => {
      if (!isActivityMode || !projectDetails) {
        return {
          success: false,
          error: "Invalid activity mode or project details",
        };
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return { success: false, error: "Authentication required" };
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/activities/${projectDetails._id}/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              codeBase: code,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            error: error.message || "Failed to submit activity",
          };
        }

        if (onSubmitSuccess) {
          onSubmitSuccess();
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Network error occurred",
        };
      }
    };

    const handleSubmitProject = async () => {
      if (!projectDetails || isSaving || isGrading) return;
      setShowSubmitConfirmModal(true);
    };

    const confirmSubmitProject = async () => {
      if (!projectDetails) return;
      setShowSubmitConfirmModal(false);
      setIsSaving(true);
      setIsGrading(true);
      setSaveMessage("");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSaveMessage("Error: Not authenticated");
          setIsGrading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/mini-projects/submit-project`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectTitle: projectDetails.title,
              codeBase: code,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          setGradingResult(data.gradingResult);
          setShowGradingModal(true);
          setSaveMessage("");

          // Check for Level Up
          if (data.leveledUp) {
            window.dispatchEvent(
              new CustomEvent("level-up", {
                detail: { level: data.newLevel },
              }),
            );
          }

          if (onSubmitSuccess) {
            onSubmitSuccess();
          }

          setTypedFeedback("");
          setIsTyping(true);
          const fullText = data.gradingResult.feedback || "";
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
          setSaveMessage(data.message || "Error submitting project");
        }
      } catch {
        setSaveMessage("Error submitting project");
      } finally {
        setIsSaving(false);
        setIsGrading(false);
      }
    };

    return (
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <CompilerHeader
          isActivityMode={isActivityMode}
          projectDetails={projectDetails}
          onBack={onBack ? handleBackClick : undefined}
          language={language}
          isRunning={isRunning}
          isSaving={isSaving}
          isGrading={isGrading}
          hasUnsavedChanges={hasUnsavedChanges}
          timeRemaining={timeRemaining}
          saveMessage={saveMessage}
          onLanguageChange={handleLanguageChange}
          onRun={handleRun}
          onStop={handleStop}
          onSaveProgress={handleSaveProgress}
          onSubmitProject={handleSubmitProject}
          onMenuClick={onMenuClick}
          isSubmittingActivity={isSubmittingActivity}
          setShowActivitySubmitModal={setShowActivitySubmitModal}
        />

        <MissingImportsBanner
          language={language}
          missingImports={missingImports}
          onAddImport={addMissingImport}
        />

        {showLibraries && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">Available Libraries</h4>
              <button onClick={() => setShowLibraries(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {libraries.map((lib) => (
                <div key={lib.filename} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-medium text-gray-900">{lib.name}</div>
                  <div className="text-xs text-gray-500">v{lib.version}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor and Output */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
          {/* Code Editor */}
          <div className="flex flex-col border-r border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Code Editor
              </h3>
            </div>
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              {/* Line Numbers */}
              <div
                ref={lineNumbersRef}
                className="bg-gray-50 border-r border-gray-200 select-none overflow-hidden flex-shrink-0"
                style={{ width: "60px" }}
              >
                <div className="py-3 pr-2 text-right">
                  {(() => {
                    const linesWithMissingImports = findLinesWithMissingImports(
                      code,
                      missingImports,
                    );
                    const unusedImports = findUnusedImports(code);

                    return lineNumbers.map((num) => {
                      const hasError = compilationErrors.some(
                        (err) => err.line === num,
                      );
                      const error = compilationErrors.find(
                        (err) => err.line === num,
                      );
                      const hasMissingImport =
                        !hasError && linesWithMissingImports.has(num);
                      const hasUnusedImport =
                        !hasError &&
                        !hasMissingImport &&
                        unusedImports.has(num);
                      const hasWarning = hasMissingImport || hasUnusedImport;

                      return (
                        <div
                          key={num}
                          className={`text-xs font-mono flex items-center justify-end space-x-1 ${
                            hasError
                              ? "text-red-600 font-bold"
                              : hasWarning
                                ? "text-yellow-600 font-bold"
                                : "text-gray-400"
                          }`}
                          style={{
                            height: "24px",
                            minHeight: "24px",
                            lineHeight: "24px",
                          }}
                          title={
                            hasError
                              ? error?.message
                              : hasMissingImport
                                ? "Missing import - click the lightbulb icon above to add"
                                : hasUnusedImport
                                  ? "Unused import"
                                  : ""
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
                  style={{ lineHeight: "24px" }}
                >
                  {highlightCode(
                    code,
                    language,
                    compilationErrors,
                    new Set([
                      ...findLinesWithMissingImports(code, missingImports),
                      ...findUnusedImports(code),
                    ]),
                  )}
                </div>

                {/* Bracket Matching Highlights */}
                {highlightedBrackets && (
                  <div
                    ref={bracketHighlightRef}
                    className="absolute inset-0 px-4 py-3 text-sm font-mono overflow-hidden whitespace-pre pointer-events-none"
                    style={{ lineHeight: "24px" }}
                  >
                    {(() => {
                      const beforeStart = code.substring(
                        0,
                        highlightedBrackets.start,
                      );
                      const startChar = code[highlightedBrackets.start];
                      const betweenBrackets = code.substring(
                        highlightedBrackets.start + 1,
                        highlightedBrackets.end,
                      );
                      const endChar = code[highlightedBrackets.end];
                      const afterEnd = code.substring(
                        highlightedBrackets.end + 1,
                      );

                      return (
                        <>
                          <span style={{ color: "transparent" }}>
                            {beforeStart}
                          </span>
                          <span
                            style={{
                              backgroundColor: "#fbbf24",
                              color: "#000000",
                              fontWeight: "bold",
                              borderRadius: "2px",
                              padding: "0 1px",
                            }}
                          >
                            {startChar}
                          </span>
                          <span style={{ color: "transparent" }}>
                            {betweenBrackets}
                          </span>
                          <span
                            style={{
                              backgroundColor: "#fbbf24",
                              color: "#000000",
                              fontWeight: "bold",
                              borderRadius: "2px",
                              padding: "0 1px",
                            }}
                          >
                            {endChar}
                          </span>
                          <span style={{ color: "transparent" }}>
                            {afterEnd}
                          </span>
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
                  onClick={() => {
                    handleTextareaClick();
                    handleCursorMove();
                    updateCursorPosition();
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-0 px-4 py-3 bg-transparent text-sm font-mono text-transparent caret-black resize-none focus:outline-none overflow-auto whitespace-pre"
                  style={{
                    lineHeight: "24px",
                    caretColor: "#000000",
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
                      minWidth: "300px",
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                          index === selectedSuggestion
                            ? "bg-blue-100"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => insertSuggestion(suggestion)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-mono text-gray-900">
                            {suggestion.text}
                          </span>
                          <span className="text-xs text-gray-500">
                            {suggestion.description}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            suggestion.type === "import"
                              ? "bg-purple-100 text-purple-700"
                              : suggestion.type === "keyword"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
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
          <OutputConsole
            isActivityMode={isActivityMode}
            projectDetails={projectDetails}
            isRunning={isRunning}
            output={output}
            currentInput={currentInput}
            aiMessages={aiMessages}
            isStreaming={isStreaming}
            streamingText={streamingText}
            isAiThinking={isAiThinking}
            consoleRef={consoleRef}
            onKeyDown={handleConsoleKeyDown}
          />
        </div>

        {/* Navigation Warning Modal - Removed */}

        {showTimeUpModal && (
          <TimeUpModal
            onContinue={async () => {
              setShowTimeUpModal(false);
              await handleAutoSubmit();
              if (onBack) onBack();
            }}
          />
        )}

        {showSubmitConfirmModal && (
          <SubmitConfirmModal
            onConfirm={confirmSubmitProject}
            onCancel={() => setShowSubmitConfirmModal(false)}
          />
        )}

        {isGrading && !showGradingModal && <GradingLoadingModal />}

        {showGradingModal && gradingResult && (
          <GradingResultsModal
            result={gradingResult}
            feedback={typedFeedback}
            isTyping={isTyping}
            onClose={() => {
              setShowGradingModal(false);
              if (onBack) onBack();
            }}
          />
        )}

        <ActivityStatusModals
          showConfirm={showActivitySubmitModal}
          isSubmitting={isSubmittingActivity}
          success={submitSuccess}
          error={submitError}
          onConfirm={async () => {
            setIsSubmittingActivity(true);
            const result = await handleAutoSubmit();
            setIsSubmittingActivity(false);
            if (result.success) setSubmitSuccess(true);
            else setSubmitError(result.error || "Failed to submit activity");
          }}
          onCancel={() => setShowActivitySubmitModal(false)}
          onCloseSuccess={() => {
            setSubmitSuccess(false);
            setShowActivitySubmitModal(false);
            setHasUnsavedChanges(false);
            if (onHasUnsavedChanges) onHasUnsavedChanges(false);
            if (onBack) setTimeout(() => onBack(), 100);
          }}
          onCloseError={() => {
            setSubmitError(null);
            setShowActivitySubmitModal(false);
          }}
          onRetry={() => setSubmitError(null)}
        />

        {showConfirmationModal && (
          <LanguageSwitchModal
            currentLang={language}
            pendingLang={pendingLanguage || ""}
            onConfirm={() => {
              setShowConfirmationModal(false);
              setShowSurveyModal(true);
            }}
            onCancel={() => {
              setShowConfirmationModal(false);
              setPendingLanguage(null);
            }}
          />
        )}

        <OnboardingSurveyModal
          isOpen={showSurveyModal}
          onClose={handleSurveyComplete}
          onCancel={handleSurveyCancel}
          preselectedLanguage={pendingLanguage || undefined}
        />
      </div>
    );
  },
);

Compiler.displayName = "Compiler";

export default Compiler;
