import { AlertCircle, AlertTriangle } from 'lucide-react';

export const JAVA_KEYWORDS = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
];

export const JAVA_TYPES = ['String', 'Integer', 'Double', 'Float', 'Long', 'Boolean', 'Character', 'Byte', 'Short'];

export const JAVA_CONSTANTS = ['true', 'false', 'null'];

export const CLASS_TO_IMPORT: Record<string, string> = {
  'Scanner': 'import java.util.Scanner;',
  'ArrayList': 'import java.util.ArrayList;',
  'HashMap': 'import java.util.HashMap;',
  'HashSet': 'import java.util.HashSet;',
  'LinkedList': 'import java.util.LinkedList;',
  'Queue': 'import java.util.Queue;',
  'Stack': 'import java.util.Stack;',
  'List': 'import java.util.List;',
  'Map': 'import java.util.Map;',
  'Set': 'import java.util.Set;',
  'Date': 'import java.util.Date;',
  'Random': 'import java.util.Random;',
  'BigDecimal': 'import java.math.BigDecimal;',
  'BigInteger': 'import java.math.BigInteger;',
  'File': 'import java.io.File;',
  'FileReader': 'import java.io.FileReader;',
  'FileWriter': 'import java.io.FileWriter;',
  'BufferedReader': 'import java.io.BufferedReader;',
  'BufferedWriter': 'import java.io.BufferedWriter;',
  'Gson': 'import com.google.gson.Gson;',
  'ObjectMapper': 'import com.fasterxml.jackson.databind.ObjectMapper;',
  'JsonProperty': 'import com.fasterxml.jackson.annotation.JsonProperty;',
  'StringUtils': 'import org.apache.commons.lang3.StringUtils;',
  'WordUtils': 'import org.apache.commons.lang3.text.WordUtils;',
  'DescriptiveStatistics': 'import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;',
  'FastMath': 'import org.apache.commons.math3.util.FastMath;',
  'FileUtils': 'import org.apache.commons.io.FileUtils;',
  'IOUtils': 'import org.apache.commons.io.IOUtils;',
  'HttpStatus': 'import org.apache.hc.core5.http.HttpStatus;',
  'Test': 'import org.junit.jupiter.api.Test;',
  'Assertions': 'import org.junit.jupiter.api.Assertions;',
  'Logger': 'import org.slf4j.Logger;',
  'LoggerFactory': 'import org.slf4j.LoggerFactory;'
};

export const JAVA_SUGGESTIONS = {
  imports: [
    'import java.util.Scanner;',
    'import java.util.ArrayList;',
    'import java.util.HashMap;',
    'import java.util.HashSet;',
    'import java.util.List;',
    'import java.util.Map;',
    'import java.util.Set;',
    'import java.util.Queue;',
    'import java.util.Stack;',
    'import java.util.LinkedList;',
    'import java.util.Date;',
    'import java.util.Random;',
    'import java.io.*;',
    'import java.math.BigDecimal;',
    'import com.google.gson.Gson;',
    'import com.fasterxml.jackson.databind.ObjectMapper;',
    'import com.fasterxml.jackson.annotation.JsonProperty;',
    'import org.apache.commons.lang3.StringUtils;',
    'import org.apache.commons.lang3.text.WordUtils;',
    'import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;',
    'import org.apache.commons.math3.util.FastMath;',
    'import org.apache.commons.io.FileUtils;',
    'import org.apache.commons.io.IOUtils;',
    'import org.apache.hc.core5.http.HttpStatus;',
    'import org.junit.jupiter.api.Test;',
    'import org.junit.jupiter.api.Assertions;',
    'import org.slf4j.Logger;',
    'import org.slf4j.LoggerFactory;'
  ],
  keywords: JAVA_KEYWORDS,
  methods: [
    'System.out.println();',
    'System.out.print();',
    'scanner.nextLine()',
    'scanner.nextInt()',
    'scanner.nextDouble()',
    'scanner.next()',
    'scanner.close()',
    '.length()',
    '.toString()',
    '.equals()',
    '.substring()',
    '.toUpperCase()',
    '.toLowerCase()',
    '.trim()',
    '.split()',
    '.contains()',
    '.add()',
    '.remove()',
    '.get()',
    '.put()',
    '.size()'
  ]
};

export interface MissingImport {
  className: string;
  importStatement: string;
}

export interface CompilationError {
  line: number;
  type: string;
  message: string;
  context: string;
}

