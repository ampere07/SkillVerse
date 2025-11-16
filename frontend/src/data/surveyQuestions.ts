export const javaQuestions = [
  {
    id: 1,
    difficulty: 'easy',
    question: 'What is the correct syntax to output "Hello World" in Java?',
    options: [
      'System.out.println("Hello World");',
      'Console.WriteLine("Hello World");',
      'print("Hello World")',
      'echo("Hello World");'
    ],
    correctAnswer: 0
  },
  {
    id: 2,
    difficulty: 'easy',
    question: 'Which keyword is used to create a class in Java?',
    options: ['class', 'Class', 'define', 'create'],
    correctAnswer: 0
  },
  {
    id: 3,
    difficulty: 'easy',
    question: 'What is the size of int in Java?',
    options: ['8 bits', '16 bits', '32 bits', '64 bits'],
    correctAnswer: 2
  },
  {
    id: 4,
    difficulty: 'medium',
    question: 'Which of these is not a Java feature?',
    options: ['Object-Oriented', 'Platform Independent', 'Pointer Arithmetic', 'Multithreaded'],
    correctAnswer: 2
  },
  {
    id: 5,
    difficulty: 'medium',
    question: 'What is the output of: System.out.println(10 + 20 + "Hello");',
    options: ['1020Hello', '30Hello', 'Hello30', 'Error'],
    correctAnswer: 1
  },
  {
    id: 6,
    difficulty: 'medium',
    question: 'Which collection class allows you to access its elements by index?',
    options: ['HashSet', 'TreeSet', 'ArrayList', 'LinkedHashSet'],
    correctAnswer: 2
  },
  {
    id: 7,
    difficulty: 'hard',
    question: 'What is the purpose of the "volatile" keyword in Java?',
    options: [
      'To make a variable constant',
      'To ensure visibility of changes across threads',
      'To prevent inheritance',
      'To optimize memory usage'
    ],
    correctAnswer: 1
  },
  {
    id: 8,
    difficulty: 'hard',
    question: 'Which design pattern ensures a class has only one instance?',
    options: ['Factory', 'Singleton', 'Observer', 'Builder'],
    correctAnswer: 1
  },
  {
    id: 9,
    difficulty: 'hard',
    question: 'What is the time complexity of searching in a balanced Binary Search Tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1
  },
  {
    id: 10,
    difficulty: 'hard',
    question: 'Which is true about Java Streams?',
    options: [
      'They modify the original collection',
      'They are evaluated eagerly',
      'They can be reused multiple times',
      'They support lazy evaluation'
    ],
    correctAnswer: 3
  }
];

export const pythonQuestions = [
  {
    id: 1,
    difficulty: 'easy',
    question: 'What is the correct way to create a variable in Python?',
    options: ['int x = 5', 'var x = 5', 'x = 5', 'declare x = 5'],
    correctAnswer: 2
  },
  {
    id: 2,
    difficulty: 'easy',
    question: 'Which function is used to display output in Python?',
    options: ['echo()', 'print()', 'printf()', 'console.log()'],
    correctAnswer: 1
  },
  {
    id: 3,
    difficulty: 'easy',
    question: 'What is the output of: print(type([]))',
    options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
    correctAnswer: 0
  },
  {
    id: 4,
    difficulty: 'medium',
    question: 'What is the output of: print(3 * "abc")',
    options: ['abc', 'abcabcabc', '3abc', 'Error'],
    correctAnswer: 1
  },
  {
    id: 5,
    difficulty: 'medium',
    question: 'Which of the following is mutable in Python?',
    options: ['tuple', 'string', 'list', 'int'],
    correctAnswer: 2
  },
  {
    id: 6,
    difficulty: 'medium',
    question: 'What does the "with" statement do in Python?',
    options: [
      'Creates a loop',
      'Defines a function',
      'Provides context management',
      'Imports modules'
    ],
    correctAnswer: 2
  },
  {
    id: 7,
    difficulty: 'hard',
    question: 'What is a decorator in Python?',
    options: [
      'A design pattern',
      'A function that modifies another function',
      'A data structure',
      'A class method'
    ],
    correctAnswer: 1
  },
  {
    id: 8,
    difficulty: 'hard',
    question: 'What is the output of: print(bool([]))',
    options: ['True', 'False', 'None', 'Error'],
    correctAnswer: 1
  },
  {
    id: 9,
    difficulty: 'hard',
    question: 'What is a generator in Python?',
    options: [
      'A function that returns multiple values at once',
      'A function that yields values one at a time',
      'A class that generates objects',
      'A module for random numbers'
    ],
    correctAnswer: 1
  },
  {
    id: 10,
    difficulty: 'hard',
    question: 'What is the difference between "==" and "is" in Python?',
    options: [
      'They are the same',
      '"==" compares values, "is" compares identity',
      '"is" compares values, "==" compares identity',
      'Both compare memory addresses'
    ],
    correctAnswer: 1
  }
];
