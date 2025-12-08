import { Ollama } from 'ollama';
import Survey from '../models/Survey.js';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';

const MODEL_NAME = OLLAMA_CONFIG.model;
const OLLAMA_URL = OLLAMA_CONFIG.url;

const ollama = new Ollama({ host: OLLAMA_URL });

console.log(`Project Generation Service using Ollama`);
console.log(`Model: ${MODEL_NAME}`);
console.log(`URL: ${OLLAMA_URL}`);

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
          num_predict: 2500,
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
      throw new Error(`AI generation failed: ${apiError.message}`);
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
    ? `\n\nSTUDENT AI ANALYSIS:\nBased on comprehensive assessment, here's what we know about this student:\n${aiAnalysis}\n\nUSE THIS ANALYSIS to tailor project difficulty, explanations, and focus areas. Address their specific strengths and weaknesses identified above.`
    : '';

  return `You are creating 6 UNIQUE mini programming projects based on a personalized learning roadmap.

CRITICAL LANGUAGE REQUIREMENT:
ALL projects MUST be in ${language} programming language.
EVERY project Language field MUST say: ${language}
Do NOT mix languages - if the student selected ${language}, generate ONLY ${language} projects.

STUDENT LEARNING ROADMAP:
The student has a structured learning path with specific concepts to master:

Phase 1 - Foundation:
${learningRoadmap.phase1.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Phase 2 - Building Skills:
${learningRoadmap.phase2.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Phase 3 - Advanced Practice:
${learningRoadmap.phase3.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Primary Language: ${language}
Skill Level: ${skillLevel}${aiAnalysisSection}

PROJECT GENERATION REQUIREMENTS:

CRITICAL: ALL 6 PROJECTS MUST BE FROM PHASE 1 CONCEPTS ONLY.
Create ONE project for EACH of the 6 Phase 1 roadmap items:
- Project 1: Based on Phase 1, Item 1 (${phase1Items[0]})
- Project 2: Based on Phase 1, Item 2 (${phase1Items[1]})
- Project 3: Based on Phase 1, Item 3 (${phase1Items[2]})
- Project 4: Based on Phase 1, Item 4 (${phase1Items[3]})
- Project 5: Based on Phase 1, Item 5 (${phase1Items[4]})
- Project 6: Based on Phase 1, Item 6 (${phase1Items[5]})

Each project MUST:
1. Teach the SPECIFIC concept from the roadmap item
2. Be a SINGLE FILE console program
3. Use Scanner (Java) or input() (Python) for user interaction
4. Include 3-4 clear requirements (concise and specific)
5. Progress in difficulty following the roadmap phases

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

SKILL LEVEL REQUIREMENT:
Student Skill Level: ${skillLevel}
${getSkillLevelGuidance(skillLevel)}

ALL 6 PROJECTS MUST BE AT EXACTLY ${skillLevel} LEVEL

FORMAT EACH PROJECT:

IMPORTANT: Language field MUST be exactly: ${language}

PROJECT 1:
Title: [Concept] - [App Name]
Description: Teaches [CONCEPT]. [1 sentence why important]. [1 sentence what to build]. (Max 3 sentences total)
Language: ${language}
Requirements:
- [Requirement 1 - specific and measurable]
- [Requirement 2 - specific and measurable]
- [Requirement 3 - specific and measurable]
- [Requirement 4 - specific and measurable]
Rubrics:
[4-5 grading criteria totaling 100 points]

EXAMPLE PROJECT (Roadmap Item: "Practice basic syntax and variables"):

PROJECT 1:
Title: Variables and Data Types - Student Profile
Description: Teaches variables and data types. Understanding different data types is essential for storing information. You will create a program that stores and displays student information.
Language: ${language}
Requirements:
- Declare 4 variables: studentName (String), age (int), gpa (double), isEnrolled (boolean)
- Use Scanner/input() to accept user input for each variable
- Validate age (1-100) and GPA (0.0-4.0)
- Display formatted profile with all information
Rubrics:
- Variable Declaration (25 pts): All 4 data types declared correctly
- User Input (25 pts): Proper Scanner/input() usage
- Validation (25 pts): Age and GPA validated correctly
- Output Format (15 pts): Clean display
- Code Quality (10 pts): Proper naming

EXAMPLE PROJECT (Roadmap Item: "Object-oriented programming basics"):

PROJECT 3:
Title: OOP Basics - Book Manager
Description: Teaches object-oriented programming with classes and objects. OOP helps organize code for larger programs. You will create a Book class with properties and methods.
Language: ${language}
Requirements:
- Create Book class with properties: title, author, pages, isRead
- Implement displayInfo() and markAsRead() methods
- Create ArrayList to store 3+ Book objects
- Implement menu: Add Book, Display All, Mark as Read, Exit
Rubrics:
- Class Definition (25 pts): Proper Book class with all properties
- Methods (25 pts): Working display and markAsRead methods
- Object Management (20 pts): ArrayList with multiple objects
- Menu System (20 pts): All menu options functional
- Code Quality (10 pts): Clean structure

IMPORTANT REMINDERS:
- Each project MUST directly teach a specific Phase 1 concept
- All 6 projects focus on Phase 1 - Foundation concepts only
- Projects should be at similar difficulty level (all foundation)
- Phase 2 and Phase 3 will be covered in future weeks
- All single-file console programs with clear learning objectives
- DO NOT use asterisks ** in titles
- NO FILE I/O OPERATIONS - Use in-memory data only
- NO FILE READING/WRITING - All data via Scanner/input()
- Focus on TEACHING the Phase 1 roadmap concept through practical application

REQUIREMENTS GENERATION:
- EVERY project MUST have exactly 4 UNIQUE, SPECIFIC requirements
- Requirements must be MEASURABLE and TESTABLE
- Each requirement should specify EXACTLY what needs to be implemented
- Requirements must be DIFFERENT for each project
- Keep requirements concise (one clear sentence each)

RUBRICS GENERATION:
- Include 4-5 grading criteria totaling 100 points
- Rubrics must align with project requirements
- Each criterion should be specific and measurable

PERSONALIZATION:
- USE THE AI ANALYSIS to personalize difficulty, explanations, and focus areas
- Address the student's specific strengths and weaknesses in project design
- Adjust requirements complexity based on skill level

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
    ? `\n\nSTUDENT AI ANALYSIS:\nBased on comprehensive assessment:\n${aiAnalysis}\n\nUSE THIS ANALYSIS to create projects that address the student's specific needs, learning style, and areas for improvement.`
    : '';
  
  return `You are creating 6 UNIQUE mini programming projects that teach FUNDAMENTAL PROGRAMMING CONCEPTS needed for the student's goal.

STUDENT PROFILE:
Student Interest: "${courseInterest || 'General Programming'}"
Student Goals: "${learningGoals || 'Improve programming skills'}"
Primary Language: ${language}
Skill Level: ${skillLevel}

STUDENT SKILLS ASSESSMENT:
AI Analysis: ${aiAnalysis || 'No analysis available'}

Strengths: ${strengths.join(', ')}
Weaknesses: ${weaknesses.join(', ')}${aiAnalysisSection}

PROJECT GENERATION STRATEGY:
Based on the student's skills, create projects that:
1. Build on their STRENGTHS (${strengths.slice(0, 2).join(', ')})
2. Address their WEAKNESSES (${weaknesses.slice(0, 2).join(', ')})
3. Progress gradually from concepts they know to concepts they need to learn
4. Each project should target ONE specific weakness while using their strengths

CRITICAL UNDERSTANDING:
The student wants to learn "${courseInterest || 'programming'}", but we have a SINGLE FILE CONSOLE COMPILER with ONE code editor and ONE output window.

Therefore, create CONSOLE PROJECTS that teach PROGRAMMING CONCEPTS that are foundational to "${courseInterest || 'programming'}".

CONCEPT MAPPING FOR "${courseInterest || 'programming'}":
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
2. Each concept is RELEVANT to "${courseInterest || 'programming'}"
3. Explain WHY this concept matters for their goal
4. All projects are SINGLE FILE console programs
5. Use Scanner (Java) or input() (Python) for user interaction
6. Every project must have UNIQUE, DETAILED requirements (4-6 specific requirements each)

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
Description: This project teaches [CONCEPT] which is essential for ${courseInterest || 'programming'}. In ${courseInterest || 'this field'}, [explain how concept is used]. You will create a console program that [what they build]. This helps you understand [why it matters for their goal].
Language: ${language}
Requirements:
- [SPECIFIC requirement with exact technical details - must be unique to THIS project]
- [MEASURABLE requirement that can be tested - include numbers/criteria]
- [DETAILED requirement for user interaction - specify exact input format]
- [CLEAR requirement for expected behavior - describe exact output]
- [Optional: Additional unique requirement based on concept complexity]
Sample Output:
[Show realistic console interaction demonstrating the concept]
Rubrics:
[Detailed grading criteria for this project with point distribution totaling 100 points]

EXAMPLE FOR WEB DEVELOPMENT STUDENT:

PROJECT 1:
Title: Inheritance - Request Handler System
Description: This project teaches inheritance which is essential for Web Development. In web frameworks like Spring Boot, inheritance is used to create different types of request handlers (GET, POST, PUT, DELETE) that share common behavior. You will create a console program that simulates a request handling system using inheritance. This helps you understand how web frameworks organize code and handle different HTTP methods.
Language: Java
Requirements:
- Create an abstract RequestHandler base class with protected properties: timestamp (String), statusCode (int), and method processRequest()
- Implement GetHandler class extending RequestHandler with a retrieve() method for fetching data
- Implement PostHandler class extending RequestHandler with a create() method for adding data
- Create an array or ArrayList to store at least 3 different handler objects
- Use Scanner to accept menu choice (1=GET, 2=POST, 3=Exit) and resource path input
- Demonstrate polymorphism by calling processRequest() on handler objects stored in a collection
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
Rubrics:
- Base Class Design (20 points): Proper RequestHandler base class with required properties
- Inheritance Implementation (25 points): Correct child classes inheriting from base
- Polymorphism (20 points): Successful demonstration of polymorphic behavior
- Unique Behaviors (15 points): Each handler type has distinct functionality
- Menu and Input (10 points): Working menu system with proper input handling
- Code Structure (10 points): Clean organization and proper OOP principles

EXAMPLE FOR DATA ANALYTICS STUDENT:

PROJECT 1:
Title: Collections - Student Records Manager
Description: This project teaches Collections which are essential for Data Analytics. In data systems, collections like ArrayList and HashMap are used to store and manage records efficiently. You will create a console program that manages student records using collections. This helps you understand how databases and analytics tools organize data internally.
Language: Java
Requirements:
- Create a Student class with properties: id (int), name (String), grade (double)
- Use ArrayList<Student> to store all student records (minimum capacity: 10)
- Use HashMap<Integer, Student> to index students by ID for O(1) lookup time
- Implement addStudent() method that adds to both ArrayList and HashMap
- Implement searchById() method that uses HashMap for fast retrieval
- Implement calculateStatistics() method that computes: average grade, highest grade, lowest grade
- Use Scanner to accept menu choice and student data (validate grade is between 0-100)
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
Rubrics:
- ArrayList Implementation (20 points): Proper use of ArrayList for storing records
- HashMap Implementation (20 points): Correct HashMap usage for indexing by ID
- CRUD Operations (25 points): Working add, search, and display functionality
- Statistics Calculation (20 points): Accurate average and highest score computation
- Menu System (10 points): Functional menu with all options
- Code Quality (5 points): Clean code and proper naming

IMPORTANT REMINDERS:
- Connect EVERY project to "${courseInterest || 'programming'}"
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

REQUIREMENTS GENERATION (CRITICAL):
- EVERY project MUST have 4-7 UNIQUE, DETAILED requirements
- Each requirement must be SPECIFIC and MEASURABLE
- Bad: "Handle user input" - Good: "Use Scanner to accept 3 integers between 1-100"
- Bad: "Create a class" - Good: "Create Employee class with name, id, salary properties"
- Requirements must describe EXACT implementation details
- Each project's requirements must be COMPLETELY DIFFERENT from others

RUBRICS GENERATION:
- ALWAYS include detailed rubrics with clear grading criteria totaling 100 points
- Rubrics should align perfectly with the requirements listed above
- Each rubric criterion should directly correspond to a requirement
- Rubrics should assess both technical implementation and concept understanding

PERSONALIZATION:
- USE THE AI ANALYSIS to personalize projects for the student's learning style
- Address specific strengths and weaknesses identified in the AI analysis
- Adjust requirements complexity based on demonstrated skill level

CRITICAL: Base the difficulty and concepts on the student's actual skills:
- Include 2 projects focused on strengthening: ${strengths.slice(0, 2).join(' and ')}
- Include 4 projects focused on improving: ${weaknesses.join(', ')}
- Each project should be practical and relevant to ${courseInterest || 'programming'}
- Projects should progress in difficulty based on the concepts covered

Generate 6 SKILL-BASED, CONCEPT-FOCUSED projects for ${courseInterest || 'programming'}:`;
};

const getConceptsForGoal = (interest, goals, skillLevel) => {
  const text = `${interest || ''} ${goals || ''}`.toLowerCase();
  
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
  const interestText = (interest || '').toLowerCase();
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