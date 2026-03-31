import { generateWithRetry } from './geminiService.js';
import GEMINI_CONFIG from '../config/geminiConfig.js';
import User from '../models/User.js';

console.log(`Project Generation Service using shared AI service`);
console.log(`Model: ${GEMINI_CONFIG.model}`);

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

    const Survey = (await import('../models/Survey.js')).default;
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

    console.log(`[ProjectGen] Calling AI API with retry logic...`);
    const startTime = Date.now();

    const response = await generateWithRetry(prompt, {
      temperature: 0.9,
      num_predict: 1500,
      num_ctx: 2048,
      num_thread: 10
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

    const correctedProjects = projects.map(project => ({
      ...project,
      language: language
    }));

    if (correctedProjects.length < 3) {
      throw new Error(`Only generated ${correctedProjects.length} projects, expected at least 3.`);
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

Generate 3 projects, ONE for EACH of the first 3 Phase 1 roadmap items in order:`;
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

const parseProjectsFromAI = (text) => {
  const projects = [];

  let projectMatches = text.split(/###\s*Project\s*\d+:/i).filter(p => p.trim());

  if (projectMatches.length <= 1) {
    projectMatches = text.split(/PROJECT\s*\d+:/i).filter(p => p.trim());
  }

  console.log(`[ProjectGen-Parse] Found ${projectMatches.length} potential project blocks`);

  for (const projectText of projectMatches) {
    try {
      const titleMatch = projectText.match(/\*\*Title:\*\*\s*(.+?)(?=\n|$)/i);
      const descMatch = projectText.match(/\*\*Description:\*\*\s*(.+?)(?=\*\*Language)/is);
      const langMatch = projectText.match(/\*\*Language:\s*\*\*?\s*(.+?)(?=\n|$)/i) ||
        projectText.match(/Language:\s*(.+?)(?=\n|$)/i);
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
      }
    } catch (error) {
      console.error('[ProjectGen-Parse] Error parsing project:', error.message);
    }
  }

  return projects;
};
