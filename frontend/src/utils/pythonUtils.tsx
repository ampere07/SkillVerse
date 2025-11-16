export const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
  'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield'
];

export const PYTHON_BUILTIN_FUNCTIONS = [
  'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'bytearray', 'bytes', 'callable', 'chr',
  'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod', 'enumerate',
  'eval', 'exec', 'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr',
  'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
  'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct', 'open',
  'ord', 'pow', 'print', 'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr',
  'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip'
];

export const PYTHON_TYPES = ['int', 'float', 'str', 'list', 'dict', 'tuple', 'set', 'bool'];

export const PYTHON_SUGGESTIONS = {
  imports: [
    'import numpy as np',
    'import pandas as pd',
    'import matplotlib.pyplot as plt',
    'import seaborn as sns',
    'import requests',
    'from bs4 import BeautifulSoup',
    'import json',
    'import csv',
    'import os',
    'import sys',
    'import math',
    'import random',
    'import datetime',
    'import re',
    'from collections import Counter',
    'from itertools import combinations',
    'from functools import reduce',
    'import scipy',
    'from sklearn import *',
    'from PIL import Image',
    'import openpyxl',
    'import pytz'
  ],
  keywords: PYTHON_KEYWORDS,
  methods: [
    'print()',
    'input()',
    'len()',
    'range()',
    'enumerate()',
    '.append()',
    '.extend()',
    '.insert()',
    '.remove()',
    '.pop()',
    '.sort()',
    '.reverse()',
    '.split()',
    '.join()',
    '.strip()',
    '.lower()',
    '.upper()',
    '.replace()',
    '.startswith()',
    '.endswith()',
    '.format()',
    '.keys()',
    '.values()',
    '.items()',
    '.get()',
    '.update()',
    'open()',
    'read()',
    'write()',
    'close()'
  ]
};

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
    const stringMatch = remaining.match(/^("""[\s\S]*?"""|'''[\s\S]*?'''|"([^"\\]|\\.)*"|'([^'\\]|\\.)*')/);
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

    const decoratorMatch = remaining.match(/^@\w+/);
    if (decoratorMatch) {
      segments.push(
        <span key={`${lineIndex}-${startIndex + currentPos}`} style={{ color: '#267F99' }}>
          {decoratorMatch[0]}
        </span>
      );
      currentPos += decoratorMatch[0].length;
      remaining = remaining.substring(decoratorMatch[0].length);
      continue;
    }

    const wordMatch = remaining.match(/^[a-zA-Z_]\w*/);
    if (wordMatch) {
      const word = wordMatch[0];
      let color = '#000000';

      if (PYTHON_KEYWORDS.includes(word)) {
        color = '#0000FF';
      } else if (PYTHON_BUILTIN_FUNCTIONS.includes(word)) {
        color = '#795E26';
      } else if (PYTHON_TYPES.includes(word)) {
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

export const highlightPythonCode = (code: string, errors: CompilationError[] = []) => {
  const lines = code.split('\n');
  
  return lines.map((line, lineIndex) => {
    let segments: JSX.Element[] = [];

    const commentIndex = line.indexOf('#');
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
    
    return (
      <div 
        key={lineIndex} 
        style={{ 
          height: '24px', 
          minHeight: '24px',
          backgroundColor: hasError ? 'rgba(255, 0, 0, 0.1)' : 'transparent'
        }}
      >
        {segments.length > 0 ? segments : '\u00A0'}
      </div>
    );
  });
};
