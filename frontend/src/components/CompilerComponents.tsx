import { 
  Play, Menu, X, Square, ArrowLeft, Save, Send, Clock, 
  CheckCircle, AlertCircle, Lightbulb 
} from "lucide-react";
import { formatTime, LANGUAGE_OPTIONS } from "../utils/compilerUtils";
import { MissingImport } from "../utils/javaUtils";

// --- Header Component ---

interface CompilerHeaderProps {
  isActivityMode: boolean;
  projectDetails: { _id?: string; title: string; description: string; language: string; requirements: string; duration?: { hours: number; minutes: number } } | null | undefined;
  onBack?: () => void;
  language: string;
  isRunning: boolean;
  isSaving: boolean;
  isGrading: boolean;
  hasUnsavedChanges: boolean;
  timeRemaining: number | null;
  saveMessage: string;
  onLanguageChange: (lang: string) => void;
  onRun: () => void;
  onStop: () => void;
  onSaveProgress: () => void;
  onSubmitProject: () => void;
  onMenuClick: () => void;
  isSubmittingActivity: boolean;
  setShowActivitySubmitModal: (show: boolean) => void;
}

export function CompilerHeader({
  isActivityMode,
  projectDetails,
  onBack,
  language,
  isRunning,
  isSaving,
  isGrading,
  hasUnsavedChanges,
  timeRemaining,
  saveMessage,
  onLanguageChange,
  onRun,
  onStop,
  onSaveProgress,
  onSubmitProject,
  onMenuClick,
  isSubmittingActivity,
  setShowActivitySubmitModal
}: CompilerHeaderProps) {
  return (
    <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {isActivityMode && projectDetails ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button onClick={onBack} className="p-1 text-gray-600 hover:text-gray-900 transition-colors" title="Back">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-base font-semibold text-gray-900">{projectDetails.title}</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">{projectDetails.language}</span>
              </div>
              <p className="text-sm text-gray-600">{projectDetails.description}</p>
              {projectDetails.requirements && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Requirements:</p>
                  <div className="text-xs text-gray-600 whitespace-pre-line">{projectDetails.requirements}</div>
                </div>
              )}
            </div>
          ) : projectDetails && !isActivityMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button onClick={onBack} className="p-1 text-gray-600 hover:text-gray-900 transition-colors" title="Back">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-base font-semibold text-gray-900">{projectDetails.title}</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">{projectDetails.language}</span>
              </div>
              <p className="text-sm text-gray-600">{projectDetails.description}</p>
              {projectDetails.requirements && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Requirements:</p>
                  <div className="text-xs text-gray-600 whitespace-pre-line">{projectDetails.requirements}</div>
                </div>
              )}
              {saveMessage && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${saveMessage.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {saveMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {!projectDetails && !isActivityMode && (
                <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              {!isActivityMode && (
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2"
                  disabled={isRunning || !!projectDetails}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isActivityMode && timeRemaining !== null && (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold ${timeRemaining <= 300 ? "bg-red-100 text-red-700" : timeRemaining <= 600 ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
          {projectDetails && !isActivityMode && (
            <>
              <button onClick={onSaveProgress} disabled={isSaving} className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50" title="Save Progress">
                <Save className="w-5 h-5" />
                {hasUnsavedChanges && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <button onClick={onSubmitProject} disabled={isSaving || isGrading} className="flex items-center gap-1.5 px-2 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50" title="Submit Project">
                <Send className="w-5 h-5" />
                <span className="text-sm font-medium">{isGrading ? "Grading..." : isSaving ? "Submitting..." : "Submit"}</span>
              </button>
            </>
          )}
          {isActivityMode && (
            <button onClick={() => setShowActivitySubmitModal(true)} disabled={isSaving || isSubmittingActivity} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />
              <span>{isSubmittingActivity ? "Submitting..." : "Submit"}</span>
            </button>
          )}
          {isRunning && (
            <button onClick={onStop} className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              <Square className="w-4 h-4" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}
          <button onClick={onRun} disabled={isRunning} className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">{isRunning ? "Running..." : "Run Code"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Missing Imports Component ---

export function MissingImportsBanner({ language, missingImports, onAddImport }: { language: string; missingImports: MissingImport[]; onAddImport: (imp: string) => void }) {
  if (language !== "java" || missingImports.length === 0) return null;
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-800 font-medium">Missing imports detected: {missingImports.map((m) => m.className).join(", ")}</span>
        </div>
        <div className="flex items-center space-x-2">
          {missingImports.map((missing, index) => (
            <button key={index} onClick={() => onAddImport(missing.importStatement)} className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
              Add {missing.className}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Modals ---

export function TimeUpModal({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Time's Up!</h2></div>
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">The time limit for this activity has been reached. Your code will be automatically submitted.</p>
          <p className="text-xs text-gray-500">Click Continue to submit and return to the classroom.</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button onClick={onContinue} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">Continue</button>
        </div>
      </div>
    </div>
  );
}

export function SubmitConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Confirm Submission</h2></div>
        <div className="p-6"><p className="text-sm text-gray-700">Are you sure you want to submit this project? The AI will grade your submission and you cannot edit it after submission.</p></div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">OK</button>
        </div>
      </div>
    </div>
  );
}

export function GradingLoadingModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mb-4 mx-auto"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Grading Your Project</h3>
        <p className="text-sm text-gray-600 mb-3">Please wait while AI analyzes your code...</p>
        <div className="mt-4 space-y-1 text-xs text-gray-500">
          <p>Submitting your code...</p>
          <p>AI is analyzing your solution...</p>
          <p>Generating feedback...</p>
          <p>Calculating your score...</p>
        </div>
      </div>
    </div>
  );
}

export function GradingResultsModal({ result, feedback, isTyping, onClose }: { result: { score: number; passed: boolean; feedback?: string }; feedback: string; isTyping: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Grading Results</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-6 overflow-auto">
          <div className="text-center py-4">
            <div className="text-6xl font-bold text-black mb-2">{result.score}/100</div>
            <div className="text-lg font-semibold text-gray-600">{result.passed ? "You Passed!" : "Keep Practicing!"}</div>
          </div>
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <div className="text-sm text-gray-800 whitespace-pre-line font-mono">{feedback}{isTyping && <span className="animate-pulse">|</span>}</div>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">Back to Projects</button>
        </div>
      </div>
    </div>
  );
}

export function ActivityStatusModals({
  showConfirm,
  isSubmitting,
  success,
  error,
  onConfirm,
  onCancel,
  onCloseSuccess,
  onCloseError,
  onRetry
}: {
  showConfirm: boolean;
  isSubmitting: boolean;
  success: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onCloseSuccess: () => void;
  onCloseError: () => void;
  onRetry: () => void;
}) {
  if (isSubmitting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mb-4 mx-auto"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitting Activity</h3>
          <p className="text-sm text-gray-600">Please wait while we submit your code...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-green-600">Submission Successful!</h2></div>
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto"><CheckCircle className="w-10 h-10 text-green-600" /></div>
            <p className="text-sm text-gray-700">Your activity has been submitted successfully! Your teacher will review your submission.</p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button onClick={onCloseSuccess} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">Continue</button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-red-600">Submission Failed</h2></div>
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto"><AlertCircle className="w-10 h-10 text-red-600" /></div>
            <p className="text-sm text-gray-700 mb-2">We encountered an error while submitting your activity.</p>
            <p className="text-xs text-red-600 font-mono">{error}</p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={onCloseError} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Close</button>
            <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Submit Activity?</h2></div>
          <div className="p-6 text-sm text-gray-700">Are you sure you want to submit this activity? You cannot edit your submission after submitting.</div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Submit</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function LanguageSwitchModal({ currentLang, pendingLang, onConfirm, onCancel }: { currentLang: string; pendingLang: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-xl font-bold text-gray-900">Switch Language</h2></div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: currentLang === "java" ? "#DBEAFE" : "#FEF3C7", color: currentLang === "java" ? "#3B82F6" : "#F59E0B" }}>{currentLang === "java" ? "Jv" : "Py"}</div>
            <div className="flex-1"><p className="text-sm font-medium text-gray-700">Current</p><p className="text-lg font-bold text-gray-900 capitalize">{currentLang}</p></div>
          </div>
          <div className="flex justify-center"><ArrowLeft className="w-6 h-6 text-gray-400 rotate-[-90deg]" /></div>
          <div className="flex items-center gap-4 p-4 border-2 rounded-lg" style={{ borderColor: "#1B5E20", backgroundColor: "#E8F5E9" }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: pendingLang === "java" ? "#DBEAFE" : "#FEF3C7", color: pendingLang === "java" ? "#3B82F6" : "#F59E0B" }}>{pendingLang === "java" ? "Jv" : "Py"}</div>
            <div className="flex-1"><p className="text-sm font-medium text-gray-700">Switch To</p><p className="text-lg font-bold text-gray-900 capitalize">{pendingLang}</p></div>
          </div>
          <p className="text-sm text-gray-600">You will need to complete a quick survey to assess your skills in {pendingLang}. This helps us personalize your experience.</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">Continue</button>
        </div>
      </div>
    </div>
  );
}

// --- Console Components ---

interface OutputConsoleProps {
  isActivityMode: boolean;
  projectDetails: { _id?: string; title: string; description: string; language: string; requirements: string } | null | undefined;
  isRunning: boolean;
  output: string;
  currentInput: string;
  aiMessages: Array<{ type: "ai" | "user"; text: string }>;
  isStreaming: boolean;
  streamingText: string;
  isAiThinking: boolean;
  consoleRef: React.RefObject<HTMLDivElement>;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function OutputConsole({
  isActivityMode,
  projectDetails,
  isRunning,
  output,
  currentInput,
  aiMessages,
  isStreaming,
  streamingText,
  isAiThinking,
  consoleRef,
  onKeyDown
}: OutputConsoleProps) {
  return (
    <div className="flex flex-col bg-gray-900 overflow-hidden">
      <div className="px-2 py-1 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          {projectDetails && !isRunning && !output && !isActivityMode ? "SkillVerse Coding Assistant" : "Interactive Console"}
        </h3>
      </div>
      <div
        ref={consoleRef}
        className="flex-1 overflow-auto min-h-0 focus:outline-none"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ cursor: isRunning ? "text" : "default" }}
      >
        {projectDetails && !isRunning && !isActivityMode && !output ? (
          <div className="space-y-2 p-2">
            {aiMessages.length === 0 && !isStreaming && !isAiThinking ? (
              <div className="text-sm text-gray-400 font-mono">Waiting for AI hints...</div>
            ) : (
              <>
                {aiMessages.map((msg, index) => (
                  <div key={index} className="flex flex-col mb-4 last:mb-0">
                    <div className="text-xs font-semibold mb-1 text-gray-400">SkillVerse Assistant</div>
                    <div className="text-sm font-mono text-gray-100 whitespace-pre-wrap">{msg.text}</div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex flex-col">
                    <div className="text-xs font-semibold mb-1 text-gray-400">SkillVerse Assistant</div>
                    <div className="text-sm font-mono text-gray-100 whitespace-pre-wrap">{streamingText}<span className="animate-pulse">|</span></div>
                  </div>
                )}
                {isAiThinking && (
                  <div className="flex flex-col">
                    <div className="text-xs font-semibold mb-1 text-gray-400">SkillVerse Assistant</div>
                    <div className="text-sm font-mono text-gray-100">Analyzing your code<span className="animate-pulse">...</span></div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="p-4">
            <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap">
              {output || 'Click "Run Code" to execute your program.\n\nMissing imports are automatically detected!\nWhen the program asks for input, type directly here and press Enter.'}
              {isRunning && <span className="text-green-400">{currentInput}<span className="animate-pulse">█</span></span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
