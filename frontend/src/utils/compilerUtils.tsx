import { 
  highlightJavaCode, 
  CompilationError as JavaCompilationError 
} from "../utils/javaUtils";
import { 
  highlightPythonCode, 
  CompilationError as PythonCompilationError 
} from "../utils/pythonUtils";

export type CompilationError = JavaCompilationError | PythonCompilationError;

export const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
];

export const DEFAULT_CODE: Record<string, string> = {
  python: `# Python Code
def greet(name):
    return f"Hello, {name}!"

print(greet('World'))`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) { 
        System.out.println("Hello, World!");
    }
}`,
};

export const highlightCode = (
  code: string,
  language: string,
  errors: CompilationError[] = [],
  warningLines: Set<number> = new Set(),
) => {
  if (language === "java") {
    return highlightJavaCode(code, errors, warningLines);
  }

  if (language === "python") {
    return highlightPythonCode(code, errors);
  }

  return code.split("\n").map((line, index) => (
    <div key={index} style={{ height: "24px", minHeight: "24px" }}>
      {line || "\u00A0"}
    </div>
  ));
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};
