import express from 'express';
import User from '../models/User.js';
import Survey from '../models/Survey.js';
import MiniProject from '../models/MiniProject.js';
import { analyzeStudentSkills, validateLearningInputs } from '../services/huggingfaceService.js';
import { generateWeeklyProjects } from '../services/projectGenerationService.js';

const router = express.Router();

router.post('/validate-inputs', async (req, res) => {
  try {
    const { courseInterest, learningGoals } = req.body;

    if (!courseInterest || !learningGoals) {
      return res.status(400).json({ 
        valid: false,
        message: 'Both fields are required'
      });
    }

    const validation = await validateLearningInputs(courseInterest, learningGoals);

    if (validation.valid) {
      res.status(200).json({ valid: true });
    } else {
      res.status(200).json({ 
        valid: false,
        message: validation.reason
      });
    }
  } catch (error) {
    console.error('Validation error:', error);
    res.status(200).json({ valid: true });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const {
      userId,
      primaryLanguage,
      courseInterest,
      learningGoals,
      javaExpertise,
      pythonExpertise,
      javaQuestions,
      pythonQuestions
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const aiAnalysisResult = await analyzeStudentSkills({
      primaryLanguage,
      courseInterest,
      learningGoals,
      javaExpertise,
      pythonExpertise,
      javaQuestions,
      pythonQuestions
    }, user.name);

    if (!aiAnalysisResult.success) {
      console.error('AI Analysis failed:', aiAnalysisResult.error);
      return res.status(503).json({ 
        message: 'AI analysis service is currently unavailable. Please try again later.',
        error: aiAnalysisResult.error
      });
    }

    let survey = await Survey.findOne({ userId });

    const surveyData = {
      primaryLanguage,
      courseInterest,
      learningGoals,
      completed: true,
      aiAnalysis: aiAnalysisResult.analysis,
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
      const projects = await generateWeeklyProjects(userId);
      
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

export default router;
