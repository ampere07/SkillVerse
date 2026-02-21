import { useState, useRef, useLayoutEffect } from 'react';
import { ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  content: TopicContent;
}

interface TopicSection {
  title: string;
  text: string;
}

interface TopicContent {
  heading: string;
  intro: string;
  sections?: TopicSection[];
  points?: string[];
  codeExample?: string;
  codeLanguage?: string;
  tip?: string;
}

interface Category {
  label: string;
  topics: Topic[];
}

const categories: Category[] = [
  {
    label: 'Java Tutorial',
    topics: [
      { 
        id: 'java-home', 
        title: 'Java HOME', 
        content: { 
          heading: 'Java Tutorial', 
          intro: 'Java is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible.',
          sections: [
            {
              title: 'Why Learn Java?',
              text: 'Java is one of the most popular programming languages in the world. It is used for mobile development (Android), desktop applications, web applications, enterprise software, and much more. Its "Write Once, Run Anywhere" (WORA) capability makes it incredibly versatile.'
            },
            {
              title: 'Java Features',
              text: 'Java is known for being simple, secure, and robust. It manages memory automatically through garbage collection, and its strong type-checking helps prevent common programming errors. It is also concurrent, meaning you can write programs that perform many tasks simultaneously.'
            }
          ],
          points: [
            '**Platform Independent**: Compiled Java code (bytecode) runs on any device with a JVM.',
            '**Object-Oriented**: Everything in Java is an Object, which helps in organizing complex code.',
            '**Secure**: Java provides a secure environment by running code in a sandbox (JVM).'
          ], 
          codeExample: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, SkillVerse!");\n  }\n}', 
          codeLanguage: 'java' 
        } 
      },
      { 
        id: 'java-intro', 
        title: 'Java Intro', 
        content: { 
          heading: 'Introduction to Java', 
          intro: 'Java was originally developed by James Gosling at Sun Microsystems and released in 1995. Today, it is owned by Oracle.',
          sections: [
            {
              title: 'The Java Philosophy',
              text: 'The primary goals of Java were to be simple, object-oriented, and familiar. It removed complex features from languages like C++ to make it easier for developers to write bug-free code. It also focused on network-readiness and security from day one.'
            },
            {
              title: 'Where is Java Used?',
              text: 'Java is everywhere! It powers over 3 billion devices. From the back-end of massive websites like Amazon and Google to the Android OS in your pocket, and even scientific applications like NASA\'s Mars Rover software.'
            }
          ],
          points: [
            '**Reliable**: Used for mission-critical systems worldwide.',
            '**Scalable**: Great for both small utilities and massive enterprise systems.',
            '**Community**: Huge library of pre-written code (APIs) and community support.'
          ], 
          codeExample: '// Java is Case-Sensitive\npublic class HelloWorld {\n  public static void main(String[] args) {\n    System.out.println("Java is Awesome!");\n  }\n}', 
          codeLanguage: 'java' 
        } 
      },
      { 
        id: 'java-getstarted', 
        title: 'Java Get Started', 
        content: { 
          heading: 'Java Getting Started', 
          intro: 'To start using Java, you need the JDK (Java Development Kit) installed on your system.', 
          sections: [
            {
              title: 'The JDK',
              text: 'The JDK allows you to develop and run Java programs. It includes tools like "javac" (the compiler) and "java" (the launcher). You can download it from the official Oracle website or use OpenJDK versions.'
            },
            {
              title: 'Write, Compile, Run',
              text: 'The workflow is simple: 1. Write your code in a .java file. 2. Compile it using "javac MyFile.java". This creates a .class file. 3. Run it using "java MyFile".'
            }
          ],
          points: [
            '**Environment Setup**: Set the JAVA_HOME variable to point to your JDK folder.',
            '**Check Installation**: run `java -version` in your terminal.',
            '**IDEs**: For bigger projects, use IntelliJ IDEA, Eclipse, or VS Code.'
          ], 
          codeExample: 'java -version\njavac MyFile.java\njava MyFile', 
          codeLanguage: 'bash' 
        } 
      },
      { 
        id: 'java-syntax', 
        title: 'Java Syntax', 
        content: { 
          heading: 'Java Syntax', 
          intro: 'Java syntax refers to the set of rules that defines how a Java program is written and interpreted.', 
          sections: [
            {
              title: 'Class-Based Structure',
              text: 'In Java, every line of code that can be executed must be inside a class. By convention, the class name should always start with an uppercase first letter.'
            },
            {
              title: 'The Entry Point (Main Method)',
              text: 'The main method is the starting point of any Java application. It looks like this: public static void main(String[] args). When you run a Java program, the JVM looks for this specific method to begin execution.'
            }
          ],
          points: [
            '**Case-Sensitive**: "MyClass" and "myclass" are different.',
            '**Semicolons**: Every statement must end with a semicolon (`;`).',
            '**File Names**: The name of the Java file should match the class name.'
          ], 
          codeExample: 'public class MyClass {\n  public static void main(String[] args) {\n    System.out.println("Follow the syntax!");\n  }\n}', 
          codeLanguage: 'java' 
        } 
      },
      { 
        id: 'java-output', 
        title: 'Java Output', 
        content: { 
          heading: 'Java Output / Print', 
          intro: 'Printing content to the console is one of the first things you learn in any language.', 
          sections: [
            {
              title: 'println vs print',
              text: 'The println() method adds a new line after the text is printed, while print() keeps the cursor on the same line. This is useful for building output incrementally or creating formatted lists.'
            },
            {
              title: 'Standard Output Stream',
              text: 'System.out refers to the "standard output stream," which is usually the console or terminal where you run your code.'
            }
          ],
          points: [
            '**println()**: Prints text + a new line.',
            '**print()**: Prints text only.',
            '**Numbers**: You can print numbers directly without quotes: `System.out.println(5);`'
          ], 
          codeExample: 'System.out.println("Hello World");\nSystem.out.print("I will print on ");\nSystem.out.print("the same line.");', 
          codeLanguage: 'java' 
        } 
      },
      { 
        id: 'java-comments', 
        title: 'Java Comments', 
        content: { 
          heading: 'Java Comments', 
          intro: 'Comments are used to explain Java code and to make it more readable. They are ignored by the compiler.', 
          sections: [
            {
              title: 'Communication is Key',
              text: 'Comments are not for the computer; they are for you and other developers. Good comments explain *why* something is done, rather than *what* is being done (the code should already be clear enough for that).'
            }
          ],
          points: [
            '**Single-line**: Starts with `//`. Everything on that line is ignored.',
            '**Multi-line**: Starts with `/*` and ends with `*/`. Useful for large blocks of text.',
            '**Documentation**: Professional Java code often uses `/** ... */` for JavaDoc.'
          ], 
          codeExample: '// This is a single-line comment\n/* This is a multi-line\n   comment for longer explanations */\nSystem.out.println("Hello Comments");', 
          codeLanguage: 'java' 
        } 
      },
      { 
        id: 'java-variables', 
        title: 'Java Variables', 
        content: { 
          heading: 'Java Variables', 
          intro: 'Variables are containers for storing data values. Java is a "strongly typed" language.', 
          sections: [
            {
              title: 'Declaration and Assignment',
              text: 'To create a variable, you must specify the type and assign it a value. Example: type name = value. This tells Java exactly how much memory to reserve and what kind of operations are allowed on that data.'
            },
            {
              title: 'Naming Rules',
              text: 'Variables must have unique names (identifiers). In Java, we use camelCase (e.g., studentAge, totalScore). Names can contain letters, digits, underscores, and dollar signs, but they cannot start with a digit.'
            }
          ],
          points: [
            '**int**: for whole numbers (like 123).',
            '**String**: for text (like "Hello").',
            '**float**: for decimals (like 19.99).',
            '**boolean**: for true/false values.'
          ], 
          codeExample: 'String name = "Raven";\nint age = 21;\nboolean isStudent = true;\nSystem.out.println("Name: " + name);', 
          codeLanguage: 'java' 
        } 
      },
      { 
        id: 'java-datatypes', 
        title: 'Java Data Types', 
        content: { 
          heading: 'Java Data Types', 
          intro: 'Data types are divided into two groups: Primitive and Non-primitive.', 
          sections: [
            {
              title: 'Primitive Types',
              text: 'Primitive types are predefined by the language. There are 8: byte, short, int, long, float, double, boolean, and char. These are the building blocks of data in Java.'
            },
            {
              title: 'Memory and Precision',
              text: 'The difference between types like float and double is their precision and memory size. A double is twice as precise as a float and is generally preferred for calculations.'
            }
          ],
          points: [
            '**int**: 4 bytes, stores whole numbers from -2B to 2B.',
            '**double**: 8 bytes, stores fractional numbers with high precision.',
            '**char**: 2 bytes, stores a single character/ASCII value.'
          ], 
          codeExample: 'int myNum = 1000;\nfloat myFloat = 5.75f;\ndouble myDouble = 19.99d;\nchar myLetter = \'D\';', 
          codeLanguage: 'java' 
        } 
      },
      { id: 'java-casting', title: 'Java Type Casting', content: { heading: 'Java Type Casting', intro: 'Assigning a value of one primitive data type to another type.', points: ['Widening (automatic): small to large', 'Narrowing (manual): large to small'], codeExample: 'int myInt = 9;\ndouble myDouble = myInt; // Automatic\n\nint manualInt = (int) myDouble; // Manual', codeLanguage: 'java' } },
      { id: 'java-operators', title: 'Java Operators', content: { heading: 'Java Operators', intro: 'Operators perform operations on variables.', points: ['Arithmetic: +, -, *, /', 'Assignment: =, +=', 'Comparison: ==, !=', 'Logical: &&, ||'], codeExample: 'int sum = 100 + 50;\nboolean isEqual = (5 == 5);', codeLanguage: 'java' } },
      { id: 'java-strings', title: 'Java Strings', content: { heading: 'Java Strings', intro: 'Strings store text sequences.', points: ['length(), toUpperCase(), toLowerCase()', 'indexOf(), concat()'], codeExample: 'String txt = "Hello";\nSystem.out.println(txt.length());', codeLanguage: 'java' } },
      { id: 'java-math', title: 'Java Math', content: { heading: 'Java Math', intro: 'The Math class has many methods for mathematical tasks.', points: ['Math.max(x,y)', 'Math.min(x,y)', 'Math.sqrt(x)', 'Math.random()'], codeExample: 'Math.max(5, 10);\nMath.sqrt(64);\nMath.random();', codeLanguage: 'java' } },
      { id: 'java-booleans', title: 'Java Booleans', content: { heading: 'Java Booleans', intro: 'Booleans represent one of two values: true or false.', points: ['Used for conditional testing', 'Result of comparisons'], codeExample: 'boolean isJavaFun = true;\nSystem.out.println(10 > 9); // true', codeLanguage: 'java' } },
      { id: 'java-ifelse', title: 'Java If...Else', content: { heading: 'Java If...Else', intro: 'Use if...else to specify a block of code to be executed if a condition is true.', points: ['if, else, else if', 'Short hand: ternary operator'], codeExample: 'if (20 > 18) {\n  System.out.println("20 is greater");\n}', codeLanguage: 'java' } },
      { id: 'java-switch', title: 'Java Switch', content: { heading: 'Java Switch', intro: 'Use switch to select one of many code blocks to be executed.', points: ['break keyword breaks out', 'default keyword for no match'], codeExample: 'int day = 4;\nswitch (day) {\n  case 1: System.out.println("Mon"); break;\n  default: System.out.println("Weekend");\n}', codeLanguage: 'java' } },
      { id: 'java-while', title: 'Java While Loop', content: { heading: 'Java While Loop', intro: 'Loops through a block of code as long as a condition is true.', points: ['while loop', 'do/while loop (executes at least once)'], codeExample: 'int i = 0;\nwhile (i < 5) {\n  System.out.println(i);\n  i++;\n}', codeLanguage: 'java' } },
      { id: 'java-for', title: 'Java For Loop', content: { heading: 'Java For Loop', intro: 'Use for loop when you know exactly how many times you want to loop.', points: ['Statement 1, 2, 3', 'For-each loop for arrays'], codeExample: 'for (int i = 0; i < 5; i++) {\n  System.out.println(i);\n}', codeLanguage: 'java' } },
      { id: 'java-break', title: 'Java Break/Continue', content: { heading: 'Java Break and Continue', intro: 'Break jumps out of a loop. Continue jumps over one iteration.', points: ['break: exit loop', 'continue: skip current loop'], codeExample: 'for (int i = 0; i < 10; i++) {\n  if (i == 4) break;\n  System.out.println(i);\n}', codeLanguage: 'java' } },
      { id: 'java-arrays', title: 'Java Arrays', content: { heading: 'Java Arrays', intro: 'Arrays store multiple values in a single variable.', points: ['Fixed size', 'Access by index [0]', 'length attribute'], codeExample: 'String[] cars = {"Volvo", "BMW", "Ford"};\nSystem.out.println(cars[0]);', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java Methods',
    topics: [
      { id: 'java-methods-main', title: 'Java Methods', content: { heading: 'Java Methods', intro: 'A method is a block of code which only runs when it is called.', points: ['Reusable code', 'Declared inside a class'], codeExample: 'static void myMethod() {\n  System.out.println("I got executed!");\n}', codeLanguage: 'java' } },
      { id: 'java-method-challenge', title: 'Method Challenge', content: { heading: 'Method Challenge', intro: 'Test your understanding of method structure and return types.', points: ['Write a method that returns the sum of two numbers.'], codeExample: 'public static int add(int a, int b) {\n  return a + b;\n}', codeLanguage: 'java' } },
      { id: 'java-method-params', title: 'Method Parameters', content: { heading: 'Method Parameters', intro: 'Parameters act as variables inside the method.', points: ['Multiple parameters separated by commas', 'Return values with return keyword'], codeExample: 'static void myMethod(String fname) {\n  System.out.println(fname + " Doe");\n}', codeLanguage: 'java' } },
      { id: 'java-method-overloading', title: 'Method Overloading', content: { heading: 'Method Overloading', intro: 'Multiple methods can have the same name with different parameters.', points: ['Different number of params', 'Different type of params'], codeExample: 'static int plusMethod(int x, int y) { return x + y; }\nstatic double plusMethod(double x, double y) { return x + y; }', codeLanguage: 'java' } },
      { id: 'java-scope', title: 'Java Scope', content: { heading: 'Java Scope', intro: 'Variables are only accessible inside the region they are created.', points: ['Method Scope', 'Block Scope'], codeExample: 'public void myMethod() {\n  int x = 100; // Only visible here\n}', codeLanguage: 'java' } },
      { id: 'java-recursion', title: 'Java Recursion', content: { heading: 'Java Recursion', intro: 'Making a function call itself.', points: ['Base case is required', 'Prevent stack overflow'], codeExample: 'public static int sum(int k) {\n  if (k > 0) return k + sum(k - 1);\n  return 0;\n}', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java Classes',
    topics: [
      { 
        id: 'java-oop', 
        title: 'Java OOP', 
        content: { 
          heading: 'Java Object-Oriented Programming', 
          intro: 'OOP stands for Object-Oriented Programming. It is a programming paradigm that revolves around "objects" rather than "functions".', 
          sections: [
            {
              title: 'The Four Pillars',
              text: 'OOP is built on four main concepts: 1. Inheritance (reusing code), 2. Polymorphism (taking many forms), 3. Abstraction (hiding complexity), and 4. Encapsulation (protecting data).'
            },
            {
              title: 'Why use OOP?',
              text: 'OOP is faster and easier to execute. It provides a clear structure for programs and makes the code easier to maintain, modify, and debug. Most importantly, it allows for code reuse (DRY - Don\'t Repeat Yourself).'
            }
          ],
          points: [
            '**Class**: A blueprint for creating objects.',
            '**Object**: An instance of a class.'
          ], 
          codeExample: '// OOP allows for modular code\npublic class Car {\n  // Blueprint for every car entity\n}', 
          codeLanguage: 'java' 
        } 
      },
      { 
        id: 'java-classes-objects', 
        title: 'Classes/Objects', 
        content: { 
          heading: 'Java Classes and Objects', 
          intro: 'Java is an object-oriented programming language. Everything in Java is associated with classes and objects.', 
          sections: [
            {
              title: 'The Blueprint Analogy',
              text: 'Think of a class as a blueprint for a house. The blueprint itself isn\'t a house, but it describes how to build one. When you actually build a house according to the blueprint, that house is an "object". you can build many houses (objects) from one blueprint (class).'
            }
          ],
          points: [
            '**Class**: The template (code).',
            '**Object**: The real-world thing (data).'
          ], 
          codeExample: 'public class Main {\n  int x = 5;\n\n  public static void main(String[] args) {\n    Main myObj = new Main();\n    System.out.println(myObj.x);\n  }\n}', 
          codeLanguage: 'java' 
        } 
      },
      { id: 'java-attributes', title: 'Class Attributes', content: { heading: 'Class Attributes', intro: 'Variables within a class are called attributes.', points: ['obj.attributeName', 'final keyword for fixed values'], codeExample: 'public class Main {\n  int x = 5;\n}', codeLanguage: 'java' } },
      { id: 'java-class-methods', title: 'Class Methods', content: { heading: 'Class Methods', intro: 'Methods define the behavior of the objects.', points: ['static methods (class)', 'public methods (object)'], codeExample: 'public void fullThrottle() {\n  System.out.println("The car is going fast!");\n}', codeLanguage: 'java' } },
      { id: 'java-constructors', title: 'Java Constructors', content: { heading: 'Java Constructors', intro: 'Special method invoked when an object is created.', points: ['Matches class name', 'No return type'], codeExample: 'public Main() { x = 5; }', codeLanguage: 'java' } },
      { id: 'java-this', title: 'Java this Keyword', content: { heading: 'Java this Keyword', intro: 'Refers to the current object in a method or constructor.', points: ['Resolve ambiguity between field and param', 'Invoke current class constructor'], codeExample: 'public Main(int x) {\n  this.x = x;\n}', codeLanguage: 'java' } },
      { id: 'java-modifiers', title: 'Java Modifiers', content: { heading: 'Java Modifiers', intro: 'Set accessibility and properties of classes/methods.', points: ['Access: public, private, protected', 'Non-access: final, static, abstract'], codeExample: 'private String name;', codeLanguage: 'java' } },
      { id: 'java-encapsulation', title: 'Java Encapsulation', content: { heading: 'Java Encapsulation', intro: 'Hide sensitive data from users.', points: ['private variables', 'public get/set methods'], codeExample: 'private String name;\npublic String getName() { return name; }', codeLanguage: 'java' } },
      { id: 'java-packages', title: 'Packages / API', content: { heading: 'Java Packages', intro: 'Organize related classes.', points: ['Built-in (Java API)', 'User-defined'], codeExample: 'import java.util.Scanner;', codeLanguage: 'java' } },
      { id: 'java-inheritance', title: 'Java Inheritance', content: { heading: 'Java Inheritance / extends', intro: 'Inherit attributes and methods from another class.', points: ['subclass (child)', 'superclass (parent)'], codeExample: 'class Car extends Vehicle { }', codeLanguage: 'java' } },
      { id: 'java-polymorphism', title: 'Java Polymorphism', content: { heading: 'Java Polymorphism', intro: 'Methods perform different tasks based on the object.', points: ['Method overriding'], codeExample: 'animalObj.makeSound(); // Woof or Meow', codeLanguage: 'java' } },
      { id: 'java-super', title: 'Java super Keyword', content: { heading: 'Java super Keyword', intro: 'Refers to the superclass (parent) object.', points: ['Call parent constructor', 'Call parent method'], codeExample: 'super.parentMethod();', codeLanguage: 'java' } },
      { id: 'java-inner', title: 'Inner Classes', content: { heading: 'Java Inner Classes', intro: 'A class within a class.', points: ['Scope is restricted', 'Static vs Non-static inner'], codeExample: 'class Outer {\n  class Inner { }\n}', codeLanguage: 'java' } },
      { id: 'java-abstraction', title: 'Java Abstraction', content: { heading: 'Java Abstraction', intro: 'Hide certain details and only show important information.', points: ['abstract class', 'abstract methods'], codeExample: 'abstract class Animal { }', codeLanguage: 'java' } },
      { id: 'java-interface', title: 'Java Interface', content: { heading: 'Java Interface', intro: 'A fully abstract class.', points: ['implements keyword', 'method bodies are empty'], codeExample: 'interface Animal {\n  public void sound();\n}', codeLanguage: 'java' } },
      { id: 'java-enum', title: 'Java Enum', content: { heading: 'Java Enums', intro: 'Special "class" that represents a group of constants.', points: ['final, unchangeable'], codeExample: 'enum Level { LOW, MEDIUM, HIGH }', codeLanguage: 'java' } },
      { id: 'java-user-input', title: 'Java User Input', content: { heading: 'User Input (Scanner)', intro: 'The Scanner class is used to get user input.', points: ['nextLine(), nextInt()'], codeExample: 'Scanner myObj = new Scanner(System.in);', codeLanguage: 'java' } },
      { id: 'java-date', title: 'Java Date', content: { heading: 'Java Date and Time', intro: 'Work with dates and times.', points: ['LocalDate, LocalTime, LocalDateTime'], codeExample: 'LocalDate myObj = LocalDate.now();', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java Errors',
    topics: [
      { id: 'java-exceptions-list', title: 'Java Exceptions', content: { heading: 'Java Exceptions', intro: 'Errors that occur during execution.', points: ['Try...Catch', 'Throw Exception'], codeExample: 'try { } catch (Exception e) { }', codeLanguage: 'java' } },
      { id: 'java-multiple-exceptions', title: 'Multiple Exceptions', content: { heading: 'Multiple Exceptions', intro: 'Catching different types of errors.', points: ['Specific catch blocks', 'Hierarchy of exceptions'], codeExample: 'catch (IOException e) { }\ncatch (Exception e) { }', codeLanguage: 'java' } },
      { id: 'java-try-resources', title: 'try-with-resources', content: { heading: 'try-with-resources', intro: 'Automatic resource management.', points: ['Closable interface', 'Eliminate finally block for closing'], codeExample: 'try (BufferedInputStream bin = ...) { }', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java File Handling',
    topics: [
      { id: 'java-files-base', title: 'Java Files', content: { heading: 'Java File Class', intro: 'The File class is used to work with files.', points: ['canRead(), exists(), getName()'], codeExample: 'File myObj = new File("filename.txt");', codeLanguage: 'java' } },
      { id: 'java-create-files', title: 'Create Files', content: { heading: 'Create/Write Files', intro: 'Handling file creation and basic writing.', points: ['createNewFile()', 'FileWriter class'], codeExample: 'myObj.createNewFile();', codeLanguage: 'java' } },
      { id: 'java-read-files', title: 'Read Files', content: { heading: 'Read Files', intro: 'Reading content from files.', points: ['Scanner class', 'Files.readAllLines()'], codeExample: 'Scanner myReader = new Scanner(myObj);', codeLanguage: 'java' } },
      { id: 'java-delete-files', title: 'Delete Files', content: { heading: 'Delete Files', intro: 'Removing files from the system.', points: ['delete() method'], codeExample: 'myObj.delete();', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java I/O Streams',
    topics: [
      { id: 'java-streams-intro', title: 'I/O Streams', content: { heading: 'Java I/O Streams', intro: 'Used to process input and output data.', points: ['Byte Streams', 'Character Streams'], codeExample: 'InputStream is = ...;', codeLanguage: 'java' } },
      { id: 'java-file-input', title: 'FileInputStream', content: { heading: 'FileInputStream', intro: 'Reading bytes from a file.', points: ['Useful for binary data'], codeExample: 'FileInputStream in = new FileInputStream("in.txt");', codeLanguage: 'java' } },
      { id: 'java-file-output', title: 'FileOutputStream', content: { heading: 'FileOutputStream', intro: 'Writing bytes to a file.', points: ['Creates file if it doesn\'t exist'], codeExample: 'FileOutputStream out = new FileOutputStream("out.txt");', codeLanguage: 'java' } },
      { id: 'java-buffered-reader', title: 'BufferedReader', content: { heading: 'BufferedReader', intro: 'Read text from a character-input stream.', points: ['Efficient reading with buffering'], codeExample: 'BufferedReader reader = new BufferedReader(new FileReader("file.txt"));', codeLanguage: 'java' } },
      { id: 'java-buffered-writer', title: 'BufferedWriter', content: { heading: 'BufferedWriter', intro: 'Write text to a character-output stream.', points: ['Buffered for performance'], codeExample: 'BufferedWriter writer = new BufferedWriter(new FileWriter("file.txt"));', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java Data Structures',
    topics: [
      { id: 'java-collections', title: 'Collections', content: { heading: 'Java Collections Framework', intro: 'A unified architecture for representing and manipulating collections.', points: ['List, Set, Map, Queue'], codeExample: 'Collections.sort(myList);', codeLanguage: 'java' } },
      { id: 'java-list', title: 'List', content: { heading: 'Java List Interface', intro: 'An ordered collection (sequence).', points: ['Allows duplicates', 'Positive index access'], codeExample: 'List<String> list = new ArrayList<>();', codeLanguage: 'java' } },
      { id: 'java-arraylist-ds', title: 'ArrayList', content: { heading: 'Java ArrayList', intro: 'Resizable-array implementation of the List interface.', points: ['Fast random access', 'Slow insertions in middle'], codeExample: 'ArrayList<Integer> arr = new ArrayList<>();', codeLanguage: 'java' } },
      { id: 'java-linkedlist', title: 'LinkedList', content: { heading: 'Java LinkedList', intro: 'Doubly-linked list implementation.', points: ['Fast insertions/deletions', 'Good for Queues/Stacks'], codeExample: 'LinkedList<String> list = new LinkedList<>();', codeLanguage: 'java' } },
      { id: 'java-hashset', title: 'HashSet', content: { heading: 'Java HashSet', intro: 'A collection that contains no duplicate elements.', points: ['Uses Hashing', 'Unordered'], codeExample: 'HashSet<String> set = new HashSet<>();', codeLanguage: 'java' } },
      { id: 'java-treeset', title: 'TreeSet', content: { heading: 'Java TreeSet', intro: 'Sorted Set implementation.', points: ['Natural ordering', 'Ascending order storage'], codeExample: 'TreeSet<Integer> set = new TreeSet<>();', codeLanguage: 'java' } },
      { id: 'java-hashmap-ds', title: 'HashMap', content: { heading: 'Java HashMap', intro: 'Map implementation based on Hash Table.', points: ['Key-Value pairs', 'One null key allowed'], codeExample: 'HashMap<String, Integer> map = new HashMap<>();', codeLanguage: 'java' } },
      { id: 'java-treemap', title: 'TreeMap', content: { heading: 'Java TreeMap', intro: 'Sorted Map implementation.', points: ['Ordered by keys'], codeExample: 'TreeMap<String, String> map = new TreeMap<>();', codeLanguage: 'java' } },
      { id: 'java-iterator', title: 'Iterator', content: { heading: 'Java Iterator', intro: 'Object used to loop through collections.', points: ['hasNext(), next(), remove()'], codeExample: 'Iterator<String> it = cars.iterator();', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java Advanced',
    topics: [
      { id: 'java-wrapper', title: 'Wrapper Classes', content: { heading: 'Wrapper Classes', intro: 'Provide a way to use primitive data types as objects.', points: ['Integer, Double, Character', 'Autoboxing and Unboxing'], codeExample: 'Integer myInt = 5;', codeLanguage: 'java' } },
      { id: 'java-generics', title: 'Generics', content: { heading: 'Java Generics', intro: 'Parameterizing types (classes, interfaces, methods).', points: ['Type safety', 'Eliminate casting'], codeExample: 'public class Box<T> { }', codeLanguage: 'java' } },
      { id: 'java-regex', title: 'RegEx', content: { heading: 'Java RegEx', intro: 'Regular Expressions for pattern matching.', points: ['Pattern, Matcher classes'], codeExample: 'Pattern p = Pattern.compile("skill", Pattern.CASE_INSENSITIVE);', codeLanguage: 'java' } },
      { id: 'java-threads', title: 'Threads', content: { heading: 'Java Threads', intro: 'Multitasking within a single program.', points: ['Thread class', 'Runnable interface'], codeExample: 'class MyThread extends Thread { }', codeLanguage: 'java' } },
      { id: 'java-lambda', title: 'Lambda', content: { heading: 'Java Lambda expressions', intro: 'Short block of code which takes in parameters and returns a value.', points: ['Functional Interfaces', 'Concise logic'], codeExample: '(n) -> { System.out.println(n); }', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Java Extras',
    topics: [
      { id: 'java-projects', title: 'Projects', content: { heading: 'Java Projects', intro: 'Apply your knowledge by building real-world applications.', points: ['Calculator, To-Do List, Chat App', 'Library Management System'], codeExample: '// Combine classes, methods, and UI to build apps.', codeLanguage: 'java' } },
      { id: 'java-quiz', title: 'Quiz & Exercises', content: { heading: 'Quiz and Exercises', intro: 'Practice what you have learned.', points: ['Java Quiz', 'Java Exercises'], codeExample: '// Test your skills frequently!', codeLanguage: 'java' } },
    ]
  },
  {
    label: 'Python Tutorial',
    topics: [
      { 
        id: 'py-home', 
        title: 'Python HOME', 
        content: { 
          heading: 'Python Tutorial', 
          intro: 'Python is a high-level, interpreted, general-purpose programming language. Its design philosophy emphasizes code readability.', 
          sections: [
            {
              title: 'Beginner Friendly',
              text: 'Python is often the first language people learn because its syntax looks a lot like plain English. This allows you to focus on learning programming logic rather than getting stuck on complex syntax rules.'
            },
            {
              title: 'Versatile Applications',
              text: 'Python is used in almost every field: Web Development (Django/Flask), Data Science (NumPy/Pandas), Artificial Intelligence (TensorFlow/PyTorch), and Automation scripting.'
            }
          ],
          points: [
            '**Easy to Read**: Clean syntax with minimal boiler-plate code.',
            '**Large Ecosystem**: Thousands of libraries available for any task.',
            '**Interpreted**: You run the code directly without a separate compile step.'
          ], 
          codeExample: 'print("Welcome to the Python track!")', 
          codeLanguage: 'python' 
        } 
      },
      { 
        id: 'py-intro', 
        title: 'Python Intro', 
        content: { 
          heading: 'Python Intro', 
          intro: 'Python was created by Guido van Rossum and first released in 1991.', 
          sections: [
            {
              title: 'The Zen of Python',
              text: 'Python follows a set of principles called "The Zen of Python" (PEP 20). Some of these include: "Beautiful is better than ugly," "Explicit is better than implicit," and "Simple is better than complex."'
            },
            {
              title: 'Python 2 vs Python 3',
              text: 'Python 3 is the current standard. Python 2 was retired in 2020. This resource focuses exclusively on Python 3 features.'
            }
          ],
          points: [
            '**Indentation**: Python uses whitespace to define blocks of code (very important!).',
            '**Dynamic Typing**: You don\'t need to say if a variable is a number or text.',
            '**Cross-Platform**: Runs on Windows, Mac, and Linux.'
          ], 
          codeExample: '# This is a Python comment\nprint("Hello World!")', 
          codeLanguage: 'python' 
        } 
      },
      { 
        id: 'py-getstarted', 
        title: 'Python Get Started', 
        content: { 
          heading: 'Get Started', 
          intro: 'Python can be used on a server to create web applications.', 
          sections: [
            {
              title: 'Checking if Python is installed',
              text: 'To check if you have python installed on a Windows PC, search in the start bar for Python or run the following on the Command Line: `python --version`.'
            },
            {
              title: 'Running a Script',
              text: 'Python code is usually written in text files with the ".py" extension. To run the script, use: `python helloworld.py`.'
            }
          ],
          points: [
            '**Download**: Get the latest version from python.org.',
            '**Interactive Mode**: Type `python` to enter the REPL where you can run lines immediately.'
          ], 
          codeExample: 'python --version\nprint("Hello, Python!")', 
          codeLanguage: 'bash' 
        } 
      },
      { 
        id: 'py-syntax', 
        title: 'Python Syntax', 
        content: { 
          heading: 'Python Syntax', 
          intro: 'Python syntax can be executed by writing directly in the Command Line, or by creating a python file on the server.', 
          sections: [
            {
              title: 'Python Indentation',
              text: 'Indentation refers to the spaces at the beginning of a code line. Where in other languages the indentation in code is for readability only, the indentation in Python is very important. Python uses indentation to indicate a block of code.'
            },
            {
              title: 'Variables and Semicolons',
              text: 'Python has no command for declaring a variable. You also don\'t need semicolons to end statements — a new line is enough!'
            }
          ],
          points: [
            '**Indentation**: At least one space (usually four) is required.',
            '**Case Sensitive**: `myVar` and `myvar` are different.'
          ], 
          codeExample: 'if 5 > 2:\n    print("Five is greater than two!")\n# Error if no indentation!', 
          codeLanguage: 'python' 
        } 
      },
      { 
        id: 'py-output', 
        title: 'Python Output', 
        content: { 
          heading: 'Python Output', 
          intro: 'The Python `print()` function is often used to output variables.', 
          sections: [
            {
              title: 'Printing Multiple Variables',
              text: 'In the print() function, you can output multiple variables, separated by a comma. You can also use the "+" operator to concatenate strings.'
            }
          ],
          points: [
            '**print()**: The primary output function.',
            '**f-strings**: The modern way to format text: `print(f"Hello {name}")`'
          ], 
          codeExample: 'name = "John"\nprint("Hello", name)\nx = 5\ny = 10\nprint(x + y)', 
          codeLanguage: 'python' 
        } 
      },
      { 
        id: 'py-comments', 
        title: 'Python Comments', 
        content: { 
          heading: 'Python Comments', 
          intro: 'Comments can be used to explain Python code.', 
          sections: [
            {
              title: 'Single-line vs Multi-line',
              text: 'Python does not really have a syntax for multi-line comments. To add a multiline comment you could insert a # for each line. Alternatively, you can use a multiline string (triple quotes) if it\'s not assigned to a variable.'
            }
          ],
          points: [
            '**Single line**: Starts with `#`.',
            '**Triple quotes**: `""" ... """` Often used as docstrings.'
          ], 
          codeExample: '# This is a comment\nprint("Hello")\n"""\nThis is a multiline string\nused as a comment\n"""', 
          codeLanguage: 'python' 
        } 
      },
      { 
        id: 'py-variables', 
        title: 'Python Variables', 
        content: { 
          heading: 'Python Variables', 
          intro: 'Variables are containers for storing data values.', 
          sections: [
            {
              title: 'Creating Variables',
              text: 'Python has no command for declaring a variable. A variable is created the moment you first assign a value to it. Variables do not need to be declared with any particular type, and can even change type after they have been set.'
            },
            {
              title: 'Casting',
              text: 'If you want to specify the data type of a variable, this can be done with casting: `x = str(3)`, `y = int(3)`.'
            }
          ],
          points: [
            '**Dynamic**: Type is determined automatically.',
            '**Case-Sensitive**: `a = 4` and `A = "Sally"` are different variables.'
          ], 
          codeExample: 'x = 5\ny = "John"\nprint(type(x))\nprint(type(y))', 
          codeLanguage: 'python' 
        } 
      },
      { id: 'py-datatypes', title: 'Python Data Types', content: { heading: 'Python Data Types', intro: 'Python has many built-in data types.', points: ['Text: str', 'Numeric: int, float, complex', 'Sequence: list, tuple, range', 'Mapping: dict', 'Boolean: bool'], codeExample: 'x = "Hello"\nprint(type(x))', codeLanguage: 'python' } },
      { id: 'py-numbers', title: 'Python Numbers', content: { heading: 'Python Numbers', intro: 'Python has three numeric types: int, float, and complex.', points: ['int: whole numbers', 'float: decimal numbers', 'complex: j notation'], codeExample: 'x = 1\ny = 2.8\nz = 1j', codeLanguage: 'python' } },
      { id: 'py-casting', title: 'Python Casting', content: { heading: 'Python Casting', intro: 'Specify the type of a variable by using constructor functions.', points: ['int()', 'float()', 'str()'], codeExample: 'x = int(2.8)  # 2\ny = float(1)  # 1.0\nz = str(3)    # "3"', codeLanguage: 'python' } },
      { id: 'py-strings', title: 'Python Strings', content: { heading: 'Python Strings', intro: 'Strings in Python are surrounded by single or double quotation marks.', points: ['len() for length', 'Slice with [start:end]', 'f-strings for formatting'], codeExample: 'a = "Hello, World!"\nprint(a[2:5])\nprint(a.upper())', codeLanguage: 'python' } },
      { id: 'py-booleans', title: 'Python Booleans', content: { heading: 'Python Booleans', intro: 'Booleans represent True or False values.', points: ['bool() function', 'Most values are True'], codeExample: 'print(10 > 9)\nprint(bool(""))\nprint(bool(0))', codeLanguage: 'python' } },
      { id: 'py-operators', title: 'Python Operators', content: { heading: 'Python Operators', intro: 'Operators perform operations on variables.', points: ['Arithmetic: +, -, *, /', 'Comparison: ==, !=, >, <', 'Logical: and, or, not'], codeExample: 'print(10 + 5)\nprint(10 > 5 and 5 < 20)', codeLanguage: 'python' } },
      { id: 'py-lists', title: 'Python Lists', content: { heading: 'Python Lists', intro: 'Lists are ordered, changeable collections.', points: ['Access by index', 'append(), remove(), pop()', 'sort()'], codeExample: 'fruits = ["apple", "banana", "cherry"]\nfruits.append("orange")\nprint(fruits)', codeLanguage: 'python' } },
      { id: 'py-tuples', title: 'Python Tuples', content: { heading: 'Python Tuples', intro: 'Tuples are ordered and unchangeable collections.', points: ['Immutable after creation', 'Written with ()', 'Faster than lists'], codeExample: 'mytuple = ("apple", "banana", "cherry")\nprint(mytuple[1])', codeLanguage: 'python' } },
      { id: 'py-sets', title: 'Python Sets', content: { heading: 'Python Sets', intro: 'Sets are unordered and contain no duplicates.', points: ['No indexing', 'add(), remove()', 'Set operations: union, intersection'], codeExample: 'myset = {"apple", "banana", "cherry"}\nmyset.add("orange")\nprint(myset)', codeLanguage: 'python' } },
      { id: 'py-dicts', title: 'Python Dictionaries', content: { heading: 'Python Dictionaries', intro: 'Dictionaries store key:value pairs.', points: ['dict["key"] access', '.get()', '.items()', '.keys()'], codeExample: 'car = {"brand": "Ford", "year": 1964}\nprint(car["brand"])', codeLanguage: 'python' } },
      { id: 'py-ifelse', title: 'Python If...Else', content: { heading: 'Python If...Else', intro: 'Conditional branching using if, elif, else.', points: ['elif for multiple conditions', 'Ternary: x if cond else y'], codeExample: 'a = 200\nif a > 100:\n  print("Big")\nelse:\n  print("Small")', codeLanguage: 'python' } },
      { id: 'py-match', title: 'Python Match', content: { heading: 'Python Match Statement', intro: 'Introduced in Python 3.10, match is like switch.', points: ['case keyword', 'Wildcard: case _'], codeExample: 'command = "quit"\nmatch command:\n  case "quit":\n    print("Quitting")\n  case _:\n    print("Unknown")', codeLanguage: 'python' } },
      { id: 'py-while', title: 'Python While Loops', content: { heading: 'Python While Loops', intro: 'Execute a block of code as long as a condition is true.', points: ['break to exit', 'continue to skip'], codeExample: 'i = 1\nwhile i < 6:\n  print(i)\n  i += 1', codeLanguage: 'python' } },
      { id: 'py-for', title: 'Python For Loops', content: { heading: 'Python For Loops', intro: 'Iterate over sequences.', points: ['range() for numbers', 'enumerate() for index+value'], codeExample: 'fruits = ["apple", "banana"]\nfor x in fruits:\n  print(x)', codeLanguage: 'python' } },
      { id: 'py-functions', title: 'Python Functions', content: { heading: 'Python Functions', intro: 'A block of code which only runs when it is called.', points: ['def keyword', '*args, **kwargs', 'Lambda functions'], codeExample: 'def my_func(name):\n  print("Hello " + name)\nmy_func("Emil")', codeLanguage: 'python' } },
      { id: 'py-range', title: 'Python Range', content: { heading: 'Python range()', intro: 'Returns a sequence of numbers.', points: ['range(stop)', 'range(start, stop, step)'], codeExample: 'for x in range(6):\n  print(x)', codeLanguage: 'python' } },
      { id: 'py-arrays', title: 'Python Arrays', content: { heading: 'Python Arrays', intro: 'Python lists can be used as arrays.', points: ['Use list for general purpose', 'Use array module for typed'], codeExample: 'cars = ["Ford", "Volvo", "BMW"]', codeLanguage: 'python' } },
      { id: 'py-iterators', title: 'Python Iterators', content: { heading: 'Python Iterators', intro: 'An iterator is an object that contains a countable number of values.', points: ['__iter__() and __next__()', 'StopIteration'], codeExample: 'mytuple = ("apple", "banana")\nmyit = iter(mytuple)\nprint(next(myit))', codeLanguage: 'python' } },
      { id: 'py-modules', title: 'Python Modules', content: { heading: 'Python Modules', intro: 'A module is a file containing Python definitions and statements.', points: ['import module', 'from module import func'], codeExample: 'import math\nprint(math.pi)', codeLanguage: 'python' } },
      { id: 'py-dates', title: 'Python Dates', content: { heading: 'Python Dates', intro: 'Work with dates using the datetime module.', points: ['datetime.now()', 'strftime() formatting'], codeExample: 'import datetime\nx = datetime.datetime.now()\nprint(x)', codeLanguage: 'python' } },
      { id: 'py-math', title: 'Python Math', content: { heading: 'Python Math', intro: 'Python has a built-in math module.', points: ['math.sqrt()', 'math.floor(), math.ceil()', 'math.pi'], codeExample: 'import math\nprint(math.sqrt(64))\nprint(math.pi)', codeLanguage: 'python' } },
      { id: 'py-json', title: 'Python JSON', content: { heading: 'Python JSON', intro: 'JSON is a format for storing and transporting data.', points: ['json.loads() to parse', 'json.dumps() to stringify'], codeExample: 'import json\nx = \'{"name": "John"}\'\ny = json.loads(x)\nprint(y["name"])', codeLanguage: 'python' } },
      { id: 'py-regex', title: 'Python RegEx', content: { heading: 'Python RegEx', intro: 'Regular expressions are a pattern matching tool.', points: ['import re', 're.search(), re.findall()'], codeExample: 'import re\ntxt = "The rain in Spain"\nx = re.search("^The.*Spain$", txt)\nprint(bool(x))', codeLanguage: 'python' } },
      { id: 'py-try-except', title: 'Python Try...Except', content: { heading: 'Python Try...Except', intro: 'Handle errors gracefully using try/except.', points: ['try, except, else, finally', 'Raise custom exceptions'], codeExample: 'try:\n  print(x)\nexcept NameError:\n  print("Variable not defined")\nfinally:\n  print("Done")', codeLanguage: 'python' } },
      { id: 'py-user-input', title: 'Python User Input', content: { heading: 'Python User Input', intro: 'Python allows user input with input().', points: ['Returns string by default', 'Cast with int() or float()'], codeExample: 'username = input("Enter username:")\nprint("Hello " + username)', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python Classes',
    topics: [
      { 
        id: 'py-oop', 
        title: 'Python OOP', 
        content: { 
          heading: 'Python Object Oriented Programming', 
          intro: 'Python is an object-oriented programming language. Almost everything in Python is an object, with its properties and methods.', 
          sections: [
            {
              title: 'The Concept of Objects',
              text: 'In Python, we use classes to create our own data types. For example, if you are making a game, you might create a "Player" class that contains the player\'s health, name, and methods like "jump" or "run".'
            }
          ],
          points: [
            '**Classes**: Blueprints for objects.',
            '**Instances**: The actual objects created from classes.'
          ], 
          codeExample: 'class MyClass:\n  x = 5\n\nobj = MyClass()\nprint(obj.x)', 
          codeLanguage: 'python' 
        } 
      },
      { 
        id: 'py-classes-objects', 
        title: 'Classes/Objects', 
        content: { 
          heading: 'Python Classes and Objects', 
          intro: 'A Class is like an object constructor, or a "blueprint" for creating objects.', 
          sections: [
            {
              title: 'The __init__() Function',
              text: 'To understand classes, you must understand the built-in __init__() function. All classes have a function called __init__(), which is always executed when the class is being initiated. We use it to assign values to object properties.'
            },
            {
              title: 'The self Parameter',
              text: 'The self parameter is a reference to the current instance of the class, and is used to access variables that belong to the class.'
            }
          ],
          points: [
            '**__init__**: The constructor.',
            '**self**: Reference to the current object.'
          ], 
          codeExample: 'class Person:\n  def __init__(self, name, age):\n    self.name = name\n    self.age = age\n\np1 = Person("John", 36)\nprint(p1.name)', 
          codeLanguage: 'python' 
        } 
      },
      { 
        id: 'py-inheritance', 
        title: 'Inheritance', 
        content: { 
          heading: 'Python Inheritance', 
          intro: 'Inheritance allows us to define a class that inherits all the methods and properties from another class.', 
          sections: [
            {
              title: 'Parent vs Child',
              text: 'Parent class is the class being inherited from, also called base class. Child class is the class that inherits from another class, also called derived class.'
            }
          ],
          points: [
            '**Syntax**: `class Student(Person):`',
            '**super()**: A function that will make the child class inherit all the methods and properties from its parent.'
          ], 
          codeExample: 'class Person:\n  def __init__(self, fname, lname):\n    self.firstname = fname\n    self.lastname = lname\n\nclass Student(Person):\n  pass\n\nx = Student("Mike", "Olsen")', 
          codeLanguage: 'python' 
        } 
      },
      { id: 'py-polymorphism', title: 'Polymorphism', content: { heading: 'Python Polymorphism', intro: 'The ability to use a common interface for different types.', points: ['Method overriding', 'Duck typing'], codeExample: 'for animal in [Dog(), Cat()]:\n  print(animal.speak())', codeLanguage: 'python' } },
      { id: 'py-encapsulation', title: 'Encapsulation', content: { heading: 'Python Encapsulation', intro: 'Protect the internal state of an object.', points: ['Private: _name or __name', 'Getters and setters'], codeExample: 'class Person:\n  def __init__(self, name):\n    self.__name = name\n  def get_name(self):\n    return self.__name', codeLanguage: 'python' } },
      { id: 'py-inner-class', title: 'Inner Classes', content: { heading: 'Python Inner Classes', intro: 'A class defined within another class.', points: ['Logical grouping', 'Scoped to the outer class'], codeExample: 'class Outer:\n  class Inner:\n    def hi(self):\n      print("Inner class!")', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python File Handling',
    topics: [
      { id: 'py-file-intro', title: 'File Handling', content: { heading: 'Python File Handling', intro: 'Python has built-in functions for creating, reading, updating, and deleting files.', points: ['open()', 'Modes: r, a, w, x'], codeExample: 'f = open("demo.txt")\nprint(f.read())', codeLanguage: 'python' } },
      { id: 'py-read-files', title: 'Read Files', content: { heading: 'Read Files', intro: 'Open a file and read its content.', points: ['f.read()', 'f.readline()', 'Iterate lines with for'], codeExample: 'f = open("demofile.txt", "r")\nfor x in f:\n  print(x)', codeLanguage: 'python' } },
      { id: 'py-write-files', title: 'Write/Create Files', content: { heading: 'Write and Create Files', intro: 'Writing or creating files with "w", "a", or "x" modes.', points: ['"a" appends', '"w" overwrites'], codeExample: 'f = open("demo2.txt", "w")\nf.write("Hello!")\nf.close()', codeLanguage: 'python' } },
      { id: 'py-delete-files', title: 'Delete Files', content: { heading: 'Delete Files', intro: 'Use the os module to delete files.', points: ['os.remove()', 'os.rmdir() for folders'], codeExample: 'import os\nos.remove("demofile.txt")', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python Libraries',
    topics: [
      { id: 'py-numpy', title: 'NumPy', content: { heading: 'NumPy Tutorial', intro: 'NumPy is a library for working with arrays and numerical computing.', points: ['pip install numpy', 'N-dimensional array support', 'Mathematical functions'], codeExample: 'import numpy as np\narr = np.array([1, 2, 3])\nprint(arr)', codeLanguage: 'python' } },
      { id: 'py-pandas', title: 'Pandas', content: { heading: 'Pandas Tutorial', intro: 'Pandas is a data analysis and manipulation library.', points: ['DataFrame and Series', 'Read CSV/Excel', 'Data cleaning tools'], codeExample: 'import pandas as pd\ndf = pd.read_csv("data.csv")\nprint(df.head())', codeLanguage: 'python' } },
      { id: 'py-scipy', title: 'SciPy', content: { heading: 'SciPy Tutorial', intro: 'SciPy is used for scientific and technical computing.', points: ['Built on NumPy', 'Integration, optimization, stats'], codeExample: 'from scipy import constants\nprint(constants.pi)', codeLanguage: 'python' } },
      { id: 'py-django', title: 'Django', content: { heading: 'Django Tutorial', intro: 'Django is a high-level Python web framework.', points: ['pip install django', 'MVC architecture (MVT)', 'ORM for database'], codeExample: 'django-admin startproject mysite', codeLanguage: 'bash' } },
    ],
  },
  {
    label: 'Python Matplotlib',
    topics: [
      { id: 'py-mpl-intro', title: 'Matplotlib Intro', content: { heading: 'Matplotlib Intro', intro: 'Matplotlib is a data visualization library for Python.', points: ['pip install matplotlib', 'Creates 2D graphs and plots'], codeExample: 'import matplotlib.pyplot as plt\nplt.plot([1,2,3])\nplt.show()', codeLanguage: 'python' } },
      { id: 'py-mpl-pyplot', title: 'Pyplot', content: { heading: 'Matplotlib Pyplot', intro: 'Pyplot is a collection of functions for plotting.', points: ['plt.plot()', 'plt.xlabel(), plt.ylabel()'], codeExample: 'plt.plot([1,2,3], [4,5,1])\nplt.title("My Plot")\nplt.show()', codeLanguage: 'python' } },
      { id: 'py-mpl-scatter', title: 'Scatter Plot', content: { heading: 'Scatter Plot', intro: 'A scatter plot compares two variables.', points: ['plt.scatter(x, y)'], codeExample: 'x = [5,7,8]\ny = [99,86,87]\nplt.scatter(x, y)\nplt.show()', codeLanguage: 'python' } },
      { id: 'py-mpl-bars', title: 'Bar Charts', content: { heading: 'Bar Charts', intro: 'Bar charts display categorical data.', points: ['plt.bar() vertical', 'plt.barh() horizontal'], codeExample: 'plt.bar(["A","B"], [400, 350])\nplt.show()', codeLanguage: 'python' } },
      { id: 'py-mpl-pie', title: 'Pie Charts', content: { heading: 'Pie Charts', intro: 'Pie charts show parts of a whole.', points: ['plt.pie()', 'labels, autopct, explode'], codeExample: 'plt.pie([35, 25, 25, 15])\nplt.show()', codeLanguage: 'python' } },
      { id: 'py-mpl-hist', title: 'Histograms', content: { heading: 'Histograms', intro: 'Histogram shows frequency distribution of data.', points: ['plt.hist()', 'bins parameter'], codeExample: 'plt.hist([1,2,3,5,5,5,6], 5)\nplt.show()', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python Machine Learning',
    topics: [
      { id: 'py-ml-intro', title: 'Getting Started', content: { heading: 'Machine Learning Intro', intro: 'Machine learning teaches computers to learn from data.', points: ['Supervised / Unsupervised learning', 'Uses: sklearn, numpy, pandas'], codeExample: 'import sklearn', codeLanguage: 'python' } },
      { id: 'py-ml-mean', title: 'Mean Median Mode', content: { heading: 'Mean Median Mode', intro: 'Basic statistical measures.', points: ['Mean: average', 'Median: middle value', 'Mode: most common'], codeExample: 'import numpy as np\nspeed = [99,86,87,88]\nprint(np.mean(speed))', codeLanguage: 'python' } },
      { id: 'py-ml-regression', title: 'Linear Regression', content: { heading: 'Linear Regression', intro: 'Model the relationship between variables.', points: ['sklearn LinearRegression', 'Predict continuous values'], codeExample: 'from sklearn.linear_model import LinearRegression\nmodel = LinearRegression()', codeLanguage: 'python' } },
      { id: 'py-ml-decision', title: 'Decision Tree', content: { heading: 'Decision Tree', intro: 'A tree-like model of decisions.', points: ['DecisionTreeClassifier', 'Feature importance'], codeExample: 'from sklearn.tree import DecisionTreeClassifier\nmodel = DecisionTreeClassifier()', codeLanguage: 'python' } },
      { id: 'py-ml-kmeans', title: 'K-means', content: { heading: 'K-means Clustering', intro: 'Group data into clusters.', points: ['KMeans from sklearn', 'Unsupervised learning'], codeExample: 'from sklearn.cluster import KMeans\nkm = KMeans(n_clusters=3)', codeLanguage: 'python' } },
      { id: 'py-ml-knn', title: 'K-nearest Neighbors', content: { heading: 'K-nearest Neighbors', intro: 'Classify data based on nearby points.', points: ['KNeighborsClassifier', 'Choose k wisely'], codeExample: 'from sklearn.neighbors import KNeighborsClassifier\nmodel = KNeighborsClassifier(n_neighbors=5)', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python DSA',
    topics: [
      { id: 'py-dsa-intro', title: 'Python DSA', content: { heading: 'Data Structures & Algorithms', intro: 'DSA is the study of organizing and efficiently processing data.', points: ['Lists, Stacks, Queues, Trees, Graphs', 'Search and Sort algorithms'], codeExample: 'arr = [1, 2, 3, 4, 5]', codeLanguage: 'python' } },
      { id: 'py-dsa-stacks', title: 'Stacks', content: { heading: 'Python Stacks', intro: 'Last-In First-Out (LIFO) structure.', points: ['push: append()', 'pop: pop()'], codeExample: 'stack = []\nstack.append("a")\nstack.append("b")\nprint(stack.pop())  # b', codeLanguage: 'python' } },
      { id: 'py-dsa-queues', title: 'Queues', content: { heading: 'Python Queues', intro: 'First-In First-Out (FIFO) structure.', points: ['Use deque for efficiency', 'appendleft(), pop()'], codeExample: 'from collections import deque\nq = deque()\nq.append("a")\nprint(q)', codeLanguage: 'python' } },
      { id: 'py-dsa-linked', title: 'Linked Lists', content: { heading: 'Linked Lists', intro: 'A list of nodes where each node points to the next.', points: ['Node: data + next', 'No random access'], codeExample: 'class Node:\n  def __init__(self, data):\n    self.data = data\n    self.next = None', codeLanguage: 'python' } },
      { id: 'py-dsa-trees', title: 'Binary Trees', content: { heading: 'Binary Trees', intro: 'Each node has at most two children.', points: ['Root, leaf, edges', 'Pre/In/Post-order traversal'], codeExample: 'class TreeNode:\n  def __init__(self, val):\n    self.val = val\n    self.left = None\n    self.right = None', codeLanguage: 'python' } },
      { id: 'py-dsa-binsearch', title: 'Binary Search', content: { heading: 'Binary Search', intro: 'Efficient search in sorted arrays. O(log n).', points: ['Compare mid element', 'Divide and conquer'], codeExample: 'def binary_search(arr, x):\n  low, high = 0, len(arr)-1\n  while low <= high:\n    mid = (low + high) // 2\n    if arr[mid] == x: return mid\n    elif arr[mid] < x: low = mid + 1\n    else: high = mid - 1\n  return -1', codeLanguage: 'python' } },
      { id: 'py-dsa-quicksort', title: 'Quick Sort', content: { heading: 'Quick Sort', intro: 'Divide and conquer sorting. Average O(n log n).', points: ['Pick a pivot', 'Partition into two halves'], codeExample: 'def quick_sort(arr):\n  if len(arr) <= 1: return arr\n  pivot = arr[0]\n  left = [x for x in arr[1:] if x <= pivot]\n  right = [x for x in arr[1:] if x > pivot]\n  return quick_sort(left) + [pivot] + quick_sort(right)', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python MySQL',
    topics: [
      { id: 'py-mysql-intro', title: 'MySQL Get Started', content: { heading: 'Python MySQL', intro: 'Connect Python to MySQL using mysql-connector-python.', points: ['pip install mysql-connector-python'], codeExample: 'import mysql.connector\nmydb = mysql.connector.connect(\n  host="localhost",\n  user="user",\n  password="password"\n)', codeLanguage: 'python' } },
      { id: 'py-mysql-select', title: 'MySQL Select', content: { heading: 'MySQL SELECT', intro: 'Read data from your MySQL database.', points: ['cursor.execute()', 'fetchall()'], codeExample: 'cursor.execute("SELECT * FROM customers")\nresult = cursor.fetchall()', codeLanguage: 'python' } },
      { id: 'py-mysql-insert', title: 'MySQL Insert', content: { heading: 'MySQL INSERT', intro: 'Insert data into a MySQL table.', points: ['Parameterized queries', 'db.commit()'], codeExample: 'sql = "INSERT INTO customers (name) VALUES (%s)"\ncursor.execute(sql, ("John",))\ndb.commit()', codeLanguage: 'python' } },
      { id: 'py-mysql-update', title: 'MySQL Update/Delete', content: { heading: 'MySQL UPDATE and DELETE', intro: 'Modify or remove records.', points: ['Always use WHERE clause'], codeExample: 'cursor.execute("UPDATE customers SET name=%s WHERE id=%s", ("Jane", 1))\ndb.commit()', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python MongoDB',
    topics: [
      { id: 'py-mongo-intro', title: 'MongoDB Get Started', content: { heading: 'Python MongoDB', intro: 'Use PyMongo to connect Python to MongoDB.', points: ['pip install pymongo', 'NoSQL document storage'], codeExample: 'import pymongo\nclient = pymongo.MongoClient("mongodb://localhost:27017/")', codeLanguage: 'python' } },
      { id: 'py-mongo-insert', title: 'MongoDB Insert', content: { heading: 'MongoDB Insert', intro: 'Insert documents into a collection.', points: ['insert_one()', 'insert_many()'], codeExample: 'mydict = {"name": "John"}\nx = mycol.insert_one(mydict)', codeLanguage: 'python' } },
      { id: 'py-mongo-find', title: 'MongoDB Find', content: { heading: 'MongoDB Find', intro: 'Read data from a MongoDB collection.', points: ['find_one()', 'find() for all'], codeExample: 'x = mycol.find_one()\nprint(x)', codeLanguage: 'python' } },
      { id: 'py-mongo-update', title: 'MongoDB Update/Delete', content: { heading: 'MongoDB Update and Delete', intro: 'Modify or remove documents.', points: ['update_one(), update_many()', 'delete_one(), delete_many()'], codeExample: 'mycol.update_one({"name": "John"}, {"$set": {"address": "Canyon 123"}})', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python Reference',
    topics: [
      { id: 'py-ref-overview', title: 'Python Overview', content: { heading: 'Python Reference Overview', intro: 'Quick reference for built-in Python features.', points: ['Built-in functions', 'String methods', 'List methods'], codeExample: 'help(str)', codeLanguage: 'python' } },
      { id: 'py-ref-builtins', title: 'Built-in Functions', content: { heading: 'Python Built-in Functions', intro: 'Functions available without any imports.', points: ['print(), len(), type()', 'range(), zip(), map()', 'sorted(), enumerate()'], codeExample: 'print(len("Hello"))\nprint(sorted([3,1,2]))', codeLanguage: 'python' } },
      { id: 'py-ref-string-methods', title: 'String Methods', content: { heading: 'String Methods', intro: 'Methods available on string objects.', points: ['upper(), lower()', 'strip(), replace()', 'split(), join()'], codeExample: 'txt = "  Hello World  "\nprint(txt.strip())\nprint(txt.replace("H", "J"))', codeLanguage: 'python' } },
      { id: 'py-ref-list-methods', title: 'List Methods', content: { heading: 'Python List Methods', intro: 'Methods available on list objects.', points: ['append(), extend()', 'remove(), pop()', 'sort(), reverse()'], codeExample: 'fruits = ["banana", "apple"]\nfruits.sort()\nprint(fruits)', codeLanguage: 'python' } },
    ],
  },
  {
    label: 'Python Extras',
    topics: [
      { id: 'py-examples', title: 'Python Examples', content: { heading: 'Python Examples', intro: 'Practice by reviewing and running real-world examples.', points: ['Real code snippets', 'Practical applications'], codeExample: '# Fibonacci\ndef fib(n):\n  if n <= 1: return n\n  return fib(n-1) + fib(n-2)\nprint(fib(10))', codeLanguage: 'python' } },
      { id: 'py-howto', title: 'Python How To', content: { heading: 'Python How Tos', intro: 'Quick solutions to common Python tasks.', points: ['Remove list duplicates', 'Reverse a string', 'Add two numbers'], codeExample: 'mylist = list(dict.fromkeys([1,1,2,3,3]))\nprint(mylist)', codeLanguage: 'python' } },
      { id: 'py-quiz', title: 'Quiz & Exercises', content: { heading: 'Quiz and Exercises', intro: 'Test your Python knowledge.', points: ['Python Quiz', 'Python Exercises', 'Python Challenges'], codeExample: 'def is_palindrome(s):\n  return s == s[::-1]\nprint(is_palindrome("racecar"))', codeLanguage: 'python' } },
    ],
  },
];


const allTopics = categories.flatMap(c => c.topics);

interface ResourcesProps {
  onNavigate: (href: string) => void;
}

export default function Resources({ onNavigate }: ResourcesProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'java' | 'python'>('java');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const topicRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [pillStyle, setPillStyle] = useState({ top: 0, height: 0, opacity: 0 });

  const filteredCategories = categories.filter(c => {
    if (selectedLanguage === 'java') return c.label.includes('Java');
    if (selectedLanguage === 'python') return c.label.includes('Python');
    return false;
  });

  const filteredTopics = filteredCategories.flatMap(c => c.topics);
  const [selectedTopicId, setSelectedTopicId] = useState(filteredTopics[0]?.id);

  // When language changes, reset selected topic to the first one in that language
  const handleLanguageChange = (lang: 'java' | 'python') => {
    setSelectedLanguage(lang);
    const newFiltered = categories.filter(c => {
      if (lang === 'java') return c.label.includes('Java');
      if (lang === 'python') return c.label.includes('Python');
      return false;
    });
    const newTopics = newFiltered.flatMap(c => c.topics);
    if (newTopics.length > 0) {
      setSelectedTopicId(newTopics[0].id);
    }
  };

  useLayoutEffect(() => {
    const activeBtn = topicRefs.current[selectedTopicId];
    if (activeBtn) {
      setPillStyle({
        top: activeBtn.offsetTop,
        height: activeBtn.offsetHeight,
        opacity: 1
      });
    } else {
      setPillStyle(s => ({ ...s, opacity: 0 }));
    }
  }, [selectedTopicId, selectedLanguage, sidebarCollapsed]);

  const selectedTopic = allTopics.find(t => t.id === selectedTopicId) || filteredTopics[0];
  const currentIndex = filteredTopics.findIndex(t => t.id === selectedTopicId);
  const prevTopic = currentIndex > 0 ? filteredTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex < filteredTopics.length - 1 ? filteredTopics[currentIndex + 1] : null;

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#FAFAFA] font-sans">
      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Topic Sidebar */}
      <aside
        className={`
          flex-shrink-0 border-r border-[#E0E0E0] bg-white overflow-y-auto transition-all duration-300 flex flex-col z-50
          ${sidebarCollapsed ? 'w-0' : 'w-[280px] lg:w-[240px]'}
          fixed inset-y-0 left-0 lg:static
          ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        `}
      >
        {!sidebarCollapsed && (
          <>
            {/* Language Toggle */}
            <div className="p-4 border-b border-[#E0E0E0]">
              <div className="relative flex bg-[#F5F5F5] rounded-lg p-1">
                {/* Sliding Background Pill */}
                <div 
                  className={`absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm transition-transform duration-300 ease-in-out z-0
                    ${selectedLanguage === 'java' ? 'translate-x-0' : 'translate-x-full'}`}
                />
                
                <button
                  onClick={() => handleLanguageChange('java')}
                  className={`relative z-10 flex-1 py-1.5 text-[12px] font-bold rounded-md transition-colors duration-300
                    ${selectedLanguage === 'java'
                      ? 'text-[#1B5E20]'
                      : 'text-[#757575] hover:text-[#212121]'
                    }`}
                >
                  Java
                </button>
                <button
                  onClick={() => handleLanguageChange('python')}
                  className={`relative z-10 flex-1 py-1.5 text-[12px] font-bold rounded-md transition-colors duration-300
                    ${selectedLanguage === 'python'
                      ? 'text-[#1B5E20]'
                      : 'text-[#757575] hover:text-[#212121]'
                    }`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto py-2">
              {/* Sliding Topic Pill */}
              <div 
                className="absolute left-0 right-0 bg-[#E8F5E9] border-r-2 border-[#1B5E20] transition-all duration-300 ease-in-out z-0"
                style={{ 
                  top: pillStyle.top,
                  height: pillStyle.height,
                  opacity: pillStyle.opacity
                }}
              />

              {filteredCategories.map((category) => (
                <div key={category.label} className="mb-2">
                  <div className="px-4 py-2 text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">
                    {category.label}
                  </div>
                  {category.topics.map((topic) => {
                    const isActive = topic.id === selectedTopicId;
                    return (
                      <button
                        key={topic.id}
                        ref={el => topicRefs.current[topic.id] = el}
                        onClick={() => {
                          setSelectedTopicId(topic.id);
                          if (window.innerWidth < 1024) {
                            setSidebarCollapsed(true);
                          }
                        }}
                        className={`relative z-10 w-full text-left px-4 py-[7px] text-[13px] transition-colors
                          ${isActive
                            ? 'text-[#1B5E20] font-semibold'
                            : 'text-[#424242] hover:bg-[#F5F5F5] hover:text-[#212121]'
                          }`}
                      >
                        {topic.title}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-[#E0E0E0]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-md text-[#757575] hover:bg-[#F5F5F5] transition-colors"
            title={sidebarCollapsed ? 'Show topics' : 'Hide topics'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2 text-[12px] md:text-[13px] text-[#757575] overflow-hidden">
            <BookOpen className="w-4 h-4 text-[#1B5E20] flex-shrink-0" />
            <span className="font-medium text-[#212121] hidden sm:inline">Resources</span>
            <span className="hidden sm:inline">/</span>
            <span className="capitalize whitespace-nowrap">{selectedLanguage}</span>
            <span>/</span>
            <span className="truncate">{selectedTopic?.content.heading}</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            {/* Heading */}
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#212121] mb-4">
              {selectedTopic.content.heading}
            </h1>

            {/* Intro */}
            <p className="text-[15px] text-[#424242] leading-relaxed mb-6">
              {selectedTopic.content.intro}
            </p>

            {/* Detailed Sections */}
            {selectedTopic.content.sections && (
              <div className="space-y-6 mb-8">
                {selectedTopic.content.sections.map((section, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-[#F0F0F0] p-5 shadow-sm">
                    <h2 className="text-[17px] font-bold text-[#1B5E20] mb-2 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
                       {section.title}
                    </h2>
                    <p 
                      className="text-[14px] text-[#546E7A] leading-7"
                      dangerouslySetInnerHTML={{
                        __html: section.text.replace(/`([^`]+)`/g, '<code style="background:#F5F5F5;padding:1px 5px;border-radius:4px;font-size:12px;color:#1B5E20;">$1</code>')
                          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Key Points */}
            {selectedTopic.content.points && (
              <div className="mb-6">
                <h2 className="text-[17px] font-semibold text-[#212121] mb-3">Key Points</h2>
                <ul className="space-y-2">
                  {selectedTopic.content.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] text-[#424242]">
                      <span className="mt-1 w-2 h-2 rounded-full bg-[#1B5E20] flex-shrink-0" />
                      <span
                        dangerouslySetInnerHTML={{
                          __html: point.replace(/`([^`]+)`/g, '<code style="background:#F5F5F5;padding:1px 5px;border-radius:4px;font-size:12px;color:#1B5E20;">$1</code>')
                            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code Example */}
            {selectedTopic.content.codeExample && (
              <div className="mb-6">
                <div className="flex items-center justify-between bg-[#212121] rounded-t-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="text-[12px] text-[#9E9E9E] font-mono">
                    {selectedTopic.content.codeLanguage || 'code'}
                  </span>
                </div>
                <div className="relative group">
                  <pre
                    className="bg-[#1A1A2E] rounded-b-lg px-5 py-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-[#E8E8E8]"
                    style={{ margin: 0 }}
                  >
                    <code>{selectedTopic.content.codeExample}</code>
                  </pre>
                  <button
                    onClick={() => onNavigate('/compiler')}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1B5E20] text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-lg hover:bg-[#2E7D32]"
                  >
                    Try it in Compiler
                  </button>
                </div>
              </div>
            )}

            {/* Tip */}
            {selectedTopic.content.tip && (
              <div className="mb-6 bg-[#E8F5E9] border-l-4 border-[#1B5E20] rounded-r-lg px-4 py-3">
                <p className="text-[13px] text-[#1B5E20]">
                  <span className="font-bold">💡 Tip: </span>
                  {selectedTopic.content.tip}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 border-t border-[#E0E0E0] pt-8">
              <button
                onClick={() => prevTopic && setSelectedTopicId(prevTopic.id)}
                disabled={!prevTopic}
                className={`
                  w-full sm:w-auto group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E0E0E0] transition-all
                  ${!prevTopic ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white hover:border-[#1B5E20] hover:shadow-sm'}
                `}
              >
                <ChevronLeft className={`w-4 h-4 ${prevTopic ? 'group-hover:text-[#1B5E20]' : ''}`} />
                <div className="text-left">
                  <p className="text-[10px] text-[#757575] uppercase font-bold tracking-wider">Previous</p>
                  <p className="text-[13px] font-semibold text-[#424242]">{prevTopic?.title || 'Back to Start'}</p>
                </div>
              </button>

              <div className="flex-1 hidden sm:block" />

              <button
                onClick={() => nextTopic && setSelectedTopicId(nextTopic.id)}
                disabled={!nextTopic}
                className={`
                  w-full sm:w-auto group flex items-center justify-between sm:justify-end gap-2 px-4 py-2.5 rounded-lg border border-transparent bg-[#1B5E20] text-white transition-all
                  ${!nextTopic ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#2E7D32] hover:shadow-md'}
                `}
              >
                <div className="text-right">
                  <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Next Topic</p>
                  <p className="text-[13px] font-semibold">{nextTopic?.title || 'End of Track'}</p>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
