import { HfInference } from '@huggingface/inference';
import Survey from '../models/Survey.js';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_NAME = 'Qwen/Qwen2.5-Coder-7B-Instruct';

const hf = HUGGINGFACE_API_KEY ? new HfInference(HUGGINGFACE_API_KEY) : null;

export const generateWeeklyProjects = async (userId) => {
  try {
    if (!HUGGINGFACE_API_KEY || !hf) {
      console.error('Hugging Face API key is not configured');
      return generateFallbackProjects(userId);
    }

    const survey = await Survey.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!survey) {
      console.error(`No survey found for user ${userId}`);
      return [];
    }

    const skillLevel = determineSkillLevel(
      survey.javaExpertise, 
      survey.pythonExpertise, 
      survey.javaQuestions?.score, 
      survey.pythonQuestions?.score
    );
    
    console.log(`[ProjectGen] ========== GENERATING PROJECTS ==========`);
    console.log(`[ProjectGen] User ID: ${userId}`);
    console.log(`[ProjectGen] Interest: ${survey.courseInterest}`);
    console.log(`[ProjectGen] Goals: ${survey.learningGoals}`);
    console.log(`[ProjectGen] Skill Level: ${skillLevel}`);
    console.log(`[ProjectGen] AI Analysis: ${survey.aiAnalysis?.substring(0, 100)}...`);
    console.log(`[ProjectGen] ===========================================`);
    
    const prompt = constructPersonalizedPrompt(survey);
    
    try {
      const response = await hf.chatCompletion({
        model: MODEL_NAME,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.9
      });

      const projectsText = response.choices[0].message.content;
      const projects = parseProjectsFromAI(projectsText);

      if (projects.length < 6) {
        console.error(`Only generated ${projects.length} projects, expected 6`);
        return projects.length > 0 ? projects : generateFallbackProjects(userId);
      }

      console.log(`[ProjectGen] Successfully generated ${projects.length} personalized projects`);
      return projects.slice(0, 6);
    } catch (apiError) {
      console.error('[ProjectGen] API Error:', apiError.message);
      if (apiError.httpResponse?.status === 429 || apiError.message.includes('HTTP error')) {
        console.log('[ProjectGen] Using fallback projects due to API unavailability');
        return generateFallbackProjects(userId);
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Generate projects error:', error);
    return generateFallbackProjects(userId);
  }
};

const constructPersonalizedPrompt = (survey) => {
  const { primaryLanguage, courseInterest, learningGoals, javaExpertise, pythonExpertise, aiAnalysis } = survey;
  
  const languages = primaryLanguage && primaryLanguage.length > 0 
    ? primaryLanguage.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(' and ') 
    : 'Java';
  
  const allowedLanguages = primaryLanguage && primaryLanguage.length > 0
    ? primaryLanguage.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(' or ')
    : 'Java';
  
  const skillLevel = determineSkillLevel(javaExpertise, pythonExpertise, survey.javaQuestions?.score, survey.pythonQuestions?.score);
  
  const conceptsMapping = getConceptsForGoal(courseInterest, learningGoals, skillLevel);

  return `You are creating 6 UNIQUE mini programming projects that teach FUNDAMENTAL PROGRAMMING CONCEPTS needed for the student's goal.

STUDENT PROFILE:
Student Interest: "${courseInterest}"
Student Goals: "${learningGoals}"
AI Analysis: ${aiAnalysis || 'No analysis available'}
Primary Languages: ${languages}
Skill Level: ${skillLevel}

CRITICAL UNDERSTANDING:
The student wants to learn "${courseInterest}", but we have a SINGLE FILE CONSOLE COMPILER with ONE code editor and ONE output window.

Therefore, create CONSOLE PROJECTS that teach PROGRAMMING CONCEPTS that are foundational to "${courseInterest}".

CONCEPT MAPPING FOR "${courseInterest}":
${conceptsMapping}

PROJECT APPROACH:
Instead of: "Build an HTTP server" (impossible - needs web server)
Create: "Employee Inheritance System - Learn inheritance which web frameworks use for request handlers"

Instead of: "Database CRUD app" (impossible - needs database)
Create: "Student Record Manager - Learn collections which databases use internally"

Instead of: "React component" (impossible - needs React)
Create: "Component State Manager - Learn objects and state which React uses"

Instead of: "Log Viewer reading from file" (impossible - needs file system)
Create: "Log Entry Manager - Learn arrays and data structures used in logging systems"

PERSONALIZATION REQUIREMENTS:
1. Each project teaches a DIFFERENT programming concept
2. Each concept is RELEVANT to "${courseInterest}"
3. Explain WHY this concept matters for their goal
4. All projects are SINGLE FILE console programs
5. Use Scanner (Java) or input() (Python) for user interaction

6 DIFFERENT CONCEPTS TO TEACH (choose from based on interest):
${getConcepts(skillLevel)}

PROJECT DIVERSITY (Each must be UNIQUE):
Project 1: ${conceptsMapping.split('\n')[0]}
Project 2: ${conceptsMapping.split('\n')[1] || 'File operations'}
Project 3: ${conceptsMapping.split('\n')[2] || 'Data structures'}
Project 4: ${conceptsMapping.split('\n')[3] || 'Error handling'}
Project 5: ${conceptsMapping.split('\n')[4] || 'Algorithm practice'}
Project 6: ${conceptsMapping.split('\n')[5] || 'Object-oriented design'}

TECHNICAL CONSTRAINTS:
- SINGLE FILE ONLY - One .java or .py file
- CONSOLE INPUT/OUTPUT - Scanner (Java) or input() (Python)
- NO WEB SERVERS - No servlets, JSP, Flask, Django
- NO DATABASES - Use arrays/lists to store data
- NO GUI - Text-based console only
- NO EXTERNAL LIBRARIES - Use standard library only
- NO FILE I/O - No reading/writing files (use in-memory data only)
- NO FILE UPLOAD/DOWNLOAD - All data must be entered via console
- NO EXTERNAL FILES - Everything must be in one code file

CRITICAL SKILL LEVEL REQUIREMENT:
Student Skill Level: ${skillLevel}
${getSkillLevelGuidance(skillLevel)}

ALL 6 PROJECTS MUST BE AT EXACTLY ${skillLevel} LEVEL - NO EXCEPTIONS

This means:
${getSkillLevelExamples(skillLevel, courseInterest)}

IMPORTANT: Do NOT create easier projects "to warm up" or harder projects "to challenge". EVERY project must match their ${skillLevel} ability exactly.

FORMAT EACH PROJECT:

PROJECT 1:
Title: [Concept Name + Application] (e.g., "Inheritance - User Account System")
Description: This project teaches [CONCEPT] which is essential for ${courseInterest}. In ${courseInterest}, [explain how concept is used]. You will create a console program that [what they build]. This helps you understand [why it matters for their goal].
Language: ${allowedLanguages}
Requirements:
- [Requirement focused on the programming concept]
- [Requirement showing practical application]
- [Requirement for user interaction]
- [Requirement for demonstration]
Sample Output:
[Show realistic console interaction demonstrating the concept]

EXAMPLE FOR WEB DEVELOPMENT STUDENT:

PROJECT 1:
Title: Inheritance - Request Handler System
Description: This project teaches inheritance which is essential for Web Development. In web frameworks like Spring Boot, inheritance is used to create different types of request handlers (GET, POST, PUT, DELETE) that share common behavior. You will create a console program that simulates a request handling system using inheritance. This helps you understand how web frameworks organize code and handle different HTTP methods.
Language: Java
Requirements:
- Create a base RequestHandler class with common properties (timestamp, status)
- Create child classes (GetHandler, PostHandler) that inherit from RequestHandler
- Each handler type should have unique behavior
- Demonstrate polymorphism by processing different request types
- Use console input to simulate incoming requests
Sample Output:
=== Request Handler System ===
1. Process GET request
2. Process POST request
3. Exit
Enter choice: 1
Enter resource path: /users
[GET] Processing request for /users
Status: 200 OK
Timestamp: 2025-11-15 10:30:45
Data retrieved successfully

EXAMPLE FOR DATA ANALYTICS STUDENT:

PROJECT 1:
Title: Collections - Student Records Manager
Description: This project teaches Collections which are essential for Data Analytics. In data systems, collections like ArrayList and HashMap are used to store and manage records efficiently. You will create a console program that manages student records using collections. This helps you understand how databases and analytics tools organize data internally.
Language: Java
Requirements:
- Use ArrayList to store multiple student records
- Use HashMap to index students by ID for fast lookup
- Implement add, search, and display operations
- Calculate statistics (average grade, highest score)
- All data entered through console (no file reading)
Sample Output:
=== Student Records Manager ===
1. Add student
2. Search by ID
3. Display all
4. Calculate average grade
5. Exit
Enter choice: 1
Enter student ID: 1001
Enter name: Juan Dela Cruz
Enter grade: 85
Student added successfully!

Enter choice: 4
Average grade: 85.0
Total students: 1

IMPORTANT REMINDERS:
- Connect EVERY project to "${courseInterest}"
- Teach programming concepts that matter for their goal
- Each project must be completely different
- All single-file console programs
- Include clear explanation of WHY this concept matters
- Show realistic console interaction
- All at ${skillLevel} level
- DO NOT use asterisks ** in titles
- NO FILE I/O OPERATIONS - Use in-memory data only (arrays, lists, maps)
- NO FILE READING/WRITING - All data via Scanner/input()
- Users enter data through console, not files

Generate 6 CONCEPT-FOCUSED projects for ${courseInterest}:`;
};

const getConceptsForGoal = (interest, goals, skillLevel) => {
  const text = `${interest} ${goals}`.toLowerCase();
  
  if (text.includes('web') || text.includes('website') || text.includes('html')) {
    if (skillLevel === 'Beginner') {
      return `- Object-Oriented Programming basics (used in all web frameworks)
- Arrays and Lists (used to manage data in web apps)
- String manipulation (used for processing form inputs)
- Loops and conditionals (used for validation logic)
- Methods and functions (used to organize web app code)
- Simple console menus (simulating user interfaces)`;
    } else if (skillLevel === 'Intermediate') {
      return `- Inheritance (used in Spring MVC controllers and request handlers)
- Interfaces and Polymorphism (used in service layers and dependency injection)
- Collections and Maps (used for session management and caching)
- Exception handling (used for error handling in web apps)
- String parsing and validation (used for processing HTTP requests)
- Data structures for routing (HashMaps for URL mapping)`;
    } else {
      return `- Design Patterns (Factory, Singleton used in Spring framework)
- Advanced OOP (Abstract classes used in framework design)
- Data structures (HashMaps used for routing and middleware)
- Algorithm optimization (used in web app performance tuning)
- State management patterns (used in web applications)
- Advanced collections (used for caching and session management)`;
    }
  }
  
  if (text.includes('game') || text.includes('gaming')) {
    if (skillLevel === 'Beginner') {
      return `- Variables and data types (used for player stats and scores)
- Loops (used for game loops and repeated actions)
- Conditionals (used for game rules and logic)
- Arrays (used for storing game items and enemies)
- Basic functions (used for game actions like attack, defend)
- Random numbers (used for game mechanics and chance)`;
    } else if (skillLevel === 'Intermediate') {
      return `- Object-oriented design (used for game entities like Player, Enemy)
- Inheritance (used for different character types)
- Collision detection algorithms (used in 2D game logic)
- State management (used for game states like menu, playing, game over)
- Data structures (used for inventory and maps)
- Event handling patterns (used for player input)`;
    } else {
      return `- Game AI algorithms (pathfinding, decision trees)
- Design patterns (State pattern for game states, Observer for events)
- Performance optimization (efficient collision detection)
- Advanced data structures (quad trees for spatial partitioning)
- Procedural generation algorithms
- Complex game mechanics (physics, combat systems)`;
    }
  }
  
  if (text.includes('data') || text.includes('analytics') || text.includes('database')) {
    if (skillLevel === 'Beginner') {
      return `- Arrays and Lists (foundation for data storage)
- Loops (used for processing multiple records)
- String parsing (used for data input and formatting)
- Variables (used for data calculations)
- Simple sorting (used for organizing data)
- Console input (simulating data entry)`;
    } else if (skillLevel === 'Intermediate') {
      return `- Collections (ArrayList, HashMap used in data management)
- Sorting algorithms (used for data organization)
- Search algorithms (used for querying data)
- Data validation (used for ensuring data quality)
- Aggregation logic (used for calculating statistics)
- Data structures for indexing (used in databases)`;
    } else {
      return `- Advanced data structures (trees, graphs for complex queries)
- Algorithm optimization (efficient searching and sorting)
- Indexing algorithms (used in database internals)
- Query optimization patterns
- Advanced collections (used for data caching)
- Statistical algorithms (used in analytics)`;
    }
  }
  
  if (text.includes('ai') || text.includes('machine learning') || text.includes('ml')) {
    if (skillLevel === 'Beginner') {
      return `- Arrays (foundation for vectors and matrices)
- Loops (used for iterating over data)
- Basic math operations (used in calculations)
- Conditionals (used for decision making)
- Functions (used for organizing ML code)
- Random numbers (used for initialization)`;
    } else if (skillLevel === 'Intermediate') {
      return `- Matrix operations (foundation of neural networks)
- Statistical algorithms (mean, variance used in ML)
- Pattern matching algorithms
- Data structures for ML (arrays, lists for datasets)
- File I/O (loading training data)
- Basic classification algorithms`;
    } else {
      return `- Algorithm implementation (gradient descent, backpropagation)
- Advanced data structures (trees for decision making)
- Optimization algorithms
- Statistical methods (probability, distributions)
- Neural network basics (perceptron, activation functions)
- Performance optimization for ML`;
    }
  }
  
  if (text.includes('mobile') || text.includes('app')) {
    if (skillLevel === 'Beginner') {
      return `- Object-oriented basics (used for app components)
- Arrays and Lists (used for app data)
- String handling (used for user input)
- Validation logic (used for forms)
- Basic functions (used for button actions)
- State variables (used for tracking app state)`;
    } else if (skillLevel === 'Intermediate') {
      return `- Object-oriented design (used for activities and fragments)
- State management (used for app lifecycle)
- Event handling (used for user interactions)
- Collections (used for lists and adapters)
- Validation patterns (used in forms)
- Data structures for UI (used in mobile apps)`;
    } else {
      return `- Design patterns (MVC, MVVM used in mobile apps)
- Advanced state management (handling complex app states)
- Data structures for efficient UI (RecyclerView patterns)
- Performance optimization (efficient data loading)
- Architecture patterns (clean architecture)
- Advanced collections (used for caching)`;
    }
  }
  
  return `- Object-oriented programming fundamentals
- Data structures (arrays, lists, maps)
- File input/output operations
- Error handling and validation
- Algorithm practice (sorting, searching)
- Code organization and functions`;
};

const getConcepts = (skillLevel) => {
  if (skillLevel === 'Beginner') {
    return `- Variables and data types
- Loops (for, while)
- Conditionals (if-else, switch)
- Arrays and basic collections
- Functions and methods
- Console input/output`;
  } else if (skillLevel === 'Intermediate') {
    return `- Inheritance and polymorphism
- Interfaces and abstract classes
- Collections (List, Set, Map)
- Exception handling
- Sorting and searching algorithms
- String manipulation and parsing`;
  } else {
    return `- Design patterns (Factory, Singleton, Observer)
- Advanced OOP (abstraction, encapsulation)
- Complex data structures (trees, graphs, heaps)
- Algorithm optimization
- Recursion and dynamic programming
- Advanced collections and generics`;
  }
};

const getSkillLevelExamples = (level, interest) => {
  const interestText = interest.toLowerCase();
  const isWeb = interestText.includes('web');
  const isGame = interestText.includes('game');
  const isData = interestText.includes('data') || interestText.includes('analytics');
  
  if (level === 'Beginner') {
    if (isWeb) {
      return `- Inheritance Example: Simple two-level hierarchy (User -> AdminUser with basic properties)
- Use basic Scanner input, simple if-else logic
- No interfaces, no abstract classes yet
- Focus on understanding "what is inheritance" not complex design`;
    } else if (isGame) {
      return `- Inheritance Example: Basic Character with Health/Attack (Character -> Enemy)
- Use simple variables and methods
- Basic game logic with if-else for attacks
- No complex state machines or patterns yet`;
    } else if (isData) {
      return `- Arrays Example: Store list of numbers, calculate average
- Use basic loops (for, while) to process data
- Simple sorting with built-in methods
- Focus on understanding arrays and basic operations`;
    }
    return `- Use simple concepts: variables, loops, conditionals
- Keep logic straightforward and clear
- No complex structures or algorithms`;
  }
  
  if (level === 'Intermediate') {
    if (isWeb) {
      return `- Inheritance Example: RequestHandler hierarchy with interfaces (Handleable interface, base class, multiple child classes)
- Use HashMap for session data, ArrayList for request queue
- Include proper exception handling (try-catch)
- Demonstrate polymorphism with handler arrays`;
    } else if (isGame) {
      return `- Inheritance Example: Complete character system (Character -> Warrior/Mage/Archer with unique abilities)
- Use ArrayList for inventory, HashMap for stats
- Implement state management (Idle, Moving, Attacking)
- Include collision detection algorithms`;
    } else if (isData) {
      return `- Collections Example: HashMap for data indexing, ArrayList for records
- Implement sorting algorithms (quicksort, mergesort)
- File I/O for CSV reading/writing
- Statistical calculations (mean, median, standard deviation)`;
    }
    return `- Use OOP concepts: inheritance, interfaces, polymorphism
- Work with collections and data structures
- Include error handling and file operations`;
  }
  
  // Advanced
  if (isWeb) {
    return `- Design Patterns Example: Factory pattern for creating different handler types, Singleton for configuration
- Use generics with collections, lambda expressions
- Implement middleware chain pattern
- Advanced concepts: thread-safe session management, request pooling`;
  } else if (isGame) {
    return `- Advanced Example: Complete game engine with design patterns (State, Observer, Command)
- Implement A* pathfinding algorithm
- Quad-tree spatial partitioning for collision
- Advanced AI with decision trees`;
  } else if (isData) {
    return `- Advanced Structures: Implement B-tree for indexing, heap for priority queues
- Complex algorithms: MapReduce simulation, query optimization
- Stream processing with functional programming
- Performance analysis and Big O complexity`;
  }
  return `- Use design patterns and advanced algorithms
- Implement complex data structures from scratch
- Focus on optimization and architectural design`;
};

const getSkillLevelGuidance = (level) => {
  if (level === 'Beginner') {
    return `BEGINNER LEVEL GUIDANCE:
- Use simple variables, basic input/output
- Focus on if-else, loops (for, while)
- Keep logic straightforward
- No complex algorithms
- Clear step-by-step flow
- Teach foundational concepts
Examples: Simple calculator with object properties, Array sorter with different methods`;
  }
  
  if (level === 'Intermediate') {
    return `INTERMEDIATE LEVEL GUIDANCE:
- Use inheritance and interfaces
- Work with collections (ArrayList, HashMap)
- Implement moderate algorithms
- File reading/writing operations
- Exception handling with try-catch
- Demonstrate practical OOP concepts
Examples: Inheritance hierarchy for different types, Collection management system`;
  }
  
  return `ADVANCED LEVEL GUIDANCE:
- Implement design patterns
- Use advanced data structures
- Complex algorithm implementations
- Recursion and optimization
- Advanced OOP architecture
- Performance considerations
Examples: Factory pattern implementation, Recursive tree structures`;
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
  
  for (const projectText of projectMatches) {
    try {
      const titleMatch = projectText.match(/Title:\s*(.+?)(?:\n|$)/i);
      const descMatch = projectText.match(/Description:\s*(.+?)(?:\n(?:Language|Requirements|Sample Output|PROJECT))/is);
      const langMatch = projectText.match(/Language:\s*(.+?)(?:\n|$)/i);
      const reqMatch = projectText.match(/Requirements:\s*([\s\S]+?)(?:\n(?:Sample Output|PROJECT)|$)/i);
      const sampleMatch = projectText.match(/Sample Output:\s*([\s\S]+?)(?:\n\n|PROJECT|$)/i);
      
      if (titleMatch && descMatch && langMatch) {
        let title = titleMatch[1].trim();
        title = title.replace(/^\*\*|\*\*$/g, '');
        title = title.replace(/^["']|["']$/g, '');
        title = title.trim();
        
        const requirements = reqMatch 
          ? reqMatch[1].split('\n').filter(r => r.trim().startsWith('-')).join('\n')
          : '';
        
        const sampleOutput = sampleMatch 
          ? sampleMatch[1].trim()
          : '';
        
        projects.push({
          title: title,
          description: descMatch[1].trim().replace(/\n/g, ' '),
          language: langMatch[1].trim(),
          requirements: requirements.trim(),
          sampleOutput: sampleOutput
        });
      }
    } catch (error) {
      console.error('Error parsing project:', error);
    }
  }
  
  return projects;
};
