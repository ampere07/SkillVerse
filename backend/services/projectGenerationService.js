import { Ollama } from 'ollama';
import Survey from '../models/Survey.js';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';

const MODEL_NAME = OLLAMA_CONFIG.model;
const OLLAMA_URL = OLLAMA_CONFIG.url;

const ollama = new Ollama({ host: OLLAMA_URL });

console.log(`Project Generation Service using Ollama`);
console.log(`Model: ${MODEL_NAME}`);
console.log(`URL: ${OLLAMA_URL}`);

const createFallbackProjects = (language, skillLevel, roadmap) => {
  const isJava = language.toLowerCase() === 'java';
  const phase1Items = roadmap?.phase1 || [];
  
  if (skillLevel === 'Beginner') {
    if (isJava) {
      return [
        {
          title: 'Variables - Student Profile Manager',
          description: 'Learn to work with variables and data types by creating a student profile system. Store and display information like name, age, GPA, and enrollment status.',
          language: 'Java',
          requirements: `- Declare variables: name (String), age (int), gpa (double), isEnrolled (boolean)\n- Use Scanner to accept user input\n- Validate age (1-100) and GPA (0.0-4.0)\n- Display formatted profile with labels`,
          rubrics: `- Variable Declaration (25pts): All types correct\n- Input Handling (25pts): Scanner properly used\n- Validation (25pts): Age and GPA checks work\n- Output Format (15pts): Clean, readable display\n- Code Quality (10pts): Proper naming conventions`
        },
        {
          title: 'Operators - Simple Calculator',
          description: 'Master arithmetic and comparison operators by building a basic calculator. Perform operations and compare results.',
          language: 'Java',
          requirements: `- Accept two numbers from user\n- Implement all basic operations (+, -, *, /, %)\n- Display results with proper formatting\n- Compare results and show largest operation result`,
          rubrics: `- Arithmetic Operations (30pts): All operators work\n- User Input (20pts): Accepts two numbers\n- Comparison Logic (20pts): Finds largest result\n- Output (20pts): Clear display of all results\n- Code Structure (10pts): Clean organization`
        },
        {
          title: 'Conditionals - Grade Evaluator',
          description: 'Practice if-else statements by creating a grade evaluation system. Convert numeric scores to letter grades.',
          language: 'Java',
          requirements: `- Accept score input (0-100)\n- Validate score range\n- Convert to letter grade (A, B, C, D, F)\n- Display grade with pass/fail status`,
          rubrics: `- Conditional Logic (30pts): Correct grade ranges\n- Input Validation (25pts): Score range checked\n- Grade Conversion (25pts): Accurate results\n- Output (15pts): Clear display\n- Code Quality (5pts): Readable structure`
        },
        {
          title: 'Loops - Number Pattern Generator',
          description: 'Master for and while loops by creating various number patterns. Generate sequences and shapes using loops.',
          language: 'Java',
          requirements: `- Generate multiplication table (1-10)\n- Create number pyramid pattern\n- Calculate sum of numbers 1 to N\n- Menu to choose pattern type`,
          rubrics: `- For Loop Usage (25pts): Multiplication table\n- While Loop Usage (25pts): Sum calculation\n- Nested Loops (25pts): Pyramid pattern\n- Menu System (15pts): Pattern selection\n- Output Format (10pts): Clean display`
        },
        {
          title: 'Arrays - Class Roster Manager',
          description: 'Learn array operations by managing a class roster. Store student names and perform basic operations.',
          language: 'Java',
          requirements: `- Array to store 5 student names\n- Add students to roster\n- Display all students\n- Search for specific student`,
          rubrics: `- Array Declaration (25pts): Proper initialization\n- Add Operation (25pts): Stores names correctly\n- Display Operation (20pts): Shows all students\n- Search Operation (20pts): Finds students\n- Code Organization (10pts): Clear structure`
        },
        {
          title: 'Methods - Temperature Converter',
          description: 'Practice creating and calling methods by building a temperature conversion utility. Convert between Celsius, Fahrenheit, and Kelvin.',
          language: 'Java',
          requirements: `- Method for Celsius to Fahrenheit\n- Method for Fahrenheit to Celsius\n- Method for Celsius to Kelvin\n- Main menu to select conversion type`,
          rubrics: `- Method Creation (30pts): All conversions correct\n- Parameters (20pts): Proper parameter usage\n- Return Values (20pts): Correct returns\n- Menu Integration (20pts): Method calls work\n- Code Quality (10pts): Clean, modular design`
        }
      ];
    } else {
      return [
        {
          title: 'Variables - Personal Info Manager',
          description: 'Learn to work with variables and data types by creating a personal information system. Store and display different types of data.',
          language: 'Python',
          requirements: `- Create variables: name (str), age (int), height (float), is_student (bool)\n- Use input() to get user data\n- Validate age (1-120) and height (50.0-250.0)\n- Display formatted information`,
          rubrics: `- Variable Types (25pts): All types correct\n- Input Handling (25pts): Proper input() usage\n- Validation (25pts): Age and height checks\n- Output Format (15pts): Clean display\n- Code Quality (10pts): Good naming`
        },
        {
          title: 'Operators - Math Operations Tool',
          description: 'Master Python operators by building a mathematical operations tool. Perform calculations and comparisons.',
          language: 'Python',
          requirements: `- Accept two numbers from user\n- Perform all basic operations (+, -, *, /, //, %, **)\n- Display results clearly\n- Compare and show largest result`,
          rubrics: `- Arithmetic Operations (30pts): All operators\n- User Input (20pts): Accepts numbers\n- Comparison (20pts): Finds maximum\n- Output (20pts): Clear formatting\n- Code Structure (10pts): Organization`
        },
        {
          title: 'Conditionals - Score Classifier',
          description: 'Practice if-elif-else statements by creating a score classification system. Categorize scores into performance levels.',
          language: 'Python',
          requirements: `- Accept score (0-100)\n- Validate input range\n- Classify as Excellent/Good/Average/Poor\n- Display classification with emoji`,
          rubrics: `- Conditional Logic (30pts): Correct ranges\n- Input Validation (25pts): Range checking\n- Classification (25pts): Accurate results\n- Output (15pts): Clear with emojis\n- Code Quality (5pts): Clean code`
        },
        {
          title: 'Loops - Pattern Creator',
          description: 'Master for and while loops by creating various patterns. Generate sequences and shapes.',
          language: 'Python',
          requirements: `- Generate times table using for loop\n- Create star pyramid with nested loops\n- Calculate factorial using while loop\n- Menu to select pattern`,
          rubrics: `- For Loops (25pts): Times table works\n- While Loops (25pts): Factorial correct\n- Nested Loops (25pts): Pyramid pattern\n- Menu (15pts): Selection works\n- Output (10pts): Clean display`
        },
        {
          title: 'Lists - Task Manager',
          description: 'Learn list operations by building a simple task manager. Store and manipulate a list of tasks.',
          language: 'Python',
          requirements: `- List to store tasks\n- Add new tasks\n- Display all tasks\n- Remove completed tasks\n- Show task count`,
          rubrics: `- List Operations (25pts): Add/remove work\n- Display Function (20pts): Shows all tasks\n- Remove Function (25pts): Deletion works\n- Task Counter (20pts): Count accurate\n- Code Structure (10pts): Organization`
        },
        {
          title: 'Functions - Unit Converter',
          description: 'Practice creating functions by building a unit conversion tool. Convert between different measurement units.',
          language: 'Python',
          requirements: `- Function for km to miles\n- Function for kg to pounds\n- Function for celsius to fahrenheit\n- Menu to choose conversion`,
          rubrics: `- Function Definitions (30pts): All conversions\n- Parameters (20pts): Proper usage\n- Return Values (20pts): Correct returns\n- Menu System (20pts): Integration works\n- Code Quality (10pts): Clean, modular`
        }
      ];
    }
  } else if (skillLevel === 'Intermediate') {
    if (isJava) {
      return [
        {
          title: 'Interfaces - Payment System',
          description: 'Learn interfaces and polymorphism by creating a payment processing system. Implement multiple payment methods with a common interface.',
          language: 'Java',
          requirements: `- Create Payable interface with processPayment() method\n- Implement CreditCard and PayPal classes\n- Store payments in ArrayList\n- Process all payments polymorphically`,
          rubrics: `- Interface Design (25pts): Proper interface\n- Implementation (25pts): Classes correct\n- Polymorphism (25pts): ArrayList works\n- Payment Logic (15pts): Processing works\n- Code Quality (10pts): Clean OOP design`
        },
        {
          title: 'Collections - Inventory Manager',
          description: 'Master Java Collections Framework by building an inventory management system. Use ArrayList, HashMap, and HashSet.',
          language: 'Java',
          requirements: `- ArrayList for product list\n- HashMap for product ID to name mapping\n- HashSet for unique categories\n- CRUD operations for products\n- Search by ID and category`,
          rubrics: `- ArrayList Usage (20pts): Product storage\n- HashMap Usage (20pts): ID mapping\n- HashSet Usage (20pts): Categories\n- CRUD Operations (25pts): All work\n- Search Features (15pts): Both searches work`
        },
        {
          title: 'Exceptions - File Logger',
          description: 'Practice exception handling by creating a console-based logging system. Handle various error scenarios gracefully.',
          language: 'Java',
          requirements: `- ArrayList to store log entries in memory\n- Try-catch for invalid input\n- Custom LogException class\n- Validate log levels (INFO, WARN, ERROR)\n- Display logs with filtering`,
          rubrics: `- Exception Handling (30pts): Try-catch correct\n- Custom Exception (25pts): LogException proper\n- Validation (20pts): Level checking works\n- Log Storage (15pts): ArrayList usage\n- Code Quality (10pts): Error handling`
        },
        {
          title: 'Generics - Data Container',
          description: 'Learn generics and type safety by creating a generic container class. Store and retrieve different data types safely.',
          language: 'Java',
          requirements: `- Generic Box<T> class\n- Methods: add(), get(), isEmpty()\n- Test with Integer, String, Double\n- Demonstrate type safety`,
          rubrics: `- Generic Class (30pts): Proper syntax\n- Type Parameter (25pts): T usage correct\n- Methods (25pts): All work correctly\n- Type Safety (15pts): Demonstrated\n- Code Quality (5pts): Clean implementation`
        },
        {
          title: 'Lambda - List Processor',
          description: 'Master lambda expressions by creating a list processing utility. Filter, map, and reduce operations using lambdas.',
          language: 'Java',
          requirements: `- ArrayList of integers\n- Lambda to filter even numbers\n- Lambda to square numbers\n- Lambda to find sum\n- Demonstrate forEach with lambda`,
          rubrics: `- Filter Lambda (25pts): Filters correctly\n- Map Lambda (25pts): Squares numbers\n- Reduce Lambda (20pts): Sum works\n- forEach Usage (20pts): Display works\n- Code Quality (10pts): Clean lambdas`
        },
        {
          title: 'Streams - Student Analyzer',
          description: 'Learn Stream API by analyzing student data. Perform filtering, mapping, and statistical operations.',
          language: 'Java',
          requirements: `- Student class with name and grade\n- ArrayList of students\n- Stream to filter passing students\n- Stream to calculate average grade\n- Stream to find top student`,
          rubrics: `- Stream Creation (20pts): From collection\n- Filter Operation (25pts): Filters correctly\n- Average Calculation (25pts): Accurate result\n- Max Operation (20pts): Finds top student\n- Code Quality (10pts): Clean stream usage`
        }
      ];
    } else {
      return [
        {
          title: 'Advanced Data Structures - Contact Manager',
          description: 'Master dictionaries and sets by building a contact management system. Store and search contacts efficiently.',
          language: 'Python',
          requirements: `- Dictionary for contacts (name: phone)\n- Set for unique email addresses\n- Add/update/delete contacts\n- Search by name\n- List all contacts sorted`,
          rubrics: `- Dictionary Usage (25pts): Contact storage\n- Set Usage (20pts): Email uniqueness\n- CRUD Operations (30pts): All work\n- Search Feature (15pts): Name lookup\n- Code Quality (10pts): Organization`
        },
        {
          title: 'Functional Programming - Data Transformer',
          description: 'Learn functional programming with map, filter, and reduce. Transform and analyze data functionally.',
          language: 'Python',
          requirements: `- List of numbers\n- Use map() to square numbers\n- Use filter() for even numbers\n- Use reduce() to calculate product\n- Combine operations in pipeline`,
          rubrics: `- Map Usage (25pts): Transforms correctly\n- Filter Usage (25pts): Filters properly\n- Reduce Usage (25pts): Calculates product\n- Pipeline (15pts): Combined operations\n- Code Quality (10pts): Functional style`
        },
        {
          title: 'Decorators - Function Enhancer',
          description: 'Practice decorators by creating function enhancement utilities. Add logging, timing, and validation.',
          language: 'Python',
          requirements: `- @timer decorator to measure execution\n- @logger decorator to log calls\n- @validator decorator to check parameters\n- Apply decorators to sample functions`,
          rubrics: `- Timer Decorator (30pts): Measures time\n- Logger Decorator (25pts): Logs calls\n- Validator Decorator (25pts): Validates input\n- Application (15pts): Works on functions\n- Code Quality (5pts): Clean decorator code`
        },
        {
          title: 'Context Managers - Resource Handler',
          description: 'Learn context managers with the with statement. Manage resources safely and efficiently.',
          language: 'Python',
          requirements: `- Custom context manager class\n- Implement __enter__ and __exit__\n- Simulate resource management\n- Handle exceptions in context\n- Demonstrate with statement usage`,
          rubrics: `- Context Manager Class (30pts): Proper structure\n- Enter Method (20pts): Setup works\n- Exit Method (25pts): Cleanup works\n- Exception Handling (15pts): Errors handled\n- Code Quality (10pts): Clean implementation`
        },
        {
          title: 'API Simulation - Weather Service',
          description: 'Simulate working with APIs by creating a mock weather service. Parse data and handle responses.',
          language: 'Python',
          requirements: `- Dictionary to simulate API responses\n- Function to get weather by city\n- Parse and format weather data\n- Handle missing city errors\n- Display formatted forecast`,
          rubrics: `- Data Structure (25pts): Response format\n- Query Function (25pts): City lookup\n- Data Parsing (25pts): Extract info\n- Error Handling (15pts): Missing cities\n- Output Format (10pts): Clean display`
        },
        {
          title: 'Regular Expressions - Text Validator',
          description: 'Master regex patterns by creating a text validation utility. Validate emails, phones, and passwords.',
          language: 'Python',
          requirements: `- Regex pattern for email validation\n- Regex pattern for phone numbers\n- Regex pattern for strong passwords\n- Test function for each pattern\n- Display validation results`,
          rubrics: `- Email Regex (30pts): Accurate pattern\n- Phone Regex (25pts): Validates correctly\n- Password Regex (25pts): Strength check\n- Test Functions (15pts): All work\n- Code Quality (5pts): Clean patterns`
        }
      ];
    }
  } else {
    if (isJava) {
      return [
        {
          title: 'Design Pattern - Factory Implementation',
          description: 'Implement the Factory design pattern to create different types of database connections. Demonstrate creational pattern expertise.',
          language: 'Java',
          requirements: `- Connection interface with connect() method\n- MySQLConnection, PostgreSQLConnection classes\n- ConnectionFactory with createConnection() method\n- Demonstrate polymorphic connection usage\n- Handle connection type validation`,
          rubrics: `- Factory Pattern (30pts): Proper implementation\n- Interface Design (25pts): Clean abstraction\n- Concrete Classes (20pts): Implementations correct\n- Client Code (15pts): Factory usage\n- Code Quality (10pts): Professional design`
        },
        {
          title: 'Concurrent Processing - Thread Pool Executor',
          description: 'Master concurrent programming by implementing a custom thread pool executor. Manage task execution efficiently.',
          language: 'Java',
          requirements: `- Task interface with execute() method\n- ThreadPool class managing worker threads\n- Task queue using BlockingQueue simulation\n- Submit and process multiple tasks\n- Demonstrate thread safety`,
          rubrics: `- Thread Management (30pts): Pool works\n- Task Queue (25pts): Queue implementation\n- Synchronization (25pts): Thread-safe\n- Task Execution (15pts): Processing works\n- Code Quality (5pts): Professional code`
        },
        {
          title: 'Performance Optimization - Algorithm Analyzer',
          description: 'Analyze and optimize algorithm performance. Compare different sorting algorithms and measure efficiency.',
          language: 'Java',
          requirements: `- Implement bubble sort, quick sort\n- Measure execution time for each\n- Compare performance with different data sizes\n- Calculate Big-O complexity\n- Display performance comparison`,
          rubrics: `- Algorithm Implementation (30pts): Both correct\n- Time Measurement (25pts): Accurate timing\n- Performance Analysis (25pts): Proper comparison\n- Complexity Analysis (15pts): Big-O correct\n- Code Quality (5pts): Clean implementation`
        },
        {
          title: 'Security - Authentication System',
          description: 'Implement secure authentication with password hashing and validation. Apply security best practices.',
          language: 'Java',
          requirements: `- User class with hashed passwords\n- Hash passwords using simulated algorithm\n- Verify credentials securely\n- Implement password strength validation\n- Prevent timing attacks in verification`,
          rubrics: `- Password Hashing (30pts): Secure implementation\n- Credential Verification (25pts): Secure comparison\n- Strength Validation (20pts): Requirements enforced\n- Security Practices (20pts): Best practices followed\n- Code Quality (5pts): Professional code`
        },
        {
          title: 'Architectural Pattern - MVC Calculator',
          description: 'Implement Model-View-Controller architecture for a console-based calculator. Demonstrate separation of concerns.',
          language: 'Java',
          requirements: `- Model class for calculation logic\n- View class for console I/O\n- Controller class coordinating both\n- Support multiple operations\n- Demonstrate loose coupling`,
          rubrics: `- Model Layer (25pts): Business logic\n- View Layer (25pts): I/O handling\n- Controller Layer (25pts): Coordination\n- Separation (15pts): Clear boundaries\n- Code Quality (10pts): MVC principles`
        },
        {
          title: 'Advanced Collections - LRU Cache',
          description: 'Implement a Least Recently Used cache data structure. Demonstrate advanced data structure knowledge.',
          language: 'Java',
          requirements: `- LRU Cache with fixed capacity\n- get() and put() operations in O(1)\n- LinkedHashMap for ordering\n- Evict least recently used on overflow\n- Demonstrate cache behavior`,
          rubrics: `- Cache Implementation (30pts): Correct logic\n- Time Complexity (30pts): O(1) operations\n- Eviction Policy (20pts): LRU works correctly\n- Data Structure (15pts): LinkedHashMap usage\n- Code Quality (5pts): Efficient implementation`
        }
      ];
    } else {
      return [
        {
          title: 'Design Pattern - Observer System',
          description: 'Implement the Observer pattern for an event notification system. Demonstrate advanced OOP design.',
          language: 'Python',
          requirements: `- Subject class with attach/detach/notify\n- Observer interface with update() method\n- Multiple concrete observers\n- Demonstrate event notification\n- Handle observer lifecycle`,
          rubrics: `- Observer Pattern (30pts): Proper implementation\n- Subject Class (25pts): Notification works\n- Concrete Observers (20pts): Update correctly\n- Pattern Usage (15pts): Demonstrates benefits\n- Code Quality (10pts): Professional design`
        },
        {
          title: 'Metaclasses - ORM Framework',
          description: 'Create a simple ORM framework using metaclasses. Demonstrate advanced Python meta-programming.',
          language: 'Python',
          requirements: `- Custom metaclass for model definition\n- Field descriptors for attributes\n- Automatic table schema generation\n- Simulate save() and query() methods\n- Demonstrate metaclass magic`,
          rubrics: `- Metaclass Implementation (35pts): Correct usage\n- Descriptors (25pts): Field handling\n- Schema Generation (20pts): Automatic creation\n- ORM Methods (15pts): Save/query work\n- Code Quality (5pts): Advanced techniques`
        },
        {
          title: 'Async Programming - Task Scheduler',
          description: 'Implement an asynchronous task scheduler using async/await. Master concurrent programming patterns.',
          language: 'Python',
          requirements: `- Async task class with coroutine\n- Scheduler managing multiple tasks\n- Simulate async I/O operations\n- Handle task dependencies\n- Demonstrate concurrent execution`,
          rubrics: `- Async/Await Usage (30pts): Proper syntax\n- Task Management (25pts): Scheduler works\n- Concurrency (25pts): Parallel execution\n- Dependencies (15pts): Order enforced\n- Code Quality (5pts): Clean async code`
        },
        {
          title: 'Performance - Memory Profiler',
          description: 'Create a memory profiling utility to analyze object memory usage. Optimize data structure performance.',
          language: 'Python',
          requirements: `- Function to measure object size\n- Compare memory usage of different structures\n- Profile generator expressions vs lists\n- Analyze memory patterns\n- Provide optimization recommendations`,
          rubrics: `- Memory Measurement (30pts): Accurate sizing\n- Structure Comparison (25pts): Multiple types\n- Generator Analysis (25pts): Proper comparison\n- Recommendations (15pts): Valid suggestions\n- Code Quality (5pts): Professional code`
        },
        {
          title: 'Security - Encryption System',
          description: 'Implement a secure encryption and decryption system. Apply cryptographic principles correctly.',
          language: 'Python',
          requirements: `- Implement Caesar cipher with key\n- Add salt for additional security\n- Secure key storage simulation\n- Encrypt and decrypt messages\n- Prevent common attacks`,
          rubrics: `- Encryption Algorithm (30pts): Works correctly\n- Security Features (30pts): Salt and key handling\n- Decryption (20pts): Reverses properly\n- Attack Prevention (15pts): Secure implementation\n- Code Quality (5pts): Professional code`
        },
        {
          title: 'Architecture - Plugin System',
          description: 'Design an extensible plugin architecture. Demonstrate software architecture principles.',
          language: 'Python',
          requirements: `- Plugin base class with interface\n- Dynamic plugin loading mechanism\n- Plugin registry for management\n- Multiple plugin implementations\n- Demonstrate plugin execution`,
          rubrics: `- Plugin Interface (25pts): Clear contract\n- Dynamic Loading (30pts): Works correctly\n- Registry System (20pts): Manages plugins\n- Plugin Examples (15pts): Multiple working\n- Code Quality (10pts): Extensible design`
        }
      ];
    }
  }
};

