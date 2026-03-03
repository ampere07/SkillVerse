import mongoose from 'mongoose';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Classroom from '../models/Classroom.js';
import Assignment from '../models/Assignment.js';
import Activity from '../models/Activity.js';
import MiniProject from '../models/MiniProject.js';
import { calculateJobReadiness } from '../models/Progress.js';

/**
 * AI-powered student progress analyzer
 * Analyzes all student data and updates Progress model with comprehensive analytics
 */
class StudentProgressAnalyzer {
  constructor() {
    this.studentsAnalyzed = 0;
    this.studentsUpdated = 0;
    this.errors = [];
  }

  /**
   * Main function to analyze all students
   */
  async analyzeAllStudents() {
    try {
      console.log('🚀 Starting student progress analysis...');
      
      // Connect to database if not already connected
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillverse');
        console.log('✅ Connected to MongoDB');
      }

      // Get all students
      const students = await User.find({ role: 'student' });
      console.log(`📊 Found ${students.length} students to analyze`);

      // Process each student
      for (const student of students) {
        await this.analyzeStudent(student);
      }

      // Generate summary report
      this.generateSummaryReport();
      
    } catch (error) {
      console.error('❌ Error in analyzeAllStudents:', error);
      throw error;
    }
  }

  /**
   * Analyze a single student's performance
   */
  async analyzeStudent(student) {
    try {
      console.log(`\n👤 Analyzing student: ${student.name} (${student.email})`);
      
      // Get student's classrooms
      const classrooms = await Classroom.find({ 
        students: student._id 
      }).populate('teacher', 'name email');

      if (classrooms.length === 0) {
        console.log(`⚠️  Student ${student.name} is not enrolled in any classroom`);
        return;
      }

      // Analyze data for each classroom
      for (const classroom of classrooms) {
        await this.analyzeStudentForClassroom(student, classroom);
      }

      this.studentsAnalyzed++;
      
    } catch (error) {
      console.error(`❌ Error analyzing student ${student.name}:`, error);
      this.errors.push({ student: student.email, error: error.message });
    }
  }

  /**
   * Analyze student's performance for a specific classroom
   */
  async analyzeStudentForClassroom(student, classroom) {
    try {
      console.log(`  📚 Analyzing for classroom: ${classroom.name}`);

      // Get or create progress record
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

      // Analyze assignments
      const assignmentData = await this.analyzeAssignments(student._id, classroom._id);
      
      // Analyze mini projects
      const projectData = await this.analyzeMiniProjects(student._id);
      
      // Analyze bug hunt participation
      const bugHuntData = await this.analyzeBugHunt(student._id);
      
      // Analyze code executions from activities
      const codeExecutionData = await this.analyzeCodeExecutions(student._id);
      
      // Calculate language-specific metrics
      const languageMetrics = await this.calculateLanguageMetrics(student._id, projectData);
      
      // Update progress with analyzed data
      progress.activities = {
        codeExecutions: codeExecutionData,
        assignments: assignmentData,
        miniProjects: projectData,
        bugHunt: bugHuntData
      };

      progress.skills = {
        java: languageMetrics.java,
        python: languageMetrics.python
      };

      // Calculate job readiness score
      progress.jobReadiness = Progress.calculateJobReadiness(progress.toObject());
      progress.jobReadiness.lastCalculated = new Date();

      // Update streaks
      await this.updateStreaks(progress, student._id);

      // Update time spent
      await this.updateTimeSpent(progress, student._id);

      // Save progress
      await progress.save();
      this.studentsUpdated++;
      
      console.log(`  ✅ Progress updated for ${student.name} in ${classroom.name}`);
      
    } catch (error) {
      console.error(`❌ Error analyzing student ${student.name} for classroom ${classroom.name}:`, error);
      throw error;
    }
  }

  /**
   * Analyze assignment performance
   */
  async analyzeAssignments(studentId, classroomId) {
    try {
      const assignments = await Assignment.find({ 
        classroom: classroomId 
      });

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
      
    } catch (error) {
      console.error('Error analyzing assignments:', error);
      return {
        totalSubmitted: 0,
        onTime: 0,
        late: 0,
        averageScore: 0,
        lastSubmission: null
      };
    }
  }

  /**
   * Analyze mini project performance
   */
  async analyzeMiniProjects(studentId) {
    try {
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
      
    } catch (error) {
      console.error('Error analyzing mini projects:', error);
      return {
        completed: 0,
        inProgress: 0,
        averageScore: 0,
        lastCompleted: null
      };
    }
  }

  /**
   * Analyze bug hunt participation
   */
  async analyzeBugHunt(studentId) {
    try {
      // This would need to be implemented based on your bug hunt data structure
      // For now, returning default values
      return {
        participated: 0,
        bugsFound: 0,
        bestScore: 0,
        lastParticipated: null
      };
      
    } catch (error) {
      console.error('Error analyzing bug hunt:', error);
      return {
        participated: 0,
        bugsFound: 0,
        bestScore: 0,
        lastParticipated: null
      };
    }
  }

  /**
   * Analyze code execution data from activities
   */
  async analyzeCodeExecutions(studentId) {
    try {
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
      
    } catch (error) {
      console.error('Error analyzing code executions:', error);
      return {
        total: 0,
        java: 0,
        python: 0,
        lastExecution: null
      };
    }
  }

  /**
   * Calculate language-specific metrics
   */
  async calculateLanguageMetrics(studentId, projectData) {
    try {
      // Get mini project details for language breakdown
      const miniProjectDoc = await MiniProject.findOne({ userId: studentId });
      const weeklyHistory = miniProjectDoc?.weeklyProjectHistory || [];
      
      const completedTasks = miniProjectDoc?.completedTasks || [];
      
      let javaProjects = 0;
      let pythonProjects = 0;
      let javaScore = 0;
      let pythonScore = 0;

      // Categorize projects by language
      completedTasks.forEach(task => {
        let language = 'java'; // default
        
        // Check weekly history to determine language
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

      // Calculate averages
      const javaAvg = javaProjects > 0 ? javaScore / javaProjects : 0;
      const pythonAvg = pythonProjects > 0 ? pythonScore / pythonProjects : 0;

      // Get concept mastery from activities or surveys
      const javaConcepts = await this.getConceptMastery(studentId, 'java');
      const pythonConcepts = await this.getConceptMastery(studentId, 'python');

      return {
        java: {
          exercisesCompleted: 0, // Would need to be tracked separately
          projectsCompleted: javaProjects,
          averageScore: javaAvg,
          lastActivity: projectData.lastCompleted,
          concepts: javaConcepts
        },
        python: {
          exercisesCompleted: 0, // Would need to be tracked separately
          projectsCompleted: pythonProjects,
          averageScore: pythonAvg,
          lastActivity: projectData.lastCompleted,
          concepts: pythonConcepts
        }
      };
      
    } catch (error) {
      console.error('Error calculating language metrics:', error);
      return {
        java: {
          exercisesCompleted: 0,
          projectsCompleted: 0,
          averageScore: 0,
          lastActivity: null,
          concepts: []
        },
        python: {
          exercisesCompleted: 0,
          projectsCompleted: 0,
          averageScore: 0,
          lastActivity: null,
          concepts: []
        }
      };
    }
  }

  /**
   * Get concept mastery data for a language
   */
  async getConceptMastery(studentId, language) {
    try {
      // This would typically come from quiz results, activity performance, or surveys
      // For now, returning empty array
      return [];
      
    } catch (error) {
      console.error('Error getting concept mastery:', error);
      return [];
    }
  }

  /**
   * Update learning streaks
   */
  async updateStreaks(progress, studentId) {
    try {
      // Calculate current streak based on daily activity
      const activities = await Activity.find({ 
        student: studentId 
      }).sort({ createdAt: -1 });

      let currentStreak = 0;
      let longestStreak = progress.streaks?.longestStreak || 0;
      let totalActiveDays = 0;
      
      const activeDates = new Set();
      
      activities.forEach(activity => {
        const date = activity.createdAt.toISOString().split('T')[0];
        activeDates.add(date);
      });
      
      totalActiveDays = activeDates.size;
      
      // Calculate current streak (simplified)
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date();
      
      while (activeDates.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      longestStreak = Math.max(longestStreak, currentStreak);
      
      progress.streaks = {
        currentStreak,
        longestStreak,
        lastActiveDate: activities.length > 0 ? activities[0].createdAt : null,
        totalActiveDays
      };
      
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  }

  /**
   * Update time spent metrics
   */
  async updateTimeSpent(progress, studentId) {
    try {
      // This would typically track actual time spent
      // For now, calculating based on activity count
      const activities = await Activity.countDocuments({ 
        student: studentId 
      });
      
      // Estimate time (e.g., 30 minutes per activity)
      const totalMinutes = activities * 30;
      
      // Calculate weekly and monthly estimates
      const thisWeek = Math.min(totalMinutes, 300); // Max 5 hours per week
      const thisMonth = Math.min(totalMinutes, 1200); // Max 20 hours per month
      
      progress.timeSpent = {
        totalMinutes,
        thisWeek,
        thisMonth,
        averagePerDay: totalActiveDays > 0 ? totalMinutes / progress.streaks.totalActiveDays : 0,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Error updating time spent:', error);
    }
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 ANALYSIS SUMMARY REPORT');
    console.log('='.repeat(50));
    console.log(`✅ Students analyzed: ${this.studentsAnalyzed}`);
    console.log(`✅ Students updated: ${this.studentsUpdated}`);
    console.log(`❌ Errors encountered: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.student}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Analysis completed successfully!');
  }
}

// Run the analyzer if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new StudentProgressAnalyzer();
  analyzer.analyzeAllStudents()
    .then(() => {
      console.log('\n✨ All students analyzed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Analysis failed:', error);
      process.exit(1);
    });
}

export default StudentProgressAnalyzer;
