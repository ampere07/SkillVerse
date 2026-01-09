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

    if (!survey.learningRoadmap || !survey.learningRoadmap.phase1 || survey.learningRoadmap.phase1.length < 3) {
      throw new Error(`Phase 1 must have at least 3 items for ${language}`);
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
    
    console.log(`[ProjectGen] Calling Ollama API (no timeout - will wait until completion)...`);
    const startTime = Date.now();
    
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ProjectGen] AI Response received after ${duration} seconds`);

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

    if (correctedProjects.length < 3) {
      throw new Error(`Only generated ${correctedProjects.length} projects, expected at least 3. AI may need better prompting.`);
    }

    console.log(`[ProjectGen] Successfully generated ${correctedProjects.length} roadmap-based projects in ${duration}s`);
    console.log(`[ProjectGen] All projects set to language: ${language}`);
    return correctedProjects;
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
  
  // Ensure Phase 1 has at least 3 items
  if (phase1Items.length < 3) {
    throw new Error(`Phase 1 must have at least 3 items, found ${phase1Items.length}`);
  }

  const aiAnalysisSection = aiAnalysis 
    ? `\n\nAI ANALYSIS:\n${aiAnalysis}\n\nUse this to tailor difficulty, explanations, focus. Address strengths/weaknesses.`
    : '';

  return `Create 3 unique mini projects based on personalized roadmap.

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
All 3 projects from Phase 1 only.
One project per Phase 1 item:
- Project 1: Based on Phase 1, Item 1 (${phase1Items[0]})
- Project 2: Based on Phase 1, Item 2 (${phase1Items[1]})
- Project 3: Based on Phase 1, Item 3 (${phase1Items[2]})

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
- All 3 projects Phase 1 only
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

CRITICAL: ALL 3 PROJECTS MUST BE IN ${language}. DO NOT GENERATE PYTHON IF LANGUAGE IS JAVA. DO NOT GENERATE JAVA IF LANGUAGE IS PYTHON.

Generate 3 projects, ONE for EACH of the first 3 Phase 1 roadmap items in order:`;
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
  
  // Try multiple splitting patterns
  let projectMatches = text.split(/###\s*Project\s*\d+:/i).filter(p => p.trim());
  
  if (projectMatches.length <= 1) {
    projectMatches = text.split(/PROJECT\s*\d+:/i).filter(p => p.trim());
  }
  
  console.log(`[ProjectGen-Parse] Found ${projectMatches.length} potential project blocks`);
  
  for (const projectText of projectMatches) {
    try {
      // More flexible title matching
      const titleMatch = projectText.match(/\*\*Title:\*\*\s*(.+?)(?=\n|$)/i);
      
      // More flexible description matching - look for Description until Language
      const descMatch = projectText.match(/\*\*Description:\*\*\s*(.+?)(?=\*\*Language)/is);
      
      // More flexible language matching - handle both formats
      const langMatch = projectText.match(/\*\*Language:\s*\*\*?\s*(.+?)(?=\n|$)/i) || 
                        projectText.match(/Language:\s*(.+?)(?=\n|$)/i);
      
      // Requirements and Rubrics
      const reqMatch = projectText.match(/\*\*Requirements:\*\*\s*([\s\S]+?)(?=\*\*Rubrics:|$)/i);
      const rubricsMatch = projectText.match(/\*\*Rubrics:\*\*\s*([\s\S]+?)(?=\n\n|###|PROJECT|$)/i);
      
      if (titleMatch && descMatch && langMatch) {
        let title = titleMatch[1].trim();
        title = title.replace(/^\*\*|\*\*$/g, '');
        title = title.replace(/^["']|["']$/g, '');
        title = title.trim();
        
        let language = langMatch[1].trim();
        language = language.replace(/^\*\*|\*\*$/g, '');
        language = language.trim();
        
        const requirements = reqMatch 
          ? reqMatch[1].split('\n').filter(r => r.trim() && (r.trim().startsWith('-') || r.trim().match(/^\d+\./)))
              .map(r => r.trim()).join('\n')
          : '';
        
        const rubrics = rubricsMatch
          ? rubricsMatch[1].split('\n').filter(r => r.trim() && (r.trim().startsWith('-') || r.trim().match(/^\d+\./)))
              .map(r => r.trim()).join('\n')
          : '';
        
        console.log(`[ProjectGen-Parse] Project "${title}" fields: Req=${!!reqMatch}, Rubrics=${!!rubricsMatch}`);
        
        projects.push({
          title: title,
          description: descMatch[1].trim().replace(/\n/g, ' '),
          language: language,
          requirements: requirements.trim(),
          rubrics: rubrics
        });
        console.log(`[ProjectGen-Parse] Successfully parsed project: ${title}`);
      } else {
        console.log(`[ProjectGen-Parse] Failed to parse project - missing fields. Title: ${!!titleMatch}, Desc: ${!!descMatch}, Lang: ${!!langMatch}`);
        if (!descMatch && projectText.includes('Description')) {
          const descStart = projectText.indexOf('Description');
          console.log(`[ProjectGen-Parse] Description section:`, projectText.substring(descStart, descStart + 300));
        }
        if (!titleMatch && projectText.length > 50) {
          console.log(`[ProjectGen-Parse] Title match failed for text:`, projectText.substring(0, 200));
        }
        if (!langMatch && projectText.includes('Language')) {
          const langStart = projectText.indexOf('Language');
          console.log(`[ProjectGen-Parse] Language section:`, projectText.substring(langStart, langStart + 100));
        }
      }
    } catch (error) {
      console.error('[ProjectGen-Parse] Error parsing project:', error.message);
    }
  }
  
  return projects;
};