export const generateWeeklyProjects = async (userId) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    
    if (!user || !user.primaryLanguage) {
      throw new Error(`No user or primaryLanguage found for user ${userId}`);
    }

    const projects = await generateProjectsForLanguage(userId, user.primaryLanguage);
    
    if (!projects || projects.length === 0) {
      throw new Error('AI failed to generate projects');
    }
    
    return projects;
  } catch (error) {
    console.error('[GenerateWeeklyProjects] Error:', error);
    throw error;
  }
};

export const generateProjectsForBothLanguages = async (userId) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error(`No user found for user ${userId}`);
    }

    console.log(`[ProjectGen] ========== GENERATING PROJECTS FOR BOTH LANGUAGES ==========`);
    console.log(`[ProjectGen] User ID: ${userId}`);
    
    console.log(`[ProjectGen] Calling generateProjectsForLanguage for JAVA...`);
    const javaProjects = await generateProjectsForLanguage(userId, 'java');
    console.log(`[ProjectGen] Java projects generated:`, javaProjects.length);
    if (javaProjects.length > 0) {
      console.log(`[ProjectGen] Sample Java project:`, { title: javaProjects[0].title, language: javaProjects[0].language });
    }
    
    console.log(`[ProjectGen] Calling generateProjectsForLanguage for PYTHON...`);
    const pythonProjects = await generateProjectsForLanguage(userId, 'python');
    console.log(`[ProjectGen] Python projects generated:`, pythonProjects.length);
    if (pythonProjects.length > 0) {
      console.log(`[ProjectGen] Sample Python project:`, { title: pythonProjects[0].title, language: pythonProjects[0].language });
    }
    
    const allProjects = [...javaProjects, ...pythonProjects];
    console.log(`[ProjectGen] Generated ${javaProjects.length} Java + ${pythonProjects.length} Python = ${allProjects.length} total projects`);
    console.log(`[ProjectGen] ================================================================`);
    
    return allProjects;
  } catch (error) {
    console.error('[GenerateProjectsForBothLanguages] Error:', error);
    throw error;
  }
};

