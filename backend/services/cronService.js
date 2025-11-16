import cron from 'node-cron';
import MiniProject from '../models/MiniProject.js';
import { generateWeeklyProjects } from './projectGenerationService.js';

export const initializeCronJobs = () => {
  cron.schedule('59 23 * * 0', async () => {
    console.log('Running Sunday 11:59 PM - Resetting weekly projects...');
    
    try {
      const allProjects = await MiniProject.find({});
      
      for (const project of allProjects) {
        const completedThisWeek = project.completedTasks.filter(task => {
          const taskDate = new Date(task.completedAt);
          const weekStart = new Date(project.weekStartDate);
          return taskDate >= weekStart;
        }).length;
        
        project.lastWeekCompletedCount = completedThisWeek;
        project.availableProjects = [];
        await project.save();
      }
      
      console.log(`Reset ${allProjects.length} student projects`);
    } catch (error) {
      console.error('Error resetting projects:', error);
    }
  });

  cron.schedule('0 1 * * 1', async () => {
    console.log('Running Monday 1:00 AM - Generating weekly projects...');
    
    try {
      const allProjects = await MiniProject.find({ generationEnabled: true });
      const weekStartDate = new Date();
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);
      
      for (const project of allProjects) {
        if (project.availableProjects.length === 0) {
          const projects = await generateWeeklyProjects(project.userId);
          
          const weekNumber = project.currentWeekNumber + 1;
          project.addWeeklyGeneratedProjects(projects, weekNumber, weekStartDate, weekEndDate);
          project.weekStartDate = weekStartDate;
          await project.save();
          
          console.log(`Generated ${projects.length} AI projects for user ${project.userId} (Week ${weekNumber})`);
        }
      }
      
      console.log(`Generated projects for ${allProjects.length} students`);
    } catch (error) {
      console.error('Error generating projects:', error);
    }
  });

  console.log('Cron jobs initialized:');
  console.log('- Sunday 11:59 PM: Reset weekly projects');
  console.log('- Monday 1:00 AM: Generate new projects');
};

export const generateProjectsForNewStudent = async (userId) => {
  try {
    const miniProject = await MiniProject.findOne({ userId });
    
    if (!miniProject) {
      console.error('MiniProject not found for user:', userId);
      return;
    }
    
    if (miniProject.availableProjects.length === 0) {
      const projects = await generateWeeklyProjects(userId);
      
      if (miniProject.generationEnabled) {
        const weekStartDate = new Date();
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 7);
        
        const weekNumber = miniProject.currentWeekNumber + 1;
        miniProject.addWeeklyGeneratedProjects(projects, weekNumber, weekStartDate, weekEndDate);
      } else {
        miniProject.availableProjects = projects;
      }
      
      miniProject.weekStartDate = new Date();
      await miniProject.save();
      
      console.log(`Generated initial projects for new student ${userId}`);
    }
  } catch (error) {
    console.error('Error generating projects for new student:', error);
  }
};

export const checkAndGenerateProjects = async (userId) => {
  try {
    const miniProject = await MiniProject.findOne({ userId });
    
    if (!miniProject) {
      return;
    }
    
    if (miniProject.availableProjects.length === 0) {
      const completedThisWeek = miniProject.completedTasks.filter(task => {
        const taskDate = new Date(task.completedAt);
        const weekStart = miniProject.weekStartDate ? new Date(miniProject.weekStartDate) : new Date(0);
        return taskDate >= weekStart;
      }).length;
      
      if (completedThisWeek < 6) {
        const projects = await generateWeeklyProjects(userId);
        
        if (miniProject.generationEnabled) {
          const weekStartDate = new Date();
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 7);
          
          const weekNumber = miniProject.currentWeekNumber + 1;
          miniProject.addWeeklyGeneratedProjects(projects, weekNumber, weekStartDate, weekEndDate);
        } else {
          miniProject.availableProjects = projects;
        }
        
        miniProject.weekStartDate = new Date();
        await miniProject.save();
        
        console.log(`Generated projects for user ${userId} (had none available)`);
      }
    }
  } catch (error) {
    console.error('Error checking and generating projects:', error);
  }
};
