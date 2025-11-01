import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' }
];

const DEFAULT_CODE: Record<string, string> = {
  python: `# Python Code
def greet(name):
    return f"Hello, {name}!"

print(greet('World'))`,
  java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println(greet("World"));
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`
};

const highlightCode = (code: string, language: string) => {
  if (language === 'python') {
    // Python comments start with #
    return code.split('\n').map((line, index) => {
      const commentIndex = line.indexOf('#');
      if (commentIndex !== -1) {
        const beforeComment = line.substring(0, commentIndex);
        const comment = line.substring(commentIndex);
        return (
          <div key={index} style={{ height: '24px' }}>
            <span>{beforeComment}</span>
            <span style={{ color: '#22c55e' }}>{comment}</span>
          </div>
        );
      }
      return <div key={index} style={{ height: '24px' }}>{line || '\u00A0'}</div>;
    });
  } else if (language === 'java') {
    // Java comments start with //
    return code.split('\n').map((line, index) => {
      const commentIndex = line.indexOf('//');
      if (commentIndex !== -1) {
        const beforeComment = line.substring(0, commentIndex);
        const comment = line.substring(commentIndex);
        return (
          <div key={index} style={{ height: '24px' }}>
            <span>{beforeComment}</span>
            <span style={{ color: '#22c55e' }}>{comment}</span>
          </div>
        );
      }
      return <div key={index} style={{ height: '24px' }}>{line || '\u00A0'}</div>;
    });
  }
  return code.split('\n').map((line, index) => (
    <div key={index} style={{ height: '24px' }}>{line || '\u00A0'}</div>
  ));
};

export default function Compiler() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [code]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage]);
    setOutput('');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running code...');

    setTimeout(() => {
      setOutput(`Code compilation for ${language} is not available in browser.\nThis is a demo environment. In production, this would connect to a backend compiler service.`);
      setIsRunning(false);
    }, 500);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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

      {/* Editor and Output */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Code Editor */}
        <div className="flex flex-col border-r border-gray-200 bg-white">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Code Editor</h3>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="bg-gray-50 border-r border-gray-200 overflow-hidden select-none"
              style={{ width: '50px' }}
            >
              <div className="py-3 pr-2 text-right">
                {lineNumbers.map((num) => (
                  <div
                    key={num}
                    className="text-xs font-mono text-gray-400 leading-6"
                    style={{ height: '24px' }}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
            {/* Code Area with Syntax Highlighting */}
            <div className="flex-1 relative overflow-hidden">
              {/* Syntax Highlighted Display */}
              <div
                ref={highlightRef}
                className="absolute inset-0 px-4 py-3 text-sm font-mono overflow-auto pointer-events-none whitespace-pre"
                style={{ lineHeight: '24px' }}
              >
                {highlightCode(code, language)}
              </div>
              {/* Input Textarea (Transparent) */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                className="absolute inset-0 px-4 py-3 bg-transparent text-sm font-mono text-transparent caret-gray-900 resize-none focus:outline-none leading-6 whitespace-pre"
                style={{ 
                  lineHeight: '24px',
                  caretColor: '#111827'
                }}
                spellCheck={false}
                placeholder="Write your code here..."
              />
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col bg-gray-900">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Output</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap">
              {output || 'Click "Run Code" to see the output here...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