export const generateProjectsForLanguage = async (userId, language) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error(`No user found for user ${userId}`);
    }

    const survey = await Survey.findOne({ userId, primaryLanguage: language }).sort({ createdAt: -1 });
    
    if (!survey) {
      throw new Error(`No survey found for user ${userId} and language ${language}`);
    }

    const hasLanguageData = 
      (language.toLowerCase() === 'java' && survey.javaExpertise) || 
      (language.toLowerCase() === 'python' && survey.pythonExpertise);

    if (!hasLanguageData) {
      throw new Error(`Survey found but no ${language} data available`);
    }

    if (!survey.learningRoadmap || !survey.learningRoadmap.phase1 || survey.learningRoadmap.phase1.length < 6) {
      throw new Error(`Phase 1 must have at least 6 items for ${language}`);
    }

    const skillLevel = language.toLowerCase() === 'java'
      ? determineSkillLevel(survey.javaExpertise, null, survey.javaQuestions?.score, null)
      : determineSkillLevel(null, survey.pythonExpertise, null, survey.pythonQuestions?.score);
    
    console.log(`[ProjectGen] ========== GENERATING ROADMAP-BASED PROJECTS ==========`);
    console.log(`[ProjectGen] User ID: ${userId}`);
    console.log(`[ProjectGen] Language: ${language.toUpperCase()}`);
    console.log(`[ProjectGen] Skill Level: ${skillLevel}`);
    console.log(`[ProjectGen] Roadmap Phase 1: ${survey.learningRoadmap.phase1.join(', ')}`);
    console.log(`[ProjectGen] Roadmap Phase 2: ${survey.learningRoadmap.phase2.join(', ')}`);
    console.log(`[ProjectGen] Roadmap Phase 3: ${survey.learningRoadmap.phase3.join(', ')}`);
    console.log(`[ProjectGen] ===========================================`);
    
    const languageSpecificSurvey = {
      ...survey.toObject(),
      primaryLanguage: language
    };
    
    const prompt = constructRoadmapBasedPrompt(languageSpecificSurvey);
    
    console.log(`[ProjectGen] Prompt length: ${prompt.length} characters`);
    console.log(`[ProjectGen] Has AI Analysis: ${!!languageSpecificSurvey.aiAnalysis}`);
    if (languageSpecificSurvey.aiAnalysis) {
      console.log(`[ProjectGen] AI Analysis preview:`, languageSpecificSurvey.aiAnalysis.substring(0, 200));
    }
    
    try {
      const response = await ollama.chat({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        options: {
          temperature: 0.9,
          num_predict: 1500,
          num_ctx: 2048,
          num_thread: 10
        }
      });

      const projectsText = response.message.content;
      console.log(`[ProjectGen] AI Response length: ${projectsText.length} characters`);
      console.log(`[ProjectGen] AI Response preview (first 500 chars):`, projectsText.substring(0, 500));
      
      const projects = parseProjectsFromAI(projectsText);
      console.log(`[ProjectGen] Parsed ${projects.length} projects from AI response`);
      
      if (projects.length > 0) {
        console.log(`[ProjectGen] First parsed project:`, JSON.stringify(projects[0], null, 2));
      }
      
      // Ensure all projects have the correct language
      const correctedProjects = projects.map(project => ({
        ...project,
        language: language  // Force the correct language
      }));

      if (correctedProjects.length < 6) {
        throw new Error(`Only generated ${correctedProjects.length} projects, expected 6`);
      }

      console.log(`[ProjectGen] Successfully generated ${correctedProjects.length} roadmap-based projects`);
      console.log(`[ProjectGen] All projects set to language: ${language}`);
      return correctedProjects.slice(0, 6);
    } catch (apiError) {
      console.error('[ProjectGen] Ollama Error:', apiError.message);
      console.log('[ProjectGen] Falling back to pre-defined projects...');
      
      const fallbackProjects = createFallbackProjects(language, skillLevel, survey.learningRoadmap);
      console.log(`[ProjectGen] Using ${fallbackProjects.length} fallback projects for ${language} (${skillLevel})`);
      
      return fallbackProjects;
    }
  } catch (error) {
    console.error('[GenerateProjectsForLanguage] Error:', error);
    throw error;
  }
};

