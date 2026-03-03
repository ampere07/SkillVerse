#!/usr/bin/env node

/**
 * Student Progress Analyzer - Standalone Cron Job
 * All-in-one script for analyzing student progress data
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPaths = [
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../.env'),
  resolve(process.cwd(), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = config({ path: envPath });
    if (result.error) {
      continue;
    }
    console.log(`✅ Environment loaded from: ${envPath}`);
    envLoaded = true;
    break;
  } catch (error) {
    continue;
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env file found, using system environment variables');
}

// Import models
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Classroom from '../models/Classroom.js';
import Assignment from '../models/Assignment.js';
import Activity from '../models/Activity.js';
import MiniProject from '../models/MiniProject.js';

// Main analyzer class
class StudentProgressAnalyzer {
  constructor() {
    this.stats = {
      totalStudents: 0,
      analyzed: 0,
      updated: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  async run() {
    try {
      console.log('='.repeat(60));
      console.log('🤖 STUDENT PROGRESS ANALYZER - CRON JOB');
      console.log(`📅 Started: ${this.stats.startTime.toISOString()}`);
      console.log('='.repeat(60));

      // Connect to database
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillverse';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');

      // Get all students
      const students = await User.find({ role: 'student' });
      this.stats.totalStudents = students.length;
      console.log(`\n📊 Found ${students.length} students to analyze`);

      // Process each student
      for (const student of students) {
        await this.processStudent(student);
      }

      // Generate final report
      await this.generateReport();

      // Close database connection
      await mongoose.connection.close();

      // Exit with appropriate code
      process.exit(this.stats.errors > 0 ? 1 : 0);

    } catch (error) {
      console.error('\n❌ CRITICAL ERROR:', error);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async processStudent(student) {
    try {
      console.log(`\n👤 Processing: ${student.name} (${student.email})`);

      // Get student's classrooms
      const classrooms = await Classroom.find({ 
        students: student._id 
      });

      if (classrooms.length === 0) {
        console.log(`  ⚠️  Not enrolled in any classroom - skipping`);
        return;
      }

      // Process each classroom
      let hasUpdates = false;
      for (const classroom of classrooms) {
        const updated = await this.updateProgressForClassroom(student, classroom);
        if (updated) hasUpdates = true;
      }

      if (hasUpdates) {
        this.stats.updated++;
      }

      this.stats.analyzed++;
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      this.stats.errors++;
    }
  }

  async updateProgressForClassroom(student, classroom) {
    try {
      // Find or create progress record
      let progress = await Progress.findOne({ 
        student: student._id, 
        classroom: classroom._id 
      });

      if (!progress) {
        progress = new Progress({
          student: student._id,
          classroom: classroom._id
        });
      }

      // Get current data
      const oldData = {
        assignments: progress.activities?.assignments?.totalSubmitted || 0,
        projects: progress.activities?.miniProjects?.completed || 0,
        lastUpdated: progress.updatedAt
      };

      // Analyze assignments
      const assignmentData = await this.analyzeAssignments(student._id, classroom._id);
      
      // Analyze mini projects
      const projectData = await this.analyzeMiniProjects(student._id);
      
      // Analyze code executions
      const codeData = await this.analyzeCodeExecutions(student._id);
      
      // Calculate language metrics
      const langMetrics = await this.calculateLanguageMetrics(student._id);

      // Update progress
      progress.activities = {
        codeExecutions: codeData,
        assignments: assignmentData,
        miniProjects: projectData,
        bugHunt: progress.activities?.bugHunt || {
          participated: 0,
          bugsFound: 0,
          bestScore: 0,
          lastParticipated: null
        }
      };

      progress.skills = {
        java: langMetrics.java,
        python: langMetrics.python
      };

      // Calculate job readiness
      progress.jobReadiness = Progress.calculateJobReadiness(progress.toObject());
      progress.jobReadiness.lastCalculated = new Date();

      // Update streaks
      await this.updateStreaks(progress, student._id);

      // Update time spent
      await this.updateTimeSpent(progress, student._id);

      // Check if there are actual changes
      const hasChanges = 
        assignmentData.totalSubmitted !== oldData.assignments ||
        projectData.completed !== oldData.projects;

      if (hasChanges) {
        await progress.save();
        console.log(`  ✅ Updated progress for ${classroom.name}`);
        console.log(`     📈 Assignments: ${oldData.assignments} → ${assignmentData.totalSubmitted}`);
        console.log(`     📁 Projects: ${oldData.projects} → ${projectData.completed}`);
      } else {
        console.log(`  ℹ️  No new data for ${classroom.name}`);
      }

      return hasChanges;

    } catch (error) {
      console.error(`  ❌ Error updating progress: ${error.message}`);
      throw error;
    }
  }

  async analyzeAssignments(studentId, classroomId) {
    const assignments = await Assignment.find({ classroom: classroomId });
    
    let totalSubmitted = 0;
    let onTime = 0;
    let late = 0;
    let totalScore = 0;
    let lastSubmission = null;

    for (const assignment of assignments) {
      const submission = assignment.submissions?.find(
        s => s.student.toString() === studentId.toString()
      );

      if (submission) {
        totalSubmitted++;
        totalScore += submission.score || 0;
        
        if (submission.submittedAt) {
          const dueDate = new Date(assignment.dueDate);
          const submittedAt = new Date(submission.submittedAt);
          
          if (submittedAt <= dueDate) {
            onTime++;
          } else {
            late++;
          }

          if (!lastSubmission || submittedAt > lastSubmission) {
            lastSubmission = submittedAt;
          }
        }
      }
    }

    return {
      totalSubmitted,
      onTime,
      late,
      averageScore: totalSubmitted > 0 ? totalScore / totalSubmitted : 0,
      lastSubmission
    };
  }

  async analyzeMiniProjects(studentId) {
    const miniProjectDoc = await MiniProject.findOne({ userId: studentId });
    
    if (!miniProjectDoc) {
      return {
        completed: 0,
        inProgress: 0,
        averageScore: 0,
        lastCompleted: null
      };
    }

    const completedTasks = miniProjectDoc.completedTasks || [];
    const inProgressTasks = miniProjectDoc.inProgressTasks || [];
    
    const completed = completedTasks.filter(t => t.status !== 'paused').length;
    const inProgress = inProgressTasks.length;
    
    const totalScore = completedTasks.reduce((sum, task) => sum + (task.score || 0), 0);
    const averageScore = completed > 0 ? totalScore / completed : 0;
    
    const lastCompleted = completedTasks.length > 0 
      ? completedTasks[completedTasks.length - 1].completedAt 
      : null;

    return {
      completed,
      inProgress,
      averageScore,
      lastCompleted
    };
  }

  async analyzeCodeExecutions(studentId) {
    const activities = await Activity.find({ 
      student: studentId,
      type: 'code'
    });

    const total = activities.length;
    const java = activities.filter(a => a.language === 'java').length;
    const python = activities.filter(a => a.language === 'python').length;
    
    const lastExecution = activities.length > 0 
      ? activities[activities.length - 1].createdAt 
      : null;

    return {
      total,
      java,
      python,
      lastExecution
    };
  }

  async calculateLanguageMetrics(studentId) {
    const miniProjectDoc = await MiniProject.findOne({ userId: studentId });
    const weeklyHistory = miniProjectDoc?.weeklyProjectHistory || [];
    const completedTasks = miniProjectDoc?.completedTasks || [];
    
    let javaProjects = 0;
    let pythonProjects = 0;
    let javaScore = 0;
    let pythonScore = 0;

    completedTasks.forEach(task => {
      let language = 'java';
      
      for (const week of weeklyHistory) {
        const javaMatch = (week.javaProjects || []).find(
          p => p.title.toLowerCase() === task.projectTitle.toLowerCase()
        );
        const pythonMatch = (week.pythonProjects || []).find(
          p => p.title.toLowerCase() === task.projectTitle.toLowerCase()
        );
        
        if (javaMatch) {
          language = 'java';
          break;
        } else if (pythonMatch) {
          language = 'python';
          break;
        }
      }
      
      if (language === 'java') {
        javaProjects++;
        javaScore += task.score || 0;
      } else {
        pythonProjects++;
        pythonScore += task.score || 0;
      }
    });

    return {
      java: {
        exercisesCompleted: 0,
        projectsCompleted: javaProjects,
        averageScore: javaProjects > 0 ? javaScore / javaProjects : 0,
        lastActivity: null,
        concepts: []
      },
      python: {
        exercisesCompleted: 0,
        projectsCompleted: pythonProjects,
        averageScore: pythonProjects > 0 ? pythonScore / pythonProjects : 0,
        lastActivity: null,
        concepts: []
      }
    };
  }

  async updateStreaks(progress, studentId) {
    const activities = await Activity.find({ 
      student: studentId 
    }).sort({ createdAt: -1 });

    const activeDates = new Set();
    activities.forEach(activity => {
      const date = activity.createdAt.toISOString().split('T')[0];
      activeDates.add(date);
    });
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    while (activeDates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    progress.streaks = {
      currentStreak,
      longestStreak: Math.max(progress.streaks?.longestStreak || 0, currentStreak),
      lastActiveDate: activities.length > 0 ? activities[0].createdAt : null,
      totalActiveDays: activeDates.size
    };
  }

  async updateTimeSpent(progress, studentId) {
    const activities = await Activity.countDocuments({ 
      student: studentId 
    });
    
    const totalMinutes = activities * 30;
    
    progress.timeSpent = {
      totalMinutes,
      thisWeek: Math.min(totalMinutes, 300),
      thisMonth: Math.min(totalMinutes, 1200),
      averagePerDay: progress.streaks?.totalActiveDays > 0 
        ? totalMinutes / progress.streaks.totalActiveDays 
        : 0,
      lastUpdated: new Date()
    };
  }

  async generateReport() {
    const duration = Date.now() - this.stats.startTime.getTime();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRON JOB EXECUTION REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`👥 Total Students: ${this.stats.totalStudents}`);
    console.log(`✅ Analyzed: ${this.stats.analyzed}`);
    console.log(`🔄 Updated: ${this.stats.updated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log(`📈 Success Rate: ${this.stats.analyzed > 0 
      ? Math.round((this.stats.updated / this.stats.analyzed) * 100) 
      : 0}%`);
    console.log('='.repeat(60));
    
    if (this.stats.errors > 0) {
      console.log('⚠️  Job completed with errors');
    } else {
      console.log('✅ Job completed successfully');
    }
  }
}

// Execute the analyzer
console.log('='.repeat(60));
console.log('🤖 STUDENT PROGRESS ANALYZER - CRON JOB STARTED');
console.log(`📅 Timestamp: ${new Date().toISOString()}`);
console.log(`📍 Working Directory: ${process.cwd()}`);
console.log(`🔧 Node.js Version: ${process.version}`);
console.log('='.repeat(60));

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease ensure these are set in your .env file or system environment.');
  process.exit(1);
}

// Create and run the analyzer
const analyzer = new StudentProgressAnalyzer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:', error);
  console.error(error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 UNHANDLED PROMISE REJECTION:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// Run the analyzer
analyzer.run()
  .then(() => {
    console.log('\n✅ Cron job completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cron job failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
