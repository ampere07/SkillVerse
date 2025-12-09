import express from 'express';
import User from '../models/User.js';
import Survey from '../models/Survey.js';
import MiniProject from '../models/MiniProject.js';
import { analyzeStudentSkills } from '../services/ollamaService.js';
import { generateWeeklyProjects } from '../services/projectGenerationService.js';

const router = express.Router();

const createFallbackRoadmap = (language, expertise) => {
  const isJava = language.toLowerCase() === 'java';
  
  if (expertise === 'beginner' || expertise === 'basic') {
    return {
      phase1: isJava ? [
        'Variables and Data Types',
        'Operators and Expressions',
        'Conditional Statements (if-else)',
        'Loops (for and while)',
        'Arrays and Basic Collections',
        'Methods and Functions'
      ] : [
        'Variables and Data Types',
        'Operators and Expressions',
        'Conditional Statements (if-elif-else)',
        'Loops (for and while)',
        'Lists and Basic Collections',
        'Functions and Parameters'
      ],
      phase2: isJava ? [
        'Object-Oriented Programming Basics',
        'Classes and Objects',
        'Inheritance and Polymorphism',
        'ArrayLists and HashMaps',
        'Exception Handling',
        'File Input/Output'
      ] : [
        'Object-Oriented Programming Basics',
        'Classes and Objects',
        'Dictionaries and Sets',
        'Exception Handling',
        'File Input/Output',
        'List Comprehensions'
      ],
      phase3: isJava ? [
        'Advanced OOP Concepts',
        'Data Structures Implementation',
        'Algorithm Design',
        'Design Patterns',
        'Multithreading Basics',
        'Building Complete Applications'
      ] : [
        'Advanced Functions and Decorators',
        'Generators and Iterators',
        'Algorithm Implementation',
        'Working with Modules',
        'Regular Expressions',
        'Building Complete Applications'
      ]
    };
  } else if (expertise === 'intermediate') {
    return {
      phase1: isJava ? [
        'Interfaces and Abstract Classes',
        'Collections Framework',
        'Exception Handling Patterns',
        'Generics and Type Safety',
        'Lambda Expressions',
        'Stream API Basics'
      ] : [
        'Advanced Data Structures',
        'Functional Programming',
        'Decorators and Context Managers',
        'Working with APIs',
        'Data Processing with Pandas',
        'Regular Expressions'
      ],
      phase2: isJava ? [
        'Design Patterns (Factory, Singleton)',
        'Data Structures (Trees, Graphs)',
        'Algorithm Optimization',
        'Multithreading and Concurrency',
        'Database Connectivity (JDBC)',
        'Testing with JUnit'
      ] : [
        'Object-Oriented Design Patterns',
        'Advanced Algorithm Implementation',
        'Asynchronous Programming',
        'Working with Databases',
        'Web Scraping',
        'Testing with unittest/pytest'
      ],
      phase3: isJava ? [
        'Spring Framework Basics',
        'RESTful API Development',
        'Advanced Design Patterns',
        'Performance Optimization',
        'Microservices Architecture',
        'Full Application Development'
      ] : [
        'Web Development with Flask/Django',
        'RESTful API Development',
        'Data Science Libraries',
        'Machine Learning Basics',
        'Performance Optimization',
        'Full Application Development'
      ]
    };
  } else {
    return {
      phase1: isJava ? [
        'Advanced Design Patterns',
        'Concurrent Programming',
        'JVM Internals',
        'Performance Tuning',
        'Security Best Practices',
        'Architectural Patterns'
      ] : [
        'Advanced Design Patterns',
        'Metaclasses and Descriptors',
        'Advanced Async Programming',
        'Performance Optimization',
        'Security Best Practices',
        'Architectural Patterns'
      ],
      phase2: isJava ? [
        'Microservices Architecture',
        'Distributed Systems',
        'Message Queues and Kafka',
        'Cloud-Native Development',
        'Docker and Kubernetes',
        'System Design'
      ] : [
        'Distributed Systems with Python',
        'Advanced Machine Learning',
        'Big Data Processing',
        'Cloud Computing',
        'Docker and Deployment',
        'System Architecture'
      ],
      phase3: isJava ? [
        'Enterprise Application Patterns',
        'Scalability and High Availability',
        'Advanced Testing Strategies',
        'CI/CD Pipelines',
        'Production Monitoring',
        'Complete System Development'
      ] : [
        'Production-Grade Applications',
        'Scalability and Performance',
        'Advanced Testing and CI/CD',
        'Monitoring and Logging',
        'Data Engineering',
        'Complete System Development'
      ]
    };
  }
};