const constructRoadmapBasedPrompt = (survey) => {
  const { primaryLanguage, learningRoadmap, javaExpertise, pythonExpertise, javaQuestions, pythonQuestions, aiAnalysis } = survey;
  
  const language = primaryLanguage 
    ? primaryLanguage.charAt(0).toUpperCase() + primaryLanguage.slice(1)
    : 'Java';
  
  const skillLevel = determineSkillLevel(javaExpertise, pythonExpertise, javaQuestions?.score, pythonQuestions?.score);
  
  const phase1Items = learningRoadmap.phase1 || [];
  
  // Ensure Phase 1 has at least 6 items
  if (phase1Items.length < 6) {
    throw new Error(`Phase 1 must have at least 6 items, found ${phase1Items.length}`);
  }

  const aiAnalysisSection = aiAnalysis 
    ? `\n\nAI ANALYSIS:\n${aiAnalysis}\n\nUse this to tailor difficulty, explanations, focus. Address strengths/weaknesses.`
    : '';

  return `Create 6 unique mini projects based on personalized roadmap.

LANGUAGE: ${language} ONLY
All projects MUST be ${language}. Do not mix languages.

LEARNING ROADMAP:

Phase 1 - Foundation:
${learningRoadmap.phase1.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Phase 2 - Building Skills:
${learningRoadmap.phase2.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Phase 3 - Advanced Practice:
${learningRoadmap.phase3.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Language: ${language}
Level: ${skillLevel}${aiAnalysisSection}

GENERATION:
All 6 projects from Phase 1 only.
One project per Phase 1 item:
- Project 1: Based on Phase 1, Item 1 (${phase1Items[0]})
- Project 2: Based on Phase 1, Item 2 (${phase1Items[1]})
- Project 3: Based on Phase 1, Item 3 (${phase1Items[2]})
- Project 4: Based on Phase 1, Item 4 (${phase1Items[3]})
- Project 5: Based on Phase 1, Item 5 (${phase1Items[4]})
- Project 6: Based on Phase 1, Item 6 (${phase1Items[5]})

Each project MUST:
1. Teach the SPECIFIC roadmap concept
2. Single-file console program
3. Use Scanner/input() for interaction
4. Include 3-4 specific requirements

CONSTRAINTS:
- Single .java/.py file only
- Console I/O: Scanner/input()
- No web servers, databases, GUI
- No external libraries
- No file I/O - in-memory only
- All data via console

SKILL: ${skillLevel}
${getSkillLevelGuidance(skillLevel)}
All projects ${skillLevel} level

FORMAT EACH PROJECT:

IMPORTANT: Language field MUST be exactly: ${language}

PROJECT 1:
Title: [Concept] - [App Name]
Description: Teaches [CONCEPT]. [Why important]. [What to build].
Language: ${language}
Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]
- [Specific requirement 4]
Rubrics:
[4-5 criteria, 100 pts total]

EXAMPLE:

PROJECT 1:
Title: Variables - Student Profile
Description: Teaches variables/data types for storing information. Create a program to store and display student data.
Language: ${language}
Requirements:
- Declare 4 variables: name(String), age(int), gpa(double), enrolled(boolean)
- Accept input via Scanner/input()
- Validate age(1-100) and GPA(0.0-4.0)
- Display formatted profile
Rubrics:
- Variables (25pts): Correct declarations
- Input (25pts): Proper usage
- Validation (25pts): Age/GPA checks
- Output (15pts): Clean display
- Code Quality (10pts): Naming

EXAMPLE:

PROJECT 3:
Title: OOP - Book Manager
Description: Teaches OOP with classes/objects for code organization. Create a Book class with properties and methods.
Language: ${language}
Requirements:
- Book class: title, author, pages, isRead
- Methods: displayInfo(), markAsRead()
- ArrayList storing 3+ Book objects
- Menu: Add, Display, Mark Read, Exit
Rubrics:
- Class (25pts): Properties defined
- Methods (25pts): Functions work
- Objects (20pts): ArrayList usage
- Menu (20pts): All options work
- Code (10pts): Structure

REMINDERS:
- Each project teaches specific Phase 1 concept
- All 6 projects Phase 1 only
- Similar difficulty (foundation level)
- Single-file console programs
- No ** in titles
- No file I/O, use in-memory data
- All data via Scanner/input()
- Focus on teaching Phase 1 concepts

REQUIREMENTS:
- 4 unique, specific, measurable requirements per project
- Each different from other projects

RUBRICS:
- 4-5 criteria totaling 100 pts
- Align with requirements

PERSONALIZATION:
- Use AI analysis for difficulty/explanations
- Address student strengths/weaknesses
- Adjust complexity to skill level

CRITICAL: ALL 6 PROJECTS MUST BE IN ${language}. DO NOT GENERATE PYTHON IF LANGUAGE IS JAVA. DO NOT GENERATE JAVA IF LANGUAGE IS PYTHON.

Generate 6 projects, ONE for EACH Phase 1 roadmap item in order:`;
};