const highlightLineSegment = (text: string, lineIndex: number, startIndex: number) => {
  if (!text) return '\u00A0';

  const segments: JSX.Element[] = [];
  let remaining = text;
  let currentPos = 0;

  while (remaining) {
    const stringMatch = remaining.match(/^"([^"\\]|\\.)*"/);
    if (stringMatch) {
      segments.push(
        <span key={`${lineIndex}-${startIndex + currentPos}`} style={{ color: '#A31515' }}>
          {stringMatch[0]}
        </span>
      );
      currentPos += stringMatch[0].length;
      remaining = remaining.substring(stringMatch[0].length);
      continue;
    }

    const numberMatch = remaining.match(/^\d+(\.\d+)?/);
    if (numberMatch) {
      segments.push(
        <span key={`${lineIndex}-${startIndex + currentPos}`} style={{ color: '#098658' }}>
          {numberMatch[0]}
        </span>
      );
      currentPos += numberMatch[0].length;
      remaining = remaining.substring(numberMatch[0].length);
      continue;
    }

    const annotationMatch = remaining.match(/^@\w+/);
    if (annotationMatch) {
      segments.push(
        <span key={`${lineIndex}-${startIndex + currentPos}`} style={{ color: '#267F99' }}>
          {annotationMatch[0]}
        </span>
      );
      currentPos += annotationMatch[0].length;
      remaining = remaining.substring(annotationMatch[0].length);
      continue;
    }

    const wordMatch = remaining.match(/^[a-zA-Z_]\w*/);
    if (wordMatch) {
      const word = wordMatch[0];
      let color = '#000000';

      if (JAVA_KEYWORDS.includes(word)) {
        color = '#0000FF';
      } else if (JAVA_TYPES.includes(word)) {
        color = '#267F99';
      } else if (JAVA_CONSTANTS.includes(word)) {
        color = '#0000FF';
      } else if (word.match(/^[A-Z]/)) {
        color = '#267F99';
      }

      segments.push(
        <span key={`${lineIndex}-${startIndex + currentPos}`} style={{ color }}>
          {word}
        </span>
      );
      currentPos += word.length;
      remaining = remaining.substring(word.length);
      continue;
    }

    const opMatch = remaining.match(/^[+\-*/%=<>!&|^~?:;,.\[\]{}()]+/);
    if (opMatch) {
      segments.push(
        <span key={`${lineIndex}-${startIndex + currentPos}`} style={{ color: '#000000' }}>
          {opMatch[0]}
        </span>
      );
      currentPos += opMatch[0].length;
      remaining = remaining.substring(opMatch[0].length);
      continue;
    }

    const spaceMatch = remaining.match(/^\s+/);
    if (spaceMatch) {
      segments.push(
        <span key={`${lineIndex}-${startIndex + currentPos}`}>
          {spaceMatch[0]}
        </span>
      );
      currentPos += spaceMatch[0].length;
      remaining = remaining.substring(spaceMatch[0].length);
      continue;
    }

    segments.push(
      <span key={`${lineIndex}-${startIndex + currentPos}`} style={{ color: '#000000' }}>
        {remaining[0]}
      </span>
    );
    currentPos += 1;
    remaining = remaining.substring(1);
  }

  return segments;
};

export const highlightJavaCode = (code: string, errors: CompilationError[] = [], warningLines: Set<number> = new Set()) => {
  const lines = code.split('\n');
  
  return lines.map((line, lineIndex) => {
    let segments: JSX.Element[] = [];

    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
      const beforeComment = line.substring(0, commentIndex);
      const comment = line.substring(commentIndex);
      
      segments.push(
        <span key={`line-${lineIndex}`}>
          {highlightLineSegment(beforeComment, lineIndex, 0)}
          <span style={{ color: '#008000' }}>{comment}</span>
        </span>
      );
    } else {
      segments.push(
        <span key={`line-${lineIndex}`}>
          {highlightLineSegment(line, lineIndex, 0)}
        </span>
      );
    }

    const hasError = errors.some(err => err.line === lineIndex + 1);
    const hasWarning = !hasError && warningLines.has(lineIndex + 1);
    
    return (
      <div 
        key={lineIndex} 
        style={{ 
          height: '24px', 
          minHeight: '24px',
          backgroundColor: hasError ? 'rgba(255, 0, 0, 0.1)' : 
                          hasWarning ? 'rgba(255, 193, 7, 0.1)' : 
                          'transparent'
        }}
      >
        {segments.length > 0 ? segments : '\u00A0'}
      </div>
    );
  });
};

export const findMissingImports = (code: string): MissingImport[] => {
  const existingImports = code.match(/^import\s+[\w.]+;/gm) || [];
  const existingImportSet = new Set(existingImports.map(imp => imp.trim()));
  
  const missing: MissingImport[] = [];
  const foundClasses = new Set<string>();

  const classMatches = code.match(/\b[A-Z]\w+\b/g) || [];
  
  for (const className of classMatches) {
    if (foundClasses.has(className) || className === 'Main' || className === 'System') {
      continue;
    }
    
    const importStatement = CLASS_TO_IMPORT[className];
    if (importStatement && !existingImportSet.has(importStatement)) {
      missing.push({ className, importStatement });
      foundClasses.add(className);
    }
  }
  
  return missing;
};

export const findLinesWithMissingImports = (code: string, missingImports: MissingImport[]): Set<number> => {
  const lines = code.split('\n');
  const linesWithWarnings = new Set<number>();
  
  missingImports.forEach(({ className }) => {
    lines.forEach((line, index) => {
      const regex = new RegExp(`\\b${className}\\b`);
      if (regex.test(line)) {
        linesWithWarnings.add(index + 1);
      }
    });
  });
  
  return linesWithWarnings;
};

export const findUnusedImports = (code: string): Set<number> => {
  const lines = code.split('\n');
  const unusedImportLines = new Set<number>();
  
  lines.forEach((line, index) => {
    const importMatch = line.match(/^import\s+([\w.]+);/);
    if (importMatch) {
      const fullImport = importMatch[1];
      const className = fullImport.split('.').pop();
      
      if (className && className !== '*') {
        const codeWithoutImports = lines
          .filter((l, i) => i !== index && !l.trim().startsWith('import'))
          .join('\n');
        
        const classRegex = new RegExp(`\\b${className}\\b`);
        if (!classRegex.test(codeWithoutImports)) {
          unusedImportLines.add(index + 1);
        }
      }
    }
  });
  
  return unusedImportLines;
};
