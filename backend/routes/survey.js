import express from 'express';
import User from '../models/User.js';
import Survey from '../models/Survey.js';
import MiniProject from '../models/MiniProject.js';
import { analyzeStudentSkills, generateFallbackRoadmap } from '../services/ollamaService.js';
import { generateWeeklyProjects } from '../services/projectGenerationService.js';

const router = express.Router();

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
        console.warn('AI Analysis failed, using fallback roadmap:', aiAnalysisResult.error);
        const expertiseLevel = primaryLanguage === 'java' ? javaExpertise : pythonExpertise;
        learningRoadmap = generateFallbackRoadmap(primaryLanguage, expertiseLevel);
        aiAnalysis = `Welcome to SkillVerse! Based on your ${primaryLanguage === 'java' ? 'Java' : 'Python'} selection and ${expertiseLevel} level, we'll create personalized projects to help you improve your skills. Start with the mini projects to practice and enhance your programming abilities!`;
        console.log('[Survey] Fallback roadmap generated:', learningRoadmap);
      }
    } catch (aiError) {
      console.error('AI Analysis error, using fallback roadmap:', aiError);
      const expertiseLevel = primaryLanguage === 'java' ? javaExpertise : pythonExpertise;
      learningRoadmap = generateFallbackRoadmap(primaryLanguage, expertiseLevel);
      aiAnalysis = `Welcome to SkillVerse! Based on your ${primaryLanguage === 'java' ? 'Java' : 'Python'} selection and ${expertiseLevel} level, we'll create personalized projects to help you improve your skills. Start with the mini projects to practice and enhance your programming abilities!`;
      console.log('[Survey] Fallback roadmap generated (from catch):', learningRoadmap);
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

    console.log(`[Survey] Survey completed successfully - projects will be generated when user clicks Get Started`);

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

// New endpoint to generate projects when user clicks "Get Started"
router.post('/generate-projects/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[GenerateProjects] Starting project generation for user ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const miniProject = await MiniProject.findOne({ userId });
    if (!miniProject) {
      return res.status(404).json({ message: 'MiniProject not found for user' });
    }

    // Check if projects already exist
    if (miniProject.availableProjects && miniProject.availableProjects.length > 0) {
      console.log(`[GenerateProjects] Projects already exist for user ${userId}`);
      return res.status(200).json({
        message: 'Projects already generated',
        projectCount: miniProject.availableProjects.length
      });
    }

    const completedLanguages = user.surveyCompletedLanguages || [];
    console.log(`[GenerateProjects] Completed surveys for languages: ${completedLanguages.join(', ')}`);
    
    let projects = [];
    
    if (completedLanguages.includes('java') && completedLanguages.includes('python')) {
      console.log(`[GenerateProjects] Both surveys completed, generating projects for both languages`);
      const { generateProjectsForBothLanguages } = await import('../services/projectGenerationService.js');
      projects = await generateProjectsForBothLanguages(userId);
    } else if (completedLanguages.length > 0) {
      const language = completedLanguages[0];
      console.log(`[GenerateProjects] Generating projects for ${language} only`);
      const { generateProjectsForLanguage } = await import('../services/projectGenerationService.js');
      projects = await generateProjectsForLanguage(userId, language);
    } else {
      return res.status(400).json({ message: 'No completed surveys found for user' });
    }
    
    const weekStartDate = new Date();
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    
    const weekNumber = miniProject.currentWeekNumber + 1;
    miniProject.addWeeklyGeneratedProjects(projects, weekNumber, weekStartDate, weekEndDate);
    miniProject.weekStartDate = weekStartDate;
    
    await miniProject.save();
    
    console.log(`[GenerateProjects] Successfully generated ${projects.length} AI projects for user ${userId} (Week ${weekNumber})`);

    res.status(200).json({
      message: 'Projects generated successfully',
      projectCount: projects.length,
      weekNumber
    });
  } catch (error) {
    console.error('[GenerateProjects] Error:', error);
    res.status(500).json({ 
      message: 'Error generating projects', 
      error: error.message 
    });
  }
});

export default router;