const constructPersonalizedPrompt = (survey) => {
  const { primaryLanguage, courseInterest, learningGoals, javaExpertise, pythonExpertise, aiAnalysis, javaQuestions, pythonQuestions } = survey;
  
  const language = primaryLanguage 
    ? primaryLanguage.charAt(0).toUpperCase() + primaryLanguage.slice(1)
    : 'Java';
  
  const skillLevel = determineSkillLevel(javaExpertise, pythonExpertise, javaQuestions?.score, pythonQuestions?.score);
  
  const conceptsMapping = getConceptsForGoal(courseInterest, learningGoals, skillLevel);
  
  const studentSkills = analyzeStudentSkills(primaryLanguage, javaQuestions, pythonQuestions);
  const { strengths, weaknesses } = studentSkills;
  
  const aiAnalysisSection = aiAnalysis 
    ? `\n\nAI ANALYSIS:\n${aiAnalysis}\n\nUse this for student needs, learning style, improvement areas.`
    : '';
  
  return `Create 6 unique mini projects teaching fundamental concepts for student goal.

PROFILE:
Interest: "${courseInterest || 'General Programming'}"
Goals: "${learningGoals || 'Improve skills'}"
Language: ${language}
Level: ${skillLevel}

SKILLS:
Strengths: ${strengths.join(', ')}
Weaknesses: ${weaknesses.join(', ')}${aiAnalysisSection}

STRATEGY:
1. Build on strengths (${strengths.slice(0, 2).join(', ')})
2. Address weaknesses (${weaknesses.slice(0, 2).join(', ')})
3. Progress from known to new concepts
4. Target one weakness per project

KEY: Single-file console compiler.
Create console projects teaching concepts foundational to "${courseInterest || 'programming'}".

CONCEPTS FOR "${courseInterest || 'programming'}":
${conceptsMapping}

APPROACH:
- Not HTTP server → Inheritance System (teach concepts for web frameworks)
- Not Database CRUD → Record Manager (teach collections)
- Not React component → State Manager (teach objects/state)
- Not File Log Viewer → Entry Manager (teach arrays/structures)

PERSONALIZATION:
1. Each project teaches a DIFFERENT concept
2. Concept is RELEVANT to "${courseInterest || 'programming'}"
3. Explain WHY it matters for their goal
4. Single-file console programs
5. Use Scanner/input()
6. 4-6 unique requirements per project

CONCEPTS (${skillLevel}):
${getConcepts(skillLevel)}

DIVERSITY:
P1: ${conceptsMapping.split('\n')[0]}
P2: ${conceptsMapping.split('\n')[1] || 'File ops'}
P3: ${conceptsMapping.split('\n')[2] || 'Data structures'}
P4: ${conceptsMapping.split('\n')[3] || 'Error handling'}
P5: ${conceptsMapping.split('\n')[4] || 'Algorithms'}
P6: ${conceptsMapping.split('\n')[5] || 'OOP design'}

CONSTRAINTS:
- Single .java/.py file
- Console I/O: Scanner/input()
- No web servers, databases, GUI
- No external libraries
- No file I/O - in-memory only
- All data via console

SKILL: ${skillLevel}
${getSkillLevelGuidance(skillLevel)}
All projects exactly ${skillLevel} level.

${getSkillLevelExamples(skillLevel, courseInterest)}

No easier/harder projects. Match ${skillLevel} exactly.

FORMAT EACH PROJECT:

PROJECT 1:
Title: [Concept] - [Application]
Description: Teaches [CONCEPT] essential for ${courseInterest || 'programming'}. [How used in field]. Create console program [what to build]. [Why it matters].
Language: ${language}
Requirements:
- [Specific requirement 1]
- [Measurable requirement 2]
- [User interaction requirement 3]
- [Expected behavior requirement 4]
Sample Output:
[Console interaction example]
Rubrics:
[Criteria, 100 pts total]

EXAMPLE (Web Dev):

PROJECT 1:
Title: Inheritance - Request Handler
Description: Teaches inheritance for web dev. Web frameworks use inheritance for request handlers (GET, POST) with shared behavior. Create console program simulating request handling. Understand how frameworks organize code.
Language: Java
Requirements:
- Abstract RequestHandler: timestamp, statusCode, processRequest()
- GetHandler extends RequestHandler with retrieve()
- PostHandler extends RequestHandler with create()
- Store 3+ handlers in ArrayList
- Scanner menu (1=GET, 2=POST, 3=Exit)
- Demonstrate polymorphism
Sample Output:
=== Request Handler ===
1. GET 2. POST 3. Exit
Choice: 1
Path: /users
[GET] /users
Status: 200 OK
Rubrics:
- Base Class (20pts): RequestHandler proper
- Inheritance (25pts): Child classes correct
- Polymorphism (20pts): Demonstrated
- Behaviors (15pts): Distinct functionality
- Menu (10pts): Working input
- Structure (10pts): Clean OOP

EXAMPLE (Data Analytics):

PROJECT 1:
Title: Collections - Records Manager
Description: Teaches Collections for data analytics. Data systems use ArrayList/HashMap for efficient storage. Create console program managing student records. Understand data organization.
Language: Java
Requirements:
- Student class: id, name, grade
- ArrayList<Student> for records
- HashMap<Integer, Student> for indexing
- Methods: addStudent(), searchById(), calculateStatistics()
- Scanner menu with grade validation (0-100)
Sample Output:
=== Records Manager ===
1. Add 2. Search 3. Display 4. Stats 5. Exit
Choice: 1
ID: 1001
Name: Juan
Grade: 85
Added!
Rubrics:
- ArrayList (20pts): Proper usage
- HashMap (20pts): Indexing correct
- CRUD (25pts): Operations work
- Statistics (20pts): Calculations accurate
- Menu (10pts): Functional
- Code (5pts): Clean

REMINDERS:
- Connect projects to "${courseInterest || 'programming'}"
- Teach relevant concepts for their goal
- Each project completely different
- Single-file console programs
- Explain WHY concept matters
- Show console interaction
- All ${skillLevel} level
- No ** in titles
- No file I/O, use in-memory data
- All data via Scanner/input()

REQUIREMENTS:
- 4-7 unique, specific, measurable requirements per project
- Describe exact implementation details
- Each project must be completely different

RUBRICS:
- Clear grading criteria, 100 pts total
- Align with requirements
- Assess technical implementation and concept understanding

PERSONALIZATION:
- Use AI analysis for learning style
- Address identified strengths/weaknesses
- Adjust complexity to skill level

SKILL-BASED:
- 2 projects strengthening: ${strengths.slice(0, 2).join(' and ')}
- 4 projects improving: ${weaknesses.join(', ')}
- Practical and relevant to ${courseInterest || 'programming'}
- Progress in difficulty

Generate 6 SKILL-BASED, CONCEPT-FOCUSED projects for ${courseInterest || 'programming'}:`;
};