router.post('/submit', async (req, res) => {
  try {
    const {
      userId,
      primaryLanguage,
      javaExpertise,
      pythonExpertise,
      javaQuestions,
      pythonQuestions
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!primaryLanguage) {
      return res.status(400).json({ message: 'Primary language is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let aiAnalysis = null;
    let learningRoadmap = null;
    
    try {
      const aiAnalysisResult = await analyzeStudentSkills({
        primaryLanguage,
        javaExpertise,
        pythonExpertise,
        javaQuestions,
        pythonQuestions
      }, user.name);

      if (aiAnalysisResult.success) {
        aiAnalysis = aiAnalysisResult.analysis;
        learningRoadmap = aiAnalysisResult.roadmap;
        console.log('[Survey] Learning roadmap generated:', learningRoadmap);
      } else {
        console.warn('AI Analysis failed, continuing without it:', aiAnalysisResult.error);
        aiAnalysis = `Welcome to SkillVerse! Based on your ${primaryLanguage === 'java' ? 'Java' : 'Python'} selection and ${primaryLanguage === 'java' ? javaExpertise : pythonExpertise} level, we'll create personalized projects to help you improve your skills. Start with the mini projects to practice and enhance your programming abilities!`;
        
        // Create fallback learning roadmap when AI fails
        learningRoadmap = createFallbackRoadmap(primaryLanguage, primaryLanguage === 'java' ? javaExpertise : pythonExpertise);
        console.log('[Survey] Using fallback learning roadmap:', learningRoadmap);
      }
    } catch (aiError) {
      console.error('AI Analysis error:', aiError);
      aiAnalysis = `Welcome to SkillVerse! Based on your ${primaryLanguage === 'java' ? 'Java' : 'Python'} selection and ${primaryLanguage === 'java' ? javaExpertise : pythonExpertise} level, we'll create personalized projects to help you improve your skills. Start with the mini projects to practice and enhance your programming abilities!`;
      
      // Create fallback learning roadmap when AI fails
      learningRoadmap = createFallbackRoadmap(primaryLanguage, primaryLanguage === 'java' ? javaExpertise : pythonExpertise);
      console.log('[Survey] Using fallback learning roadmap:', learningRoadmap);
    }

    let survey = await Survey.findOne({ userId, primaryLanguage });

    const surveyData = {
      primaryLanguage,
      completed: true,
      aiAnalysis: aiAnalysis,
      learningRoadmap: learningRoadmap,
      analysisGeneratedAt: new Date()
    };
    
    if (javaExpertise) surveyData.javaExpertise = javaExpertise;
    if (pythonExpertise) surveyData.pythonExpertise = pythonExpertise;
    if (javaQuestions) surveyData.javaQuestions = javaQuestions;
    if (pythonQuestions) surveyData.pythonQuestions = pythonQuestions;

    if (survey) {
      Object.assign(survey, surveyData);
      await survey.save();
    } else {
      survey = new Survey({
        userId,
        ...surveyData
      });
      await survey.save();
    }

    user.onboardingSurvey = {
      surveyCompleted: true
    };
    
    // Update primaryLanguage to match the survey language
    user.primaryLanguage = primaryLanguage;
    
    if (!user.surveyCompletedLanguages) {
      user.surveyCompletedLanguages = [];
    }
    
    if (!user.surveyCompletedLanguages.includes(primaryLanguage)) {
      user.surveyCompletedLanguages.push(primaryLanguage);
    }
    
    await user.save();

    let miniProject = await MiniProject.findOne({ userId });

    if (!miniProject) {
      miniProject = new MiniProject({
        userId,
        completedTasks: [],
        availableProjects: [],
        weekStartDate: new Date(),
        lastWeekCompletedCount: 0,
        generationEnabled: true,
        lastGenerationDate: new Date(),
        currentWeekNumber: 0,
        weeklyProjectHistory: []
      });
      await miniProject.save();
      console.log(`[Survey] Created MiniProject for user ${userId}`);
    }

    if (!miniProject.generationEnabled) {
      miniProject.enableGeneration();
      await miniProject.save();
      console.log(`[Survey] Enabled generation for user ${userId}`);
    }

    console.log(`[Survey] Generating AI projects for user ${userId}...`);
    
    try {
      const completedLanguages = user.surveyCompletedLanguages || [];
      console.log(`[Survey] Completed surveys for languages: ${completedLanguages.join(', ')}`);
      
      let projects = [];
      
      if (completedLanguages.includes('java') && completedLanguages.includes('python')) {
        console.log(`[Survey] Both surveys completed, generating projects for both languages`);
        const { generateProjectsForBothLanguages } = await import('../services/projectGenerationService.js');
        projects = await generateProjectsForBothLanguages(userId);
      } else {
        console.log(`[Survey] Generating projects for ${primaryLanguage} only`);
        const { generateProjectsForLanguage } = await import('../services/projectGenerationService.js');
        projects = await generateProjectsForLanguage(userId, primaryLanguage);
      }
      
      const weekStartDate = new Date();
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);
      
      const weekNumber = miniProject.currentWeekNumber + 1;
      miniProject.addWeeklyGeneratedProjects(projects, weekNumber, weekStartDate, weekEndDate);
      miniProject.weekStartDate = weekStartDate;
      
      await miniProject.save();
      
      console.log(`[Survey] Generated ${projects.length} AI projects for user ${userId} (Week ${weekNumber})`);
    } catch (generateError) {
      console.error(`[Survey] Error generating projects for user ${userId}:`, generateError);
    }

    res.status(200).json({
      message: 'Survey submitted successfully',
      survey: {
        id: survey._id,
        userId: survey.userId,
        primaryLanguage: survey.primaryLanguage,
        javaExpertise: survey.javaExpertise,
        pythonExpertise: survey.pythonExpertise,
        completed: survey.completed,
        aiAnalysis: survey.aiAnalysis,
        analysisGeneratedAt: survey.analysisGeneratedAt
      }
    });
  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({ message: 'Server error during survey submission' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const survey = await Survey.findOne({ userId });

    res.status(200).json({
      surveyCompleted: survey?.completed || false,
      surveyData: survey || null
    });
  } catch (error) {
    console.error('Survey fetch error:', error);
    res.status(500).json({ message: 'Server error fetching survey data' });
  }
});

router.get('/check-language/:userId/:language', async (req, res) => {
  try {
    const { userId, language } = req.params;

    if (!['java', 'python'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasCompleted = user.surveyCompletedLanguages?.includes(language) || false;

    res.status(200).json({
      hasCompleted,
      language
    });
  } catch (error) {
    console.error('Survey check error:', error);
    res.status(500).json({ message: 'Server error checking survey status' });
  }
});

export default router;
