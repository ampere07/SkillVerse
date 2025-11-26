import express from 'express';
import MiniProject from '../models/MiniProject.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkAndGenerateProjects } from '../services/cronService.js';
import { gradeProject } from '../services/projectGradingService.js';

const router = express.Router();

router.get('/student', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    res.json(miniProject);
  } catch (error) {
    console.error('Get mini project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/available-projects', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    console.log(`[Available-Projects] Request from user ${req.user.userId}`);

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      console.log(`[Available-Projects] No MiniProject found for user ${req.user.userId}`);
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    console.log(`[Available-Projects] MiniProject found`);
    console.log(`[Available-Projects] Available projects count: ${miniProject.availableProjects.length}`);
    console.log(`[Available-Projects] Generation enabled: ${miniProject.generationEnabled}`);
    console.log(`[Available-Projects] Week start date: ${miniProject.weekStartDate}`);

    if (miniProject.availableProjects.length === 0) {
      console.log(`[Available-Projects] No projects available, checking if we should generate...`);
      
      const Survey = (await import('../models/Survey.js')).default;
      const survey = await Survey.findOne({ userId: req.user.userId });
      
      if (!survey) {
        console.log(`[Available-Projects] No survey found for user`);
        return res.json({
          availableProjects: [],
          completedThisWeek: 0,
          weekStartDate: miniProject.weekStartDate,
          allCompleted: false,
          message: 'Please complete the onboarding survey to generate projects'
        });
      }

      console.log(`[Available-Projects] Survey found, triggering project generation...`);
      
      try {
        const { generateWeeklyProjects } = await import('../services/projectGenerationService.js');
        const projects = await generateWeeklyProjects(req.user.userId);
        
        if (projects && projects.length > 0) {
          const weekStartDate = new Date();
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 7);
          
          const weekNumber = miniProject.currentWeekNumber + 1;
          miniProject.addWeeklyGeneratedProjects(projects, weekNumber, weekStartDate, weekEndDate);
          miniProject.weekStartDate = weekStartDate;
          
          await miniProject.save();
          console.log(`[Available-Projects] Successfully generated ${projects.length} projects`);
        } else {
          console.log(`[Available-Projects] Project generation returned empty array`);
        }
      } catch (genError) {
        console.error(`[Available-Projects] Error generating projects:`, genError);
      }
      
      const updatedProject = await MiniProject.findOne({ userId: req.user.userId });
      const completedThisWeek = updatedProject.completedTasks.filter(task => {
        const taskDate = new Date(task.completedAt);
        const weekStart = updatedProject.weekStartDate ? new Date(updatedProject.weekStartDate) : new Date(0);
        return taskDate >= weekStart && task.status === 'submitted';
      });

      console.log(`[Available-Projects] Final projects count: ${updatedProject.availableProjects.length}`);

      return res.json({
        availableProjects: updatedProject.availableProjects || [],
        completedThisWeek: completedThisWeek.length,
        weekStartDate: updatedProject.weekStartDate,
        allCompleted: completedThisWeek.length >= 6
      });
    }

    const completedThisWeek = miniProject.completedTasks.filter(task => {
      const taskDate = new Date(task.completedAt);
      const weekStart = miniProject.weekStartDate ? new Date(miniProject.weekStartDate) : new Date(0);
      return taskDate >= weekStart && task.status === 'submitted';
    });

    const response = {
      availableProjects: miniProject.availableProjects || [],
      completedThisWeek: completedThisWeek.length,
      weekStartDate: miniProject.weekStartDate,
      allCompleted: completedThisWeek.length >= 6
    };

    console.log(`[Available-Projects] Returning ${response.availableProjects.length} projects`);
    res.json(response);
  } catch (error) {
    console.error('[Available-Projects] Error:', error);
    console.error('[Available-Projects] Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/complete-task', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const { projectTitle, score, codeBase, aiAnalyization } = req.body;

    if (!projectTitle || score === undefined || !codeBase) {
      return res.status(400).json({ message: 'Project title, score, and code base are required' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    const completedThisWeek = miniProject.completedTasks.filter(task => {
      const taskDate = new Date(task.completedAt);
      const weekStart = miniProject.weekStartDate ? new Date(miniProject.weekStartDate) : new Date(0);
      return taskDate >= weekStart && task.status === 'submitted';
    });

    if (completedThisWeek.length >= 6) {
      return res.status(400).json({ 
        message: 'You have already completed all 6 projects for this week. New projects will be available next Monday.' 
      });
    }

    const projectExists = miniProject.availableProjects.some(
      p => p.title.toLowerCase() === projectTitle.toLowerCase()
    );

    if (!projectExists) {
      return res.status(400).json({ 
        message: 'This project is not in your available projects list' 
      });
    }

    const alreadyCompleted = completedThisWeek.some(
      task => task.projectTitle.toLowerCase() === projectTitle.toLowerCase()
    );

    if (alreadyCompleted) {
      return res.status(400).json({ 
        message: 'You have already completed this project this week' 
      });
    }

    miniProject.completedTasks.push({
      projectTitle,
      score,
      codeBase,
      aiAnalyization: aiAnalyization || '',
      completedAt: new Date()
    });

    await miniProject.save();

    const newCompletedCount = completedThisWeek.length + 1;

    res.status(201).json({
      message: 'Task completed successfully',
      completedThisWeek: newCompletedCount,
      allCompleted: newCompletedCount >= 6,
      miniProject
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/completed-tasks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    const completedThisWeek = miniProject.completedTasks.filter(task => {
      const taskDate = new Date(task.completedAt);
      const weekStart = miniProject.weekStartDate ? new Date(miniProject.weekStartDate) : new Date(0);
      return taskDate >= weekStart && task.status === 'submitted';
    });

    res.json({
      completedTasks: miniProject.completedTasks,
      completedThisWeek: completedThisWeek,
      totalThisWeek: completedThisWeek.length
    });
  } catch (error) {
    console.error('Get completed tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/completed-task/:taskId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const { taskId } = req.params;

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    miniProject.completedTasks = miniProject.completedTasks.filter(
      task => task._id.toString() !== taskId
    );

    await miniProject.save();

    res.json({
      message: 'Task deleted successfully',
      miniProject
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/enable-generation', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    miniProject.enableGeneration();
    await miniProject.save();

    res.json({
      message: 'Project generation enabled successfully',
      generationEnabled: miniProject.generationEnabled,
      lastGenerationDate: miniProject.lastGenerationDate
    });
  } catch (error) {
    console.error('Enable generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/generate-weekly-projects', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const { projects, weekNumber, weekStartDate, weekEndDate } = req.body;

    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ message: 'Projects array is required' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    if (!miniProject.generationEnabled) {
      return res.status(403).json({ 
        message: 'Project generation is not enabled. Enable it first.' 
      });
    }

    miniProject.addWeeklyGeneratedProjects(
      projects,
      weekNumber,
      weekStartDate ? new Date(weekStartDate) : undefined,
      weekEndDate ? new Date(weekEndDate) : undefined
    );

    await miniProject.save();

    res.status(201).json({
      message: 'Weekly projects generated successfully',
      weekNumber: miniProject.currentWeekNumber,
      generatedCount: projects.length,
      availableProjects: miniProject.availableProjects,
      weeklyHistory: miniProject.weeklyProjectHistory
    });
  } catch (error) {
    console.error('Generate weekly projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/weekly-history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    res.json({
      weeklyHistory: miniProject.weeklyProjectHistory,
      currentWeekNumber: miniProject.currentWeekNumber,
      generationEnabled: miniProject.generationEnabled,
      lastGenerationDate: miniProject.lastGenerationDate
    });
  } catch (error) {
    console.error('Get weekly history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/projects-by-week/:weekNumber', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const { weekNumber } = req.params;
    const weekNum = parseInt(weekNumber);

    if (isNaN(weekNum)) {
      return res.status(400).json({ message: 'Invalid week number' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    const weekProjects = miniProject.getProjectsByWeek(weekNum);

    res.json({
      weekNumber: weekNum,
      projects: weekProjects,
      projectCount: weekProjects.length
    });
  } catch (error) {
    console.error('Get projects by week error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/current-week-projects', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    const currentWeekProjects = miniProject.getCurrentWeekProjects();

    res.json({
      weekNumber: miniProject.currentWeekNumber,
      projects: currentWeekProjects,
      projectCount: currentWeekProjects.length
    });
  } catch (error) {
    console.error('Get current week projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/trigger-generation', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    miniProject.enableGeneration();
    
    miniProject.availableProjects = [];
    miniProject.weekStartDate = null;
    
    await miniProject.save();

    await checkAndGenerateProjects(req.user.userId);

    const updatedProject = await MiniProject.findOne({ userId: req.user.userId });

    res.json({
      message: 'Generation triggered successfully',
      generationEnabled: updatedProject.generationEnabled,
      availableProjects: updatedProject.availableProjects,
      projectCount: updatedProject.availableProjects.length,
      weekNumber: updatedProject.currentWeekNumber
    });
  } catch (error) {
    console.error('Trigger generation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/save-progress', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const { projectTitle, codeBase } = req.body;

    if (!projectTitle || !codeBase) {
      return res.status(400).json({ message: 'Project title and code base are required' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    const projectExists = miniProject.availableProjects.some(
      p => p.title.toLowerCase() === projectTitle.toLowerCase()
    );

    if (!projectExists) {
      return res.status(400).json({ 
        message: 'This project is not in your available projects list' 
      });
    }

    const existingTask = miniProject.completedTasks.find(
      task => task.projectTitle.toLowerCase() === projectTitle.toLowerCase()
    );

    if (existingTask) {
      existingTask.codeBase = codeBase;
      existingTask.status = 'paused';
      existingTask.lastSavedAt = new Date();
    } else {
      miniProject.completedTasks.push({
        projectTitle,
        score: 0,
        codeBase,
        aiAnalyization: '',
        status: 'paused',
        completedAt: new Date(),
        lastSavedAt: new Date()
      });
    }

    await miniProject.save();

    res.json({
      message: 'Progress saved successfully',
      status: 'paused',
      miniProject
    });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/submit-project', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const { projectTitle, codeBase } = req.body;

    if (!projectTitle || !codeBase) {
      return res.status(400).json({ message: 'Project title and code base are required' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    const projectDetails = miniProject.availableProjects.find(
      p => p.title.toLowerCase() === projectTitle.toLowerCase()
    );

    if (!projectDetails) {
      return res.status(400).json({ 
        message: 'This project is not in your available projects list' 
      });
    }

    console.log(`[Submit] Grading project: ${projectTitle}`);
    const gradingResult = await gradeProject(projectDetails, codeBase);
    console.log(`[Submit] Grading complete: Score ${gradingResult.score}, Passed: ${gradingResult.passed}`);

    const existingTask = miniProject.completedTasks.find(
      task => task.projectTitle.toLowerCase() === projectTitle.toLowerCase()
    );

    if (existingTask) {
      existingTask.codeBase = codeBase;
      existingTask.status = 'submitted';
      existingTask.score = gradingResult.score;
      existingTask.aiAnalyization = gradingResult.feedback;
      existingTask.lastSavedAt = new Date();
      existingTask.completedAt = new Date();
    } else {
      miniProject.completedTasks.push({
        projectTitle,
        score: gradingResult.score,
        codeBase,
        aiAnalyization: gradingResult.feedback,
        status: 'submitted',
        completedAt: new Date(),
        lastSavedAt: new Date()
      });
    }

    await miniProject.save();

    res.json({
      message: 'Project submitted and graded successfully',
      status: 'submitted',
      gradingResult,
      miniProject
    });
  } catch (error) {
    console.error('Submit project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/project-progress/:projectTitle', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const { projectTitle } = req.params;

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    const task = miniProject.completedTasks.find(
      task => task.projectTitle.toLowerCase() === projectTitle.toLowerCase()
    );

    if (!task) {
      return res.json({ 
        found: false,
        message: 'No saved progress found for this project' 
      });
    }

    res.json({
      found: true,
      task: {
        projectTitle: task.projectTitle,
        codeBase: task.codeBase,
        status: task.status,
        lastSavedAt: task.lastSavedAt,
        completedAt: task.completedAt
      }
    });
  } catch (error) {
    console.error('Get project progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/clear-and-regenerate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const miniProject = await MiniProject.findOne({ userId: req.user.userId });
    
    if (!miniProject) {
      return res.status(404).json({ message: 'Mini project data not found' });
    }

    console.log(`[Clear-Regenerate] Clearing old projects for user ${req.user.userId}`);
    console.log(`[Clear-Regenerate] Old projects count: ${miniProject.availableProjects.length}`);

    miniProject.availableProjects = [];
    miniProject.weeklyProjectHistory = [];
    miniProject.currentWeekNumber = 0;
    miniProject.generationEnabled = true;
    miniProject.lastGenerationDate = new Date();
    miniProject.weekStartDate = new Date();
    
    await miniProject.save();
    console.log(`[Clear-Regenerate] Projects cleared, triggering new generation...`);

    const Survey = (await import('../models/Survey.js')).default;
    const { generateWeeklyProjects } = await import('../services/projectGenerationService.js');
    
    const survey = await Survey.findOne({ userId: req.user.userId });
    
    if (!survey) {
      return res.status(400).json({ 
        message: 'Please complete the onboarding survey first to generate projects' 
      });
    }

    const projects = await generateWeeklyProjects(req.user.userId);
    
    if (projects.length === 0) {
      return res.status(500).json({ 
        message: 'Failed to generate projects. AI service is unavailable.' 
      });
    }

    const weekStartDate = new Date();
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    
    miniProject.addWeeklyGeneratedProjects(projects, 1, weekStartDate, weekEndDate);
    miniProject.weekStartDate = weekStartDate;
    
    await miniProject.save();

    const updatedProject = await MiniProject.findOne({ userId: req.user.userId });

    console.log(`[Clear-Regenerate] Successfully generated ${updatedProject.availableProjects.length} new projects`);

    res.json({
      message: 'Projects cleared and regenerated successfully',
      oldProjectsCount: 0,
      newProjectsCount: updatedProject.availableProjects.length,
      availableProjects: updatedProject.availableProjects,
      weekNumber: updatedProject.currentWeekNumber,
      generationEnabled: updatedProject.generationEnabled
    });
  } catch (error) {
    console.error('[Clear-Regenerate] Error:', error);
    res.status(500).json({ 
      message: 'Server error during regeneration', 
      error: error.message 
    });
  }
});

export default router;