const getConceptsForGoal = (interest, goals, skillLevel) => {
  const text = `${interest || ''} ${goals || ''}`.toLowerCase();
  
  if (text.includes('web') || text.includes('website') || text.includes('html')) {
    if (skillLevel === 'Beginner') {
      return `- OOP basics (web frameworks)
- Arrays/Lists (data management)
- String manipulation (form processing)
- Loops/conditionals (validation)
- Methods/functions (code organization)
- Console menus (UI simulation)`;
    } else if (skillLevel === 'Intermediate') {
      return `- Inheritance (MVC controllers)
- Interfaces/Polymorphism (dependency injection)
- Collections/Maps (sessions, caching)
- Exception handling (error handling)
- String parsing (HTTP requests)
- Data structures (routing)`;
    } else {
      return `- Patterns (Factory/Singleton)
- Advanced OOP (framework design)
- Data structures (routing/middleware)
- Algorithm optimization (performance)
- State management
- Advanced collections (caching)`;
    }
  }
  
  if (text.includes('game') || text.includes('gaming')) {
    if (skillLevel === 'Beginner') {
      return `- Variables/types (player stats)
- Loops (game loops)
- Conditionals (game rules)
- Arrays (items/enemies)
- Functions (actions)
- Random numbers (mechanics)`;
    } else if (skillLevel === 'Intermediate') {
      return `- OOP design (entities)
- Inheritance (character types)
- Collision detection (2D logic)
- State management (game states)
- Data structures (inventory)
- Event handling (input)`;
    } else {
      return `- AI algorithms (pathfinding)
- Patterns (State/Observer)
- Performance optimization
- Advanced structures (quad trees)
- Procedural generation
- Complex mechanics (physics)`;
    }
  }
  
  if (text.includes('data') || text.includes('analytics') || text.includes('database')) {
    if (skillLevel === 'Beginner') {
      return `- Arrays/Lists (data storage)
- Loops (record processing)
- String parsing (data formatting)
- Variables (calculations)
- Simple sorting (organization)
- Console input (data entry)`;
    } else if (skillLevel === 'Intermediate') {
      return `- Collections (data management)
- Sorting algorithms
- Search algorithms (querying)
- Data validation
- Aggregation (statistics)
- Indexing structures`;
    } else {
      return `- Advanced structures (trees/graphs)
- Algorithm optimization
- Indexing algorithms
- Query optimization
- Advanced collections (caching)
- Statistical algorithms`;
    }
  }
  
  if (text.includes('ai') || text.includes('machine learning') || text.includes('ml')) {
    if (skillLevel === 'Beginner') {
      return `- Arrays (vectors/matrices)
- Loops (data iteration)
- Math operations
- Conditionals (decisions)
- Functions (code organization)
- Random numbers`;
    } else if (skillLevel === 'Intermediate') {
      return `- Matrix operations (neural nets)
- Statistical algorithms (mean/variance)
- Pattern matching
- Data structures (datasets)
- File I/O (training data)
- Classification algorithms`;
    } else {
      return `- Algorithms (gradient descent)
- Advanced structures (trees)
- Optimization algorithms
- Statistical methods
- Neural network basics
- Performance optimization`;
    }
  }
  
  if (text.includes('mobile') || text.includes('app')) {
    if (skillLevel === 'Beginner') {
      return `- OOP basics (app components)
- Arrays/Lists (app data)
- String handling (input)
- Validation logic (forms)
- Functions (button actions)
- State variables (tracking)`;
    } else if (skillLevel === 'Intermediate') {
      return `- OOP design (activities/fragments)
- State management (lifecycle)
- Event handling (interactions)
- Collections (lists/adapters)
- Validation patterns (forms)
- UI data structures`;
    } else {
      return `- Patterns (MVC/MVVM)
- Advanced state management
- Efficient UI structures
- Performance optimization
- Architecture patterns
- Advanced collections (caching)`;
    }
  }
  
  return `- OOP fundamentals
- Data structures (arrays/lists/maps)
- File I/O operations
- Error handling, validation
- Algorithms (sorting/searching)
- Code organization`;
};

const getConcepts = (skillLevel) => {
  if (skillLevel === 'Beginner') {
    return `- Variables, data types
- Loops (for/while)
- Conditionals (if-else/switch)
- Arrays, collections
- Functions, methods
- Console I/O`;
  } else if (skillLevel === 'Intermediate') {
    return `- Inheritance, polymorphism
- Interfaces, abstract classes
- Collections (List/Set/Map)
- Exception handling
- Sorting, searching
- String manipulation`;
  } else {
    return `- Design patterns (Factory/Singleton/Observer)
- Advanced OOP
- Complex structures (trees/graphs/heaps)
- Algorithm optimization
- Recursion, dynamic programming
- Advanced collections, generics`;
  }
};

const getSkillLevelExamples = (level, interest) => {
  const interestText = (interest || '').toLowerCase();
  const isWeb = interestText.includes('web');
  const isGame = interestText.includes('game');
  const isData = interestText.includes('data') || interestText.includes('analytics');
  
  if (level === 'Beginner') {
    if (isWeb) {
      return `- Simple inheritance: User -> AdminUser
- Basic Scanner, if-else logic
- No interfaces/abstract classes
- Focus: understand inheritance`;
    } else if (isGame) {
      return `- Basic Character: Health/Attack
- Simple variables, methods
- if-else for game logic
- No complex patterns`;
    } else if (isData) {
      return `- Arrays: store numbers, calculate average
- Basic loops for processing
- Built-in sorting
- Focus: arrays, basic ops`;
    }
    return `- Simple: variables, loops, conditionals
- Clear logic
- No complex structures`;
  }
  
  if (level === 'Intermediate') {
    if (isWeb) {
      return `- Inheritance: RequestHandler + interfaces
- HashMap sessions, ArrayList queue
- Exception handling (try-catch)
- Polymorphism with arrays`;
    } else if (isGame) {
      return `- Character system: Warrior/Mage/Archer
- ArrayList inventory, HashMap stats
- State management
- Collision detection`;
    } else if (isData) {
      return `- HashMap indexing, ArrayList records
- Sorting algorithms
- File I/O for CSV
- Statistics: mean, median, std dev`;
    }
    return `- OOP: inheritance, interfaces, polymorphism
- Collections, data structures
- Error handling, file ops`;
  }
  
  if (isWeb) {
    return `- Patterns: Factory, Singleton
- Generics, lambdas
- Middleware chain
- Thread-safe sessions, pooling`;
  } else if (isGame) {
    return `- Patterns: State, Observer, Command
- A* pathfinding
- Quad-tree collision
- Advanced AI, decision trees`;
  } else if (isData) {
    return `- B-tree indexing, heaps
- MapReduce, query optimization
- Stream processing
- Big O analysis`;
  }
  return `- Design patterns, algorithms
- Complex data structures
- Optimization, architecture`;
};

const getSkillLevelGuidance = (level) => {
  if (level === 'Beginner') {
    return `BEGINNER:
- Simple variables, basic I/O
- if-else, loops (for/while)
- Straightforward logic
- No complex algorithms
- Foundational concepts`;
  }
  
  if (level === 'Intermediate') {
    return `INTERMEDIATE:
- Inheritance, interfaces
- Collections (ArrayList, HashMap)
- Moderate algorithms
- Exception handling
- Practical OOP`;
  }
  
  return `ADVANCED:
- Design patterns
- Advanced data structures
- Complex algorithms
- Recursion, optimization
- Advanced OOP architecture`;
};

const analyzeStudentSkills = (primaryLanguage, javaQuestions, pythonQuestions) => {
  const strengths = [];
  const weaknesses = [];
  
  const score = primaryLanguage === 'java' ? javaQuestions?.score : pythonQuestions?.score;
  
  if (!score) {
    return {
      strengths: ['basic programming concepts', 'problem solving'],
      weaknesses: ['programming fundamentals', 'syntax', 'algorithms']
    };
  }
  
  if (score.easy >= 2) {
    strengths.push('basic syntax and fundamentals');
    strengths.push('simple data types and variables');
  } else {
    weaknesses.push('basic syntax');
    weaknesses.push('fundamental concepts');
  }
  
  if (score.medium >= 2) {
    strengths.push('object-oriented programming');
    strengths.push('data structures');
  } else {
    weaknesses.push('OOP concepts (classes, objects)');
    weaknesses.push('working with collections');
  }
  
  if (score.hard >= 2) {
    strengths.push('advanced algorithms');
    strengths.push('complex problem solving');
  } else {
    weaknesses.push('advanced programming patterns');
    weaknesses.push('algorithm implementation');
  }
  
  return { strengths, weaknesses };
};

const determineSkillLevel = (javaExpertise, pythonExpertise, javaScore, pythonScore) => {
  const scores = [];
  
  if (javaScore?.percentage) scores.push(javaScore.percentage);
  if (pythonScore?.percentage) scores.push(pythonScore.percentage);
  
  console.log(`[SkillLevel] Java expertise: ${javaExpertise}, Python expertise: ${pythonExpertise}`);
  console.log(`[SkillLevel] Java score: ${javaScore?.percentage}%, Python score: ${pythonScore?.percentage}%`);
  
  if (scores.length === 0) {
    if (javaExpertise === 'expert' || pythonExpertise === 'expert') {
      console.log(`[SkillLevel] Determined: Advanced (based on self-assessment)`);
      return 'Advanced';
    }
    if (javaExpertise === 'intermediate' || pythonExpertise === 'intermediate') {
      console.log(`[SkillLevel] Determined: Intermediate (based on self-assessment)`);
      return 'Intermediate';
    }
    console.log(`[SkillLevel] Determined: Beginner (based on self-assessment)`);
    return 'Beginner';
  }
  
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`[SkillLevel] Average quiz score: ${avgScore.toFixed(1)}%`);
  
  if (avgScore >= 70) {
    console.log(`[SkillLevel] Determined: Advanced (quiz score >= 70%)`);
    return 'Advanced';
  }
  if (avgScore >= 40) {
    console.log(`[SkillLevel] Determined: Intermediate (quiz score >= 40%)`);
    return 'Intermediate';
  }
  console.log(`[SkillLevel] Determined: Beginner (quiz score < 40%)`);
  return 'Beginner';
};

const parseProjectsFromAI = (text) => {
  const projects = [];
  const projectMatches = text.split(/PROJECT \d+:/i).filter(p => p.trim());
  
  console.log(`[ProjectGen-Parse] Found ${projectMatches.length} potential project blocks`);
  
  for (const projectText of projectMatches) {
    try {
      const titleMatch = projectText.match(/\*\*Title:\*\*\s*(.+?)(?=\n)/i);
      const descMatch = projectText.match(/\*\*Description:\*\*\s*(.+?)(?=\n\*\*Language:)/is);
      const langMatch = projectText.match(/\*\*Language:\*\*\s*(.+?)(?=\n)/i);
      const reqMatch = projectText.match(/\*\*Requirements:\*\*\s*([\s\S]+?)(?=\n\*\*Rubrics:)/i);
      const rubricsMatch = projectText.match(/\*\*Rubrics:\*\*\s*([\s\S]+?)(?=\n\n|PROJECT|$)/i);
      
      if (titleMatch && descMatch && langMatch) {
        let title = titleMatch[1].trim();
        title = title.replace(/^\*\*|\*\*$/g, '');
        title = title.replace(/^["']|["']$/g, '');
        title = title.trim();
        
        const requirements = reqMatch 
          ? reqMatch[1].split('\n').filter(r => r.trim().startsWith('-')).join('\n')
          : '';
        
        const rubrics = rubricsMatch
          ? rubricsMatch[1].split('\n').filter(r => r.trim().startsWith('-')).join('\n').trim()
          : '';
        
        console.log(`[ProjectGen-Parse] Project "${title}" fields: Req=${!!reqMatch}, Rubrics=${!!rubricsMatch}`);
        
        projects.push({
          title: title,
          description: descMatch[1].trim().replace(/\n/g, ' '),
          language: langMatch[1].trim(),
          requirements: requirements.trim(),
          rubrics: rubrics
        });
        console.log(`[ProjectGen-Parse] Successfully parsed project: ${title}`);
      } else {
        console.log(`[ProjectGen-Parse] Failed to parse project - missing fields. Title: ${!!titleMatch}, Desc: ${!!descMatch}, Lang: ${!!langMatch}`);
        if (!descMatch) {
          console.log(`[ProjectGen-Parse] Description section:`, projectText.substring(projectText.indexOf('Description'), projectText.indexOf('Description') + 300));
        }
        if (!titleMatch) console.log(`[ProjectGen-Parse] Title match failed for text:`, projectText.substring(0, 200));
      }
    } catch (error) {
      console.error('[ProjectGen-Parse] Error parsing project:', error.message);
    }
  }
  
  return projects;
};