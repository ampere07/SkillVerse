import express from 'express';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Classroom from '../models/Classroom.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import {
  generateProgressInsights,
  generateLearningRecommendations,
  analyzeSkillGaps
} from '../services/aiProgressService.js';

const router = express.Router();

// Test route to verify progress routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Progress routes are working!' });
});

// Get user's XP and badge data
router.get('/stats', authenticateToken, async (req, res) => {
  console.log('[Progress] GET /stats - User ID:', req.user?.userId);
  try {
    const user = await User.findById(req.user.userId).select('xp level badges demoXP demoLevel demoBadges');
    console.log('[Progress] User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('[Progress] User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // Use demo data if available, otherwise use real data
    const xp = user.demoXP !== undefined && user.demoXP > 0 ? user.demoXP : user.xp;
    const level = user.demoLevel !== undefined && user.demoLevel > 1 ? user.demoLevel : user.level;
    const badges = user.demoBadges && user.demoBadges.length > 0 ? user.demoBadges : user.badges;

    console.log('[Progress] Returning stats - XP:', xp, 'Level:', level, 'Badges:', badges?.length || 0);
    res.json({
      success: true,
      xp,
      level,
      badges
    });
  } catch (error) {
    console.error('[Progress] Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add XP to user (called when completing projects)
router.post('/add-xp', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid XP amount is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.xp += Number(amount);

    const newLevel = Math.floor(user.xp / 500) + 1;
    const leveledUp = newLevel > user.level;
    
    if (leveledUp) {
      user.level = newLevel;
    }

    await user.save();

    res.json({
      success: true,
      xp: user.xp,
      level: user.level,
      leveledUp
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unlock a badge for user
router.post('/unlock-badge', authenticateToken, async (req, res) => {
  try {
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({ error: 'Badge ID is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.badges) {
      user.badges = [];
    }

    if (user.badges.includes(badgeId)) {
      return res.json({
        success: true,
        message: 'Badge already unlocked',
        badges: user.badges
      });
    }

    user.badges.push(badgeId);
    await user.save();

    res.json({
      success: true,
      badgeId,
      badges: user.badges,
      message: `Badge unlocked: ${badgeId}`
    });
  } catch (error) {
    console.error('Error unlocking badge:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backfill XP for existing submitted mini-projects (one-time catch-up)
router.post('/backfill-xp', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const userRole = req.user.role;

    // Allow both students and teachers to backfill XP
    const MiniProject = (await import('../models/MiniProject.js')).default;
    const { awardXp } = await import('../services/xpService.js');

    const userDoc = await User.findById(studentId).select('xp level');

    // Only backfill if user has 0 XP (never been awarded)
    if (userDoc.xp > 0) {
      return res.json({ success: true, message: 'XP already awarded', xp: userDoc.xp, level: userDoc.level });
    }

    const miniProjectDoc = await MiniProject.findOne({ userId: studentId });
    const submittedTasks = (miniProjectDoc?.completedTasks || []).filter(t => t.status !== 'paused');

    let totalAwarded = 0;
    for (const task of submittedTasks) {
      const xp = Math.round((task.score || 0) * 10);
      if (xp > 0) {
        const result = await awardXp(studentId, xp, `Backfill: ${task.projectTitle}`, 'projects');
        if (result.awarded) totalAwarded += xp;
      }
    }

    const updated = await User.findById(studentId).select('xp level');
    res.json({ success: true, xpAwarded: totalAwarded, xp: updated.xp, level: updated.level });
  } catch (error) {
    console.error('Error backfilling XP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's overall progress (not tied to specific classroom)
router.get('/student/overall', authenticateToken, async (req, res) => {
  try {
    let studentId = req.user.userId;
    const userRole = req.user.role;

    // If teacher is requesting, allow passing a studentId parameter
    if (userRole === 'teacher' && req.query.studentId) {
      studentId = req.query.studentId;
    }

    // Allow both students and teachers to access this route
    // Students can only view their own progress
    // Teachers can view their own progress or their students' progress

    // Import models to read real data
    const mongoose = (await import('mongoose')).default;
    const MiniProject = (await import('../models/MiniProject.js')).default;
    const BugHuntSession = (await import('../models/BugHuntSession.js')).default;
    const Assignment = (await import('../models/Assignment.js')).default;
    const Activity = (await import('../models/Activity.js')).default;

    // Get all progress records for the student across all classrooms
    const progressRecords = await Progress.find({ student: studentId })
      .populate('student', 'name email')
      .populate('classroom', 'name code');

    // Reset stale streaks
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    for (const p of progressRecords) {
      if (p.streaks?.lastActiveDate) {
        const lastActive = new Date(p.streaks.lastActiveDate);
        const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        if (lastActiveDate < yesterdayDate && p.streaks.currentStreak > 0) {
          p.streaks.currentStreak = 0;
          await p.save();
        }
      }
    }

    // Get current student ObjectId for queries
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // Get real mini-project data directly from MiniProject model
    const miniProjectDoc = await MiniProject.findOne({ userId: studentObjectId });
    const completedTasks = miniProjectDoc?.completedTasks || [];

    // Get real bug hunt data by aggregating sessions
    const bugHuntSessions = await BugHuntSession.find({ 
      userId: studentObjectId,
      status: { $in: ['completed', 'surrendered'] }
    });
    
    const bugHuntStats = {
      participated: bugHuntSessions.length,
      bugsFound: bugHuntSessions.reduce((total, session) => {
        const fixedInSession = (session.challenges || []).filter(c => c.isFixed).length;
        return total + fixedInSession;
      }, 0),
      bestScore: Math.max(0, ...bugHuntSessions.map(s => s.totalScore || 0)),
      lastParticipated: bugHuntSessions.length > 0 
        ? bugHuntSessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0].startedAt 
        : null
    };

    // Get real assignment data - use already declared studentObjectId for nested field query
    
    // Fetch from both Assignment and Activity models (frontend uses both for 'Assignments' metrics)
    const [allAssignments, allActivities] = await Promise.all([
      Assignment.find({ 'submissions.student': studentObjectId }),
      Activity.find({ 'submissions.student': studentObjectId })
    ]);

    console.log(`[Progress] Found ${allAssignments.length} assignments and ${allActivities.length} activities with submissions for user ${studentId}`);
    
    let totalAssignmentsSubmitted = 0;
    let assignmentsOnTime = 0;
    let assignmentsLate = 0;
    let totalAssignmentScore = 0;
    let assignmentsWithGrades = 0;
    let lastAssignmentSubmissionAt = null;

    // Helper to process submissions from both models
    const processSubmissions = (items) => {
      items.forEach(item => {
        const submission = item.submissions.find(s => s?.student && s.student.toString() === studentId.toString());
        if (submission) {
          totalAssignmentsSubmitted++;
          
          // Check if on time - if no due date, it's on time
          if (!item.dueDate || new Date(submission.submittedAt) <= new Date(item.dueDate)) {
            assignmentsOnTime++;
          } else {
            assignmentsLate++;
          }
          
          // Count score if graded
          if (submission.grade !== undefined && submission.grade !== null) {
            totalAssignmentScore += submission.grade;
            assignmentsWithGrades++;
          }
          
          // Track last submission
          if (!lastAssignmentSubmissionAt || new Date(submission.submittedAt) > new Date(lastAssignmentSubmissionAt)) {
            lastAssignmentSubmissionAt = submission.submittedAt;
          }
        }
      });
    };

    processSubmissions(allAssignments);
    processSubmissions(allActivities);

    console.log(`[Progress] Combined stats calculated: total=${totalAssignmentsSubmitted}, onTime=${assignmentsOnTime}, late=${assignmentsLate}`);

    const avgAssignmentScoreFromModel = assignmentsWithGrades > 0 ? totalAssignmentScore / assignmentsWithGrades : 0;


    // Accept any non-paused task as completed
    const submittedTasks = completedTasks.filter(t => t.status !== 'paused');


    // Separate by language by looking at weekly project history
    const weeklyHistory = miniProjectDoc?.weeklyProjectHistory || [];
    let javaProjectsCompleted = 0;
    let pythonProjectsCompleted = 0;
    let totalProjectScore = 0;

    submittedTasks.forEach(task => {
      // Look up the language from weekly history
      let lang = null;
      for (const week of weeklyHistory) {
        const javaMatch = (week.javaProjects || []).find(p => p.title.toLowerCase() === task.projectTitle.toLowerCase());
        const pythonMatch = (week.pythonProjects || []).find(p => p.title.toLowerCase() === task.projectTitle.toLowerCase());
        if (javaMatch) { lang = 'java'; break; }
        if (pythonMatch) { lang = 'python'; break; }
      }
      if (lang === 'java') javaProjectsCompleted++;
      else if (lang === 'python') pythonProjectsCompleted++;
      else javaProjectsCompleted++; // Fallback: default to java if can't determine
      totalProjectScore += task.score || 0;
    });


    const avgProjectScore = submittedTasks.length > 0 ? totalProjectScore / submittedTasks.length : 0;

    // Get real user XP and level
    const userDoc = await User.findById(studentObjectId).select('xp level enrolledCourses');
    const totalXp = userDoc?.xp || 0;

    // Calculate per-language average scores
    let javaAvgScore = 0;
    let pythonAvgScore = 0;
    if (javaProjectsCompleted > 0 || pythonProjectsCompleted > 0) {
      let javaTotalScore = 0;
      let pythonTotalScore = 0;
      submittedTasks.forEach(task => {
        let lang = null;
        for (const week of weeklyHistory) {
          if ((week.javaProjects || []).find(p => p.title.toLowerCase() === task.projectTitle.toLowerCase())) { lang = 'java'; break; }
          if ((week.pythonProjects || []).find(p => p.title.toLowerCase() === task.projectTitle.toLowerCase())) { lang = 'python'; break; }
        }
        if (lang === 'java') javaTotalScore += task.score || 0;
        else if (lang === 'python') pythonTotalScore += task.score || 0;
        else javaTotalScore += task.score || 0; // fallback
      });
      javaAvgScore = javaProjectsCompleted > 0 ? javaTotalScore / javaProjectsCompleted : 0;
      pythonAvgScore = pythonProjectsCompleted > 0 ? pythonTotalScore / pythonProjectsCompleted : 0;
    }

    if (progressRecords.length === 0) {
      // Build progress from mini-project data even if no classroom progress exists
      const defaultProgress = {
        student: { _id: studentId, name: req.user.name, email: req.user.email },
        classroom: null,
        skills: {
          java: { exercisesCompleted: 0, projectsCompleted: javaProjectsCompleted, averageScore: javaAvgScore, lastActivity: null, concepts: [] },
          python: { exercisesCompleted: 0, projectsCompleted: pythonProjectsCompleted, averageScore: pythonAvgScore, lastActivity: null, concepts: [] }
        },
        activities: {
          codeExecutions: { total: 0, java: 0, python: 0, lastExecution: null },
          assignments: { 
            totalSubmitted: totalAssignmentsSubmitted, 
            onTime: assignmentsOnTime, 
            late: assignmentsLate, 
            averageScore: avgAssignmentScoreFromModel, 
            lastSubmission: lastAssignmentSubmissionAt 
          },
          miniProjects: { completed: submittedTasks.length, inProgress: 0, averageScore: avgProjectScore, lastCompleted: submittedTasks[submittedTasks.length - 1]?.completedAt || null },
          bugHunt: { 
            participated: bugHuntStats.participated, 
            bugsFound: bugHuntStats.bugsFound, 
            bestScore: bugHuntStats.bestScore, 
            lastParticipated: bugHuntStats.lastParticipated
          }
        },
        jobReadiness: { overallScore: 0, problemSolving: 0, codeQuality: 0, efficiency: 0, collaboration: 0, consistency: 0, lastCalculated: new Date() },
        streaks: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalActiveDays: 0 },
        timeSpent: { totalMinutes: 0, thisWeek: 0, thisMonth: 0, averagePerDay: 0, lastUpdated: new Date() },
        aiInteractions: { hintsRequested: 0, feedbackReceived: 0, lastHintAt: null, lastFeedbackAt: null },
        totalXp,
        level: userDoc?.level || 1,
        detailedAiAnalysis: null
      };

      defaultProgress.jobReadiness = Progress.calculateJobReadiness(defaultProgress);

      return res.json({
        success: true,
        progress: defaultProgress
      });
    }

    // Aggregate progress across all classrooms
    const aggregatedProgress = {
      student: progressRecords[0].student,
      classroom: null, // Overall progress, not classroom-specific
      skills: {
        java: { exercisesCompleted: 0, projectsCompleted: 0, averageScore: 0, lastActivity: null, concepts: [] },
        python: { exercisesCompleted: 0, projectsCompleted: 0, averageScore: 0, lastActivity: null, concepts: [] }
      },
      activities: {
        codeExecutions: { total: 0, java: 0, python: 0, lastExecution: null },
        assignments: { totalSubmitted: 0, onTime: 0, late: 0, averageScore: 0, lastSubmission: null },
        miniProjects: { completed: 0, inProgress: 0, averageScore: 0, lastCompleted: null },
        bugHunt: { participated: 0, bugsFound: 0, bestScore: 0, lastParticipated: null }
      },
      aiInteractions: { hintsRequested: 0, feedbackReceived: 0, lastHintAt: null, lastFeedbackAt: null },
      jobReadiness: {
        overallScore: 0,
        problemSolving: 0,
        codeQuality: 0,
        efficiency: 0,
        collaboration: 0,
        consistency: 0,
        lastCalculated: new Date()
      },
      streaks: {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        totalActiveDays: 0
      },
      timeSpent: {
        totalMinutes: 0,
        thisWeek: 0,
        thisMonth: 0,
        averagePerDay: 0,
        lastUpdated: new Date()
      },
      detailedAiAnalysis: null,
      previousAiAnalysis: null
    };

    // Aggregate all the data
    progressRecords.forEach(progress => {
      // Aggregate skills
      ['java', 'python'].forEach(lang => {
        aggregatedProgress.skills[lang].exercisesCompleted += progress.skills[lang].exercisesCompleted;
        aggregatedProgress.skills[lang].projectsCompleted += progress.skills[lang].projectsCompleted;

        // Keep the most recent activity
        if (progress.skills[lang].lastActivity &&
          (!aggregatedProgress.skills[lang].lastActivity ||
            new Date(progress.skills[lang].lastActivity) > new Date(aggregatedProgress.skills[lang].lastActivity))) {
          aggregatedProgress.skills[lang].lastActivity = progress.skills[lang].lastActivity;
        }
      });

      // Aggregate activities
      aggregatedProgress.activities.codeExecutions.total += progress.activities.codeExecutions.total;
      aggregatedProgress.activities.codeExecutions.java += progress.activities.codeExecutions.java;
      aggregatedProgress.activities.codeExecutions.python += progress.activities.codeExecutions.python;

      // Use real bug hunt data from specialized model instead of just aggregating classroom records
      aggregatedProgress.activities.bugHunt.participated = bugHuntStats.participated;
      aggregatedProgress.activities.bugHunt.bugsFound = bugHuntStats.bugsFound;
      aggregatedProgress.activities.bugHunt.bestScore = bugHuntStats.bestScore;
      aggregatedProgress.activities.bugHunt.lastParticipated = bugHuntStats.lastParticipated;

      // Aggregate AI interactions
      if (progress.aiInteractions) {
        aggregatedProgress.aiInteractions.hintsRequested += progress.aiInteractions.hintsRequested || 0;
        aggregatedProgress.aiInteractions.feedbackReceived += progress.aiInteractions.feedbackReceived || 0;
        if (progress.aiInteractions.lastHintAt && (!aggregatedProgress.aiInteractions.lastHintAt || new Date(progress.aiInteractions.lastHintAt) > new Date(aggregatedProgress.aiInteractions.lastHintAt))) {
          aggregatedProgress.aiInteractions.lastHintAt = progress.aiInteractions.lastHintAt;
        }
        if (progress.aiInteractions.lastFeedbackAt && (!aggregatedProgress.aiInteractions.lastFeedbackAt || new Date(progress.aiInteractions.lastFeedbackAt) > new Date(aggregatedProgress.aiInteractions.lastFeedbackAt))) {
          aggregatedProgress.aiInteractions.lastFeedbackAt = progress.aiInteractions.lastFeedbackAt;
        }
      }

      // Keep most recent dates
      if (progress.activities.codeExecutions.lastExecution &&
        (!aggregatedProgress.activities.codeExecutions.lastExecution ||
          new Date(progress.activities.codeExecutions.lastExecution) > new Date(aggregatedProgress.activities.codeExecutions.lastExecution))) {
        aggregatedProgress.activities.codeExecutions.lastExecution = progress.activities.codeExecutions.lastExecution;
      }

      if (progress.activities.assignments.lastSubmission &&
        (!aggregatedProgress.activities.assignments.lastSubmission ||
          new Date(progress.activities.assignments.lastSubmission) > new Date(aggregatedProgress.activities.assignments.lastSubmission))) {
        aggregatedProgress.activities.assignments.lastSubmission = progress.activities.assignments.lastSubmission;
      }

      if (progress.activities.miniProjects.lastCompleted &&
        (!aggregatedProgress.activities.miniProjects.lastCompleted ||
          new Date(progress.activities.miniProjects.lastCompleted) > new Date(aggregatedProgress.activities.miniProjects.lastCompleted))) {
        aggregatedProgress.activities.miniProjects.lastCompleted = progress.activities.miniProjects.lastCompleted;
      }

      if (progress.activities.bugHunt.lastParticipated &&
        (!aggregatedProgress.activities.bugHunt.lastParticipated ||
          new Date(progress.activities.bugHunt.lastParticipated) > new Date(aggregatedProgress.activities.bugHunt.lastParticipated))) {
        aggregatedProgress.activities.bugHunt.lastParticipated = progress.activities.bugHunt.lastParticipated;
      }

      // Update streaks (use the most recent)
      if (progress.streaks.lastActiveDate &&
        (!aggregatedProgress.streaks.lastActiveDate ||
          new Date(progress.streaks.lastActiveDate) > new Date(aggregatedProgress.streaks.lastActiveDate))) {
        aggregatedProgress.streaks = { ...progress.streaks };
      }

      // Aggregate time spent
      aggregatedProgress.timeSpent.totalMinutes += progress.timeSpent.totalMinutes;
      aggregatedProgress.timeSpent.thisWeek += progress.timeSpent.thisWeek;
      aggregatedProgress.timeSpent.thisMonth += progress.timeSpent.thisMonth;

      // Keep latest detailed AI analysis
      if (progress.detailedAiAnalysis?.generatedAt &&
        (!aggregatedProgress.detailedAiAnalysis?.generatedAt ||
          new Date(progress.detailedAiAnalysis.generatedAt) > new Date(aggregatedProgress.detailedAiAnalysis.generatedAt))) {
        
        const data = progress.detailedAiAnalysis.toObject ? progress.detailedAiAnalysis.toObject() : { ...progress.detailedAiAnalysis };
        // Ensure debugging and logic keys exist for old records or records using old schema names
        if (data.debuggingSkillsScore === undefined) data.debuggingSkillsScore = data.efficiencyScore || progress.jobReadiness?.efficiency || 0;
        if (data.projectMasteryScore === undefined) data.projectMasteryScore = data.collaborationScore || progress.jobReadiness?.collaboration || 0;
        
        // Handle descriptions - check multiple possible historical keys
        if (!data.debuggingSkills) {
          data.debuggingSkills = data.debugging || data.efficiency || "";
        }
        if (!data.projectMastery) {
          data.projectMastery = data.logic || data.collaboration || "";
        }
        
        aggregatedProgress.detailedAiAnalysis = data;
      }
      
      // Keep latest previous AI analysis
      if (progress.previousAiAnalysis?.generatedAt &&
        (!aggregatedProgress.previousAiAnalysis?.generatedAt ||
          new Date(progress.previousAiAnalysis.generatedAt) > new Date(aggregatedProgress.previousAiAnalysis.generatedAt))) {
        
        const prev = progress.previousAiAnalysis.toObject ? progress.previousAiAnalysis.toObject() : { ...progress.previousAiAnalysis };
        // Ensure debugging and logic keys exist for old records
        if (prev.debuggingSkillsScore === undefined) prev.debuggingSkillsScore = prev.efficiencyScore || progress.jobReadiness?.efficiency || 0;
        if (prev.projectMasteryScore === undefined) prev.projectMasteryScore = prev.collaborationScore || progress.jobReadiness?.collaboration || 0;
        
        // Handle descriptions - check multiple possible historical keys
        if (!prev.debuggingSkills) {
          // If the fallback (efficiency) is a string, use it. If it's likely a score record, use baseline text.
          const fallback = prev.debugging || prev.efficiency;
          prev.debuggingSkills = (typeof fallback === 'string' && fallback.length > 5) ? fallback : "Initial baseline assessment.";
        }
        if (!prev.projectMastery) {
          const fallback = prev.logic || prev.collaboration;
          prev.projectMastery = (typeof fallback === 'string' && fallback.length > 5) ? fallback : "Initial baseline assessment.";
        }
        
        aggregatedProgress.previousAiAnalysis = prev;
      }
    });

    // If still no previous analysis, create a synthetic one from jobReadiness baseline
    if (!aggregatedProgress.previousAiAnalysis?.generatedAt && aggregatedProgress.jobReadiness?.overallScore > 0) {
      const jr = aggregatedProgress.jobReadiness;
      aggregatedProgress.previousAiAnalysis = {
        generatedAt: new Date(Date.now() - 86400000), // 1 day ago
        problemSolvingScore: jr.problemSolving || 0,
        codeQualityScore: jr.codeQuality || 0,
        debuggingSkillsScore: jr.efficiency || 0,
        projectMasteryScore: jr.collaboration || 0,
        consistencyScore: jr.consistency || 0,
        overallScore: jr.overallScore || 0,
        problemSolving: "Initial baseline analysis.",
        codeQuality: "Initial baseline analysis.",
        debuggingSkills: "Initial baseline analysis.",
        projectMastery: "Initial baseline analysis.",
        consistency: "Initial baseline analysis.",
        overall: "Initial baseline analysis."
      };
    }

    // Calculate average scores
    const totalJavaExercises = aggregatedProgress.skills.java.exercisesCompleted;
    const totalPythonExercises = aggregatedProgress.skills.python.exercisesCompleted;

    progressRecords.forEach(progress => {
      if (totalJavaExercises > 0) {
        aggregatedProgress.skills.java.averageScore +=
          (progress.skills.java.averageScore * progress.skills.java.exercisesCompleted) / totalJavaExercises;
      }
      if (totalPythonExercises > 0) {
        aggregatedProgress.skills.python.averageScore +=
          (progress.skills.python.averageScore * progress.skills.python.exercisesCompleted) / totalPythonExercises;
      }
    });

    // Average day calculation already done
    if (aggregatedProgress.streaks.totalActiveDays > 0) {
      aggregatedProgress.timeSpent.averagePerDay =
        aggregatedProgress.timeSpent.totalMinutes / aggregatedProgress.streaks.totalActiveDays;
    }

    // Calculate average per day
    if (aggregatedProgress.streaks.totalActiveDays > 0) {
      aggregatedProgress.timeSpent.averagePerDay =
        aggregatedProgress.timeSpent.totalMinutes / aggregatedProgress.streaks.totalActiveDays;
    }

    // Merge in real mini-project data from MiniProject model (overrides classroom progress data)
    aggregatedProgress.skills.java.projectsCompleted += javaProjectsCompleted;
    aggregatedProgress.skills.python.projectsCompleted += pythonProjectsCompleted;

    // Use real mini-project counts (submitted tasks are ground truth)
    if (submittedTasks.length > 0) {
      aggregatedProgress.activities.miniProjects.completed = Math.max(
        aggregatedProgress.activities.miniProjects.completed,
        submittedTasks.length
      );
      aggregatedProgress.activities.miniProjects.averageScore = avgProjectScore;
      const lastCompleted = submittedTasks[submittedTasks.length - 1]?.completedAt;
      if (lastCompleted) aggregatedProgress.activities.miniProjects.lastCompleted = lastCompleted;
    }

    // Update Java/Python averageScore using per-language project scores
    if (javaProjectsCompleted > 0) {
      aggregatedProgress.skills.java.averageScore = javaAvgScore;
    }
    if (pythonProjectsCompleted > 0) {
      aggregatedProgress.skills.python.averageScore = pythonAvgScore;
    }

    // Explicitly set real assignment activity data
    aggregatedProgress.activities.assignments.totalSubmitted = totalAssignmentsSubmitted;
    aggregatedProgress.activities.assignments.onTime = assignmentsOnTime;
    aggregatedProgress.activities.assignments.late = assignmentsLate;
    aggregatedProgress.activities.assignments.averageScore = avgAssignmentScoreFromModel;
    aggregatedProgress.activities.assignments.lastSubmission = lastAssignmentSubmissionAt;

    // Add real XP, level, and enrollment from User model for accurate scaling
    aggregatedProgress.totalXp = totalXp;
    aggregatedProgress.level = userDoc?.level || 1;
    aggregatedProgress.enrolledCourses = userDoc?.enrolledCourses || [];

    // Calculate overall job readiness
    aggregatedProgress.jobReadiness = Progress.calculateJobReadiness(aggregatedProgress);

    console.log(`[Progress] Returning aggregated progress for user ${studentId}. Analysis found: ${!!aggregatedProgress.detailedAiAnalysis}`);

    res.json({
      success: true,
      progress: aggregatedProgress
    });
  } catch (error) {
    console.error('Error fetching overall student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message
    });
  }
});

// Get student's progress in a specific classroom
router.get('/student/:classroomId', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const studentId = req.user.userId;

    // Find or create progress record
    let progress = await Progress.findOne({ student: studentId, classroom: classroomId })
      .populate('student', 'name email')
      .populate('classroom', 'name code');

    if (!progress) {
      // Create new progress record if it doesn't exist
      progress = new Progress({
        student: studentId,
        classroom: classroomId
      });

      // Get user's primary language for initial skill setup
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(studentId);

      if (user && user.primaryLanguage) {
        progress.skills[user.primaryLanguage].lastActivity = new Date();
      }

      await progress.save();

      // Re-populate for response
      progress = await Progress.findOne({ student: studentId, classroom: classroomId })
        .populate('student', 'name email')
        .populate('classroom', 'name code');
    }

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message
    });
  }
});

// Get instructor view of all students' progress in a classroom
router.get('/instructor/:classroomId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Verify teacher has access to this classroom
    const classroom = await Classroom.findOne({ _id: classroomId, teacher: req.user.userId });
    if (!classroom) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this classroom'
      });
    }

    // Get all students' progress in this classroom
    const progressList = await Progress.find({ classroom: classroomId })
      .populate('student', 'name email')
      .populate('classroom', 'name code')
      .sort({ 'jobReadiness.overallScore': -1 });

    // Calculate class statistics
    const stats = {
      totalStudents: progressList.length,
      averageJobReadiness: 0,
      topPerformers: [],
      atRiskStudents: [],
      skillDistribution: {
        java: { beginner: 0, intermediate: 0, advanced: 0 },
        python: { beginner: 0, intermediate: 0, advanced: 0 }
      }
    };

    if (progressList.length > 0) {
      // Calculate average job readiness
      const totalScore = progressList.reduce((sum, p) => sum + p.jobReadiness.overallScore, 0);
      stats.averageJobReadiness = Math.round(totalScore / progressList.length);

      // Identify top performers (top 20%)
      const topCount = Math.ceil(progressList.length * 0.2);
      stats.topPerformers = progressList.slice(0, topCount).map(p => ({
        studentId: p.student._id,
        name: p.student.name,
        score: p.jobReadiness.overallScore,
        streak: p.streaks.currentStreak
      }));

      // Identify at-risk students (bottom 20% or score < 40)
      stats.atRiskStudents = progressList.filter(p =>
        p.jobReadiness.overallScore < 40 ||
        progressList.indexOf(p) >= progressList.length - Math.ceil(progressList.length * 0.2)
      ).map(p => ({
        studentId: p.student._id,
        name: p.student.name,
        score: p.jobReadiness.overallScore,
        lastActive: p.streaks.lastActiveDate,
        concerns: []
      }));

      // Calculate skill distribution
      progressList.forEach(p => {
        ['java', 'python'].forEach(lang => {
          const avgScore = p.skills[lang].averageScore || 0;
          if (avgScore < 40) stats.skillDistribution[lang].beginner++;
          else if (avgScore < 70) stats.skillDistribution[lang].intermediate++;
          else stats.skillDistribution[lang].advanced++;
        });
      });
    }

    res.json({
      success: true,
      progressList,
      stats
    });
  } catch (error) {
    console.error('Error fetching class progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class progress',
      error: error.message
    });
  }
});

// Update progress after activity completion
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const {
      classroomId,
      activityType, // 'assignment', 'miniproject', 'code_execution', 'bug_hunt'
      data
    } = req.body;

    const studentId = req.user.userId;

    // Find progress record
    let progress = await Progress.findOne({ student: studentId, classroom: classroomId });
    if (!progress) {
      progress = new Progress({
        student: studentId,
        classroom: classroomId
      });
    }

    // Update based on activity type
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (activityType) {
      case 'assignment':
        progress.activities.assignments.totalSubmitted++;
        if (data.onTime) progress.activities.assignments.onTime++;
        else progress.activities.assignments.late++;
        if (data.score) {
          const total = progress.activities.assignments.averageScore * (progress.activities.assignments.totalSubmitted - 1);
          progress.activities.assignments.averageScore = (total + data.score) / progress.activities.assignments.totalSubmitted;
        }
        progress.activities.assignments.lastSubmission = now;

        // Update language-specific progress
        if (data.language) {
          progress.skills[data.language].exercisesCompleted++;
          progress.skills[data.language].lastActivity = now;
        }
        break;

      case 'miniproject':
        progress.activities.miniProjects.completed++;
        if (data.score) {
          const total = progress.activities.miniProjects.averageScore * (progress.activities.miniProjects.completed - 1);
          progress.activities.miniProjects.averageScore = (total + data.score) / progress.activities.miniProjects.completed;
        }
        progress.activities.miniProjects.lastCompleted = now;

        if (data.language) {
          progress.skills[data.language].projectsCompleted++;
          progress.skills[data.language].lastActivity = now;
        }
        break;

      case 'code_execution':
        progress.activities.codeExecutions.total++;
        if (data.language) {
          progress.activities.codeExecutions[data.language]++;
        }
        progress.activities.codeExecutions.lastExecution = now;
        break;

      case 'bug_hunt':
        progress.activities.bugHunt.participated++;
        if (data.bugsFound) progress.activities.bugHunt.bugsFound += data.bugsFound;
        if (data.score && data.score > progress.activities.bugHunt.bestScore) {
          progress.activities.bugHunt.bestScore = data.score;
        }
        progress.activities.bugHunt.lastParticipated = now;
        break;
    }

    // Update streaks
    if (!progress.streaks.lastActiveDate ||
      progress.streaks.lastActiveDate < today) {
      // Check if yesterday was active
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (progress.streaks.lastActiveDate &&
        progress.streaks.lastActiveDate >= yesterday) {
        progress.streaks.currentStreak++;
      } else {
        progress.streaks.currentStreak = 1;
      }

      progress.streaks.lastActiveDate = today;
      progress.streaks.totalActiveDays++;

      if (progress.streaks.currentStreak > progress.streaks.longestStreak) {
        progress.streaks.longestStreak = progress.streaks.currentStreak;
      }
    }

    // Update time spent
    if (data.timeSpentMinutes) {
      progress.timeSpent.totalMinutes += data.timeSpentMinutes;
      progress.timeSpent.thisWeek += data.timeSpentMinutes;
      progress.timeSpent.thisMonth += data.timeSpentMinutes;
      progress.timeSpent.averagePerDay = progress.timeSpent.totalMinutes / progress.streaks.totalActiveDays;
      progress.timeSpent.lastUpdated = now;
    }

    // Recalculate job readiness
    progress.jobReadiness = Progress.calculateJobReadiness(progress);

    await progress.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      progress
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
});

// Get detailed progress analytics for a student
router.get('/analytics/:studentId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classroomId, timeframe = '30d' } = req.query;

    // Verify teacher has access
    if (classroomId) {
      const classroom = await Classroom.findOne({ _id: classroomId, teacher: req.user.userId });
      if (!classroom) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this classroom'
        });
      }
    }

    // Get progress data
    const progress = await Progress.findOne({
      student: studentId,
      ...(classroomId && { classroom: classroomId })
    }).populate('student', 'name email');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress data not found'
      });
    }

    // Generate recommendations
    const recommendations = generateRecommendations(progress);

    const analytics = {
      currentLevel: {
        overall: progress.jobReadiness.overallScore,
        problemSolving: progress.jobReadiness.problemSolving,
        codeQuality: progress.jobReadiness.codeQuality,
        efficiency: progress.jobReadiness.efficiency,
        collaboration: progress.jobReadiness.collaboration,
        consistency: progress.jobReadiness.consistency
      },
      activities: progress.activities,
      skills: progress.skills,
      streaks: progress.streaks,
      timeSpent: progress.timeSpent,
      recommendations
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// AI-powered progress insights
router.post('/ai-insights/:classroomId', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Allow both students and teachers to generate insights for themselves
    console.log(`[Progress] Generating AI insights for user ${userId} in classroom ${classroomId}`);

    const insights = await generateProgressInsights(userId, classroomId);

    res.json({
      success: true,
      insights,
      message: 'AI insights generated successfully'
    });
  } catch (error) {
    console.error('[Progress] Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    });
  }
});

// AI-powered learning recommendations
router.post('/ai-recommendations/:classroomId', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Allow both students and teachers to generate recommendations for themselves
    console.log(`[Progress] Generating AI recommendations for user ${userId} in classroom ${classroomId}`);

    const recommendations = await generateLearningRecommendations(userId, classroomId);

    res.json({
      success: true,
      recommendations,
      message: 'AI recommendations generated successfully'
    });
  } catch (error) {
    console.error('[Progress] Error generating AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations',
      error: error.message
    });
  }
});

// AI-powered skill gap analysis
router.post('/skill-gap-analysis/:classroomId', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Allow both students and teachers to analyze skill gaps for themselves
    console.log(`[Progress] Analyzing skill gaps for user ${userId} in classroom ${classroomId}`);

    const analysis = await analyzeSkillGaps(userId, classroomId);

    res.json({
      success: true,
      analysis,
      message: 'Skill gap analysis completed successfully'
    });
  } catch (error) {
    console.error('[Progress] Error analyzing skill gaps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze skill gaps',
      error: error.message
    });
  }
});

// AI-powered skill weakness analysis (does NOT require classroomId)
router.post('/skill-weakness-analysis', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { generateWithRetry } = await import('../services/geminiService.js');
    const MiniProject = (await import('../models/MiniProject.js')).default;

    // Gather all progress records
    const progressRecords = await Progress.find({ student: userId });
    const userDoc = await User.findById(userId).select('xp level name firstName lastName primaryLanguage');
    const miniProjectDoc = await MiniProject.findOne({ userId });

    // Build aggregated stats
    const submittedTasks = (miniProjectDoc?.completedTasks || []).filter(t => t.status !== 'paused');

    const Activity = (await import('../models/Activity.js')).default;
    const mongoose = (await import('mongoose')).default;

    // Count actual pending assignments
    const pendingActivities = await Activity.find({
      $or: [
        { 'students.studentId': userId },
        { 
          classroom: { $in: (await Classroom.find({ 'students.studentId': userId })).map(c => c._id) }
        }
      ],
      isPublished: true,
      'submissions.student': { $nin: [userId] }
    });
    const pendingAssignmentsCount = pendingActivities.length;

    // Gather technical context from AI feedback
    const technicalFeedback = submittedTasks
      .map(t => t.aiAnalyization)
      .filter(f => f && f.length > 10)
      .slice(-5); // Use last 5 feedbacks for context

    const avgProjectScore = submittedTasks.length > 0
      ? submittedTasks.reduce((sum, t) => sum + (t.score || 0), 0) / submittedTasks.length
      : 0;

    // Aggregate job readiness from progress records or build defaults
    let jobReadiness = { overallScore: 0, problemSolving: 0, codeQuality: 0, efficiency: 0, collaboration: 0, consistency: 0 };
    let totalCodeExecutions = 0;
    let totalAssignments = 0;
    let assignmentsOnTime = 0;
    let currentStreak = 0;
    let totalActiveDays = 0;
    let totalMinutes = 0;
    let bugHuntParticipated = 0;
    let bugsFound = 0;

    if (progressRecords.length > 0) {
      progressRecords.forEach(p => {
        totalCodeExecutions += p.activities?.codeExecutions?.total || 0;
        totalAssignments += p.activities?.assignments?.totalSubmitted || 0;
        assignmentsOnTime += p.activities?.assignments?.onTime || 0;
        bugHuntParticipated += p.activities?.bugHunt?.participated || 0;
        bugsFound += p.activities?.bugHunt?.bugsFound || 0;
        totalActiveDays += p.streaks?.totalActiveDays || 0;
        totalMinutes += p.timeSpent?.totalMinutes || 0;
        if (p.streaks?.currentStreak > currentStreak) currentStreak = p.streaks.currentStreak;
      });
      // Use latest calculated job readiness
      const latestWithJR = progressRecords.find(p => p.jobReadiness?.overallScore > 0);
      if (latestWithJR) jobReadiness = latestWithJR.jobReadiness;
    }

    // Build the prompt
    const studentName = userDoc?.name || `${userDoc?.firstName || ''} ${userDoc?.lastName || ''}`.trim() || 'Student';
    const prompt = `You are an AI learning coach. Analyze this student's programming learning data and identify their KEY WEAKNESSES and provide SPECIFIC, ACTIONABLE ways to improve.

STUDENT: ${studentName}
PRIMARY LANGUAGE: ${userDoc?.primaryLanguage || 'Not set'}
LEVEL: ${userDoc?.level || 1}

SKILLS ASSESSMENT SCORES:
- Problem Solving: ${Math.round(jobReadiness.problemSolving)}%
- Code Quality: ${Math.round(jobReadiness.codeQuality)}%
- Efficiency: ${Math.round(jobReadiness.efficiency)}%
- Collaboration/Logic: ${Math.round(jobReadiness.collaboration)}%
- Consistency: ${Math.round(jobReadiness.consistency)}%
- Pending Assignments: ${pendingAssignmentsCount}

PAST AI CODING FEEDBACK SAMPLES:
${technicalFeedback.length > 0 ? technicalFeedback.join('\n---\n') : 'No feedback samples available yet.'}

Respond in STRICT JSON format ONLY:
{
  "weaknesses": [
    {
      "area": "Specific technical concept (e.g. Recursion, Error Handling, Loop Efficiency)",
      "severity": "High" or "Medium" or "Low",
      "description": "A technical description of why their code logic is struggling (e.g., 'Student frequently misses edge cases in conditional logic')"
    }
  ],
  "improvements": [
    {
      "title": "Technical drill or conceptual study",
      "description": "Logic-based advice (e.g., 'Practice dry-running loops with corner cases')",
      "priority": "High" or "Medium" or "Low",
      "estimatedTime": "e.g., 30 mins/day"
    }
  ],
  "summary": "Overall technical proficiency summary"
}

Return 3-5 weaknesses and 3-5 improvements. 

CRITICAL CONSTRAINTS:
1. DO NOT identify 'lack of engagement' or 'not enough activity' as a weakness. Assume the student is active.
2. DO NOT recommend 'completing more assignments' or 'increasing activity frequency' as a way to improve scores.
3. THE WEAKNESSES MUST BE CODING-SPECIFIC (e.g., memory management, syntactic precision, logic flow, modularity).
4. THE RECOMMENDATIONS MUST BE CONCEPTUAL OR LOGIC-BASED (e.g., study a specific pattern, refactor a certain type of logic).
5. Focus on identifying specific conceptual hurdles inferred from their scores and feedback samples.
Return ONLY the JSON.`;

    const response = await generateWithRetry(prompt, { temperature: 0.4, num_predict: 800 });
    const content = response.message.content;

    // Parse the response
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    let analysis = { weaknesses: [], improvements: [], summary: '' };

    if (startIdx !== -1 && endIdx !== -1) {
      try {
        const jsonStr = content.substring(startIdx, endIdx + 1);
        analysis = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error('[Progress] Failed to parse AI weakness analysis:', parseErr.message);
        // Attempt cleanup
        try {
          let cleaned = content.substring(startIdx, endIdx + 1)
            .replace(/```json\n?|```/g, '')
            .replace(/[\x00-\x1F\x7F]/g, ' ');
          analysis = JSON.parse(cleaned);
        } catch (e2) {
          console.error('[Progress] Second parse attempt failed');
        }
      }
    }

    res.json({
      success: true,
      analysis,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('[Progress] Error generating skill weakness analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate skill weakness analysis',
      error: error.message
    });
  }
});

// Detailed AI Analysis
router.post('/detailed-ai-analysis', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { generateWithRetry } = await import('../services/geminiService.js');
    const MiniProject = (await import('../models/MiniProject.js')).default;

    // Gather all progress records
    const progressRecords = await Progress.find({ student: userId });
    const userDoc = await User.findById(userId).select('xp level name firstName lastName primaryLanguage');
    const miniProjectDoc = await MiniProject.findOne({ userId });

    const Activity = (await import('../models/Activity.js')).default;
    const mongoose = (await import('mongoose')).default;

    // Build aggregated stats
    const submittedTasks = (miniProjectDoc?.completedTasks || []).filter(t => t.status !== 'paused');
    const avgProjectScore = submittedTasks.length > 0
      ? submittedTasks.reduce((sum, t) => sum + (t.score || 0), 0) / submittedTasks.length
      : 0;

    // Count actual pending assignments from Activity model
    const pendingActivities = await Activity.find({
      $or: [
        { 'students.studentId': userId },
        { 
          // Also check if assigned via classroom (if students array is empty or this student is in the classroom)
          classroom: { $in: (await Classroom.find({ 'students.studentId': userId })).map(c => c._id) }
        }
      ],
      isPublished: true,
      'submissions.student': { $ne: userId }
    });
    const pendingAssignmentsCount = pendingActivities.length;

    let jobReadiness = { overallScore: 0, problemSolving: 0, codeQuality: 0, efficiency: 0, collaboration: 0, consistency: 0 };
    let totalCodeExecutions = 0;
    let totalAssignments = 0;
    let assignmentsOnTime = 0;
    let currentStreak = 0;
    let totalActiveDays = 0;
    let totalMinutes = 0;
    let bugHuntParticipated = 0;
    let bugsFound = 0;

    let latestJavaScore = 0;
    let latestPythonScore = 0;
    let javaProjects = 0;
    let pythonProjects = 0;

    if (progressRecords.length > 0) {
      progressRecords.forEach(p => {
        totalCodeExecutions += p.activities?.codeExecutions?.total || 0;
        totalAssignments += p.activities?.assignments?.totalSubmitted || 0;
        assignmentsOnTime += p.activities?.assignments?.onTime || 0;
        bugHuntParticipated += p.activities?.bugHunt?.participated || 0;
        bugsFound += p.activities?.bugHunt?.bugsFound || 0;
        totalActiveDays += p.streaks?.totalActiveDays || 0;
        totalMinutes += p.timeSpent?.totalMinutes || 0;
        if (p.streaks?.currentStreak > currentStreak) currentStreak = p.streaks.currentStreak;
      });
      const latestWithJR = progressRecords.find(p => p.jobReadiness?.overallScore > 0);
      if (latestWithJR) jobReadiness = latestWithJR.jobReadiness;

      // Get latest skill metrics
      const latestProgress = progressRecords[progressRecords.length - 1];
      if (latestProgress?.skills) {
        latestJavaScore = latestProgress.skills.java?.averageScore || 0;
        javaProjects = latestProgress.skills.java?.projectsCompleted || 0;
        latestPythonScore = latestProgress.skills.python?.averageScore || 0;
        pythonProjects = latestProgress.skills.python?.projectsCompleted || 0;
      }
    }
    const studentName = userDoc?.name || `${userDoc?.firstName || ''} ${userDoc?.lastName || ''}`.trim() || 'Student';
    const currentPhase = Math.ceil((userDoc?.level || 1) / 3);
    const phaseStart = (currentPhase - 1) * 3 + 1;
    const phaseEnd = currentPhase * 3;
    const phaseName = userDoc?.level <= 3 ? 'Beginner' : userDoc?.level <= 6 ? 'Intermediate' : userDoc?.level <= 9 ? 'Advanced' : 'Expert';
    const levelInPhase = ((userDoc?.level - 1) % 3) + 1;

    // Define the borders for the AI
    const minBorder = levelInPhase === 1 ? 0 : levelInPhase === 2 ? 34 : 67;
    const maxBorder = levelInPhase === 1 ? 33 : levelInPhase === 2 ? 66 : 100;

    const prompt = `You are an AI learning coach. Perform a deep analysis of this student's technical progress across the SkillVerse platform.

PHASE-LEVEL MASTERY BORDERS:
- We use a Phase-Relative scoring system. This student is in Phase ${currentPhase} (${phaseName}).
- Each level within this phase has a strictly defined mastery border:
  * LEVEL 1 (Start of Phase): Mastery Range 0% - 33%
  * LEVEL 2 (Middle of Phase): Mastery Range 34% - 66%
  * LEVEL 3 (End of Phase): Mastery Range 67% - 100%
- CURRENT STATUS: This student is Level ${userDoc.level}. This means their mastery is at Level ${levelInPhase} of 3 in this phase.
- MANDATORY: All skill scores you generate MUST fall within the ${minBorder}% to ${maxBorder}% range.

YOUR TASK:
Determine the exact percentage within the ${minBorder}%-${maxBorder}% range based on their overall progress:
- High End of Range (e.g., ${maxBorder}%): Outstanding accuracy, high assignment volume, consistent streak.
- Middle of Range: Steady progress, some pending tasks, average accuracy.
- Low End of Range (e.g., ${minBorder}%): Just started this level, low accuracy, or high number of pending assignments.

STUDENT DATA:
- Assignments: ${totalAssignments} submitted (${assignmentsOnTime} on-time), ${pendingAssignmentsCount} pending.
- Code Quality: Based on Average Score (${Math.round(avgProjectScore)}%) and AI code feedback samples:
${technicalFeedback.length > 0 ? technicalFeedback.join('\n---\n') : 'No feedback samples available yet.'}
- Engagement: ${totalCodeExecutions} code runs, ${bugHuntParticipated} bug hunts, ${totalMinutes} total minutes.

Respond in STRICT JSON format ONLY:
{
  "detailedAiAnalysis": {
    "problemSolving": "Analyze logic proficiency relative to Phase ${currentPhase} goals.",
    "codeQuality": "Analyze syntax and style samples provided.",
    "debuggingSkills": "Analyze Bug Hunt performance and error handling.",
    "projectMastery": "Analyze completion and accuracy of Mini Projects.",
    "consistency": "Analyze streaks and submission timing.",
    "overall": "Mastery summary for this phase.",
    "weaknessAnalysis": "Technical concepts needing work.",
    "recommendation": "Specific coding practice to reach ${maxBorder}% mastery.",
    "javaProficiency": <Score in ${minBorder}-${maxBorder} range>,
    "pythonProficiency": <Score in ${minBorder}-${maxBorder} range>,
    "problemSolvingScore": <Score in ${minBorder}-${maxBorder} range>,
    "codeQualityScore": <Score in ${minBorder}-${maxBorder} range>,
    "debuggingSkillsScore": <Score in ${minBorder}-${maxBorder} range>,
    "projectMasteryScore": <Score in ${minBorder}-${maxBorder} range>,
    "consistencyScore": <Score in ${minBorder}-${maxBorder} range>,
    "overallScore": <Balanced score in ${minBorder}-${maxBorder} range>,
    "phaseProgress": <Progress through current phase toward Level ${phaseEnd + 1}>
  }
}
Return ONLY the JSON.`;

    const response = await generateWithRetry(prompt, { temperature: 0.4, num_predict: 1200 });
    const content = response.message.content;

    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    let analysisData = null;

    if (startIdx !== -1 && endIdx !== -1) {
      try {
        const jsonStr = content.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        analysisData = parsed.detailedAiAnalysis;
      } catch (parseErr) {
        console.error('[Progress] Failed to parse detailed AI analysis JSON:', parseErr.message);
        try {
          let cleaned = content.substring(startIdx, endIdx + 1)
            .replace(/\`\`\`json\n?|\`\`\`/g, '')
            .replace(/[\x00-\x1F\x7F]/g, ' ');
          let parsed = JSON.parse(cleaned);
          analysisData = parsed.detailedAiAnalysis;
        } catch (e2) {
          console.error('[Progress] Second parse attempt failed');
        }
      }
    }
    
    if (analysisData) {
      analysisData.generatedAt = new Date();
      analysisData.activitySnapshot = {
        executions: totalCodeExecutions,
        assignments: totalAssignments,
        projects: submittedTasks.length,
        bugHunts: bugHuntParticipated
      };
      
      // Identify classrooms that already have a progress record
      const existingClassroomIds = progressRecords.map(p => p.classroom.toString());
      
      // Find all classrooms the student is enrolled in
      const Classroom = (await import('../models/Classroom.js')).default;
      const allStudentClassrooms = await Classroom.find({
        $or: [
          { 'students.studentId': userId },
          { isDefault: true }
        ]
      });

      console.log(`[Progress] User ${userId} is in ${allStudentClassrooms.length} classrooms. Updating existing and creating missing records.`);

      // 1. Update existing records
      if (progressRecords.length > 0) {
        for (let p of progressRecords) {
          // Save old analysis to previousAiAnalysis before updating
          if (p.detailedAiAnalysis && p.detailedAiAnalysis.generatedAt) {
            p.previousAiAnalysis = p.detailedAiAnalysis;
            p.markModified('previousAiAnalysis');
          } else if (p.jobReadiness) {
            p.previousAiAnalysis = {
              problemSolving: "Initial baseline assessment.",
              codeQuality: "Initial baseline assessment.",
              debuggingSkills: "Initial baseline assessment.",
              projectMastery: "Initial baseline assessment.",
              consistency: "Initial baseline assessment.",
              overall: "Initial baseline assessment.",
              problemSolvingScore: p.jobReadiness.problemSolving || 0,
              codeQualityScore: p.jobReadiness.codeQuality || 0,
              debuggingSkillsScore: p.jobReadiness.efficiency || 0,
              projectMasteryScore: p.jobReadiness.collaboration || 0,
              efficiencyScore: p.jobReadiness.efficiency || 0,
              collaborationScore: p.jobReadiness.collaboration || 0,
              consistencyScore: p.jobReadiness.consistency || 0,
              overallScore: p.jobReadiness.overallScore || 0,
              generatedAt: new Date()
            };
            p.markModified('previousAiAnalysis');
          }
          
          p.detailedAiAnalysis = analysisData;
          p.markModified('detailedAiAnalysis');
          await p.save();
        }
      }

      // 2. Create records for classrooms that don't have one yet
      const missingClassrooms = allStudentClassrooms.filter(c => !existingClassroomIds.includes(c._id.toString()));
      if (missingClassrooms.length > 0) {
        console.log(`[Progress] Creating ${missingClassrooms.length} new records for missing classrooms.`);
        for (const classroom of missingClassrooms) {
          const newProgress = new Progress({
            student: userId,
            classroom: classroom._id,
            detailedAiAnalysis: analysisData
          });
          newProgress.markModified('detailedAiAnalysis');
          await newProgress.save();
        }
      }
    } else {
        return res.status(500).json({ success: false, message: 'Failed to generate proper JSON from AI.' });
    }

    res.json({
      success: true,
      analysis: analysisData,
      previousAnalysis: progressRecords[0]?.previousAiAnalysis || null,
      generatedAt: analysisData.generatedAt
    });
  } catch (error) {
    console.error('[Progress] Error generating detailed AI analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate detailed AI analysis',
      error: error.message
    });
  }
});

// Advance to the next curriculum phase
router.post('/next-phase', authenticateToken, async (req, res) => {
  try {
    let userId = req.user.userId;

    // Allow teachers to advance a student's phase
    if (req.user.role === 'teacher' && req.body.studentId) {
      userId = req.body.studentId;
    }

    const MiniProject = (await import('../models/MiniProject.js')).default;
    
    // Find MiniProject and increment phase
    let miniProject = await MiniProject.findOne({ userId });
    if (!miniProject) {
      miniProject = new MiniProject({ userId });
    }
    
    const oldPhase = miniProject.currentPhase || 1;
    miniProject.currentPhase = oldPhase + 1;
    
    // Increment User Level as well (manual advancement basis)
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (user) {
      user.level = (user.level || 1) + 1;
      await user.save();
    }
    
    // Increment week number to ensure we start a fresh "Current Week" in the history
    miniProject.currentWeekNumber = (miniProject.currentWeekNumber || 0) + 1;
    
    // Force immediate new project generation for next phase
    miniProject.lastGenerationDate = null;
    miniProject.generationEnabled = true;

    await miniProject.save();
    
    // Update all progress records for this student to reflect the new phase
    const progressRecords = await Progress.find({ student: userId });
    for (const p of progressRecords) {
      // Archive current analysis before resetting
      if (p.detailedAiAnalysis) {
        p.previousAiAnalysis = p.detailedAiAnalysis;
      }
      
      // Reset Detailed AI Analysis for the fresh start in new phase
      p.detailedAiAnalysis = {
        problemSolving: "Fresh assessment for the new phase. Complete assignments to see analysis.",
        codeQuality: "Start coding in the new phase to evaluate quality.",
        debuggingSkills: "Participate in new Bug Hunts to see debugging metrics.",
        projectMastery: "Begin Phase " + miniProject.currentPhase + " projects to track mastery.",
        consistency: "Maintain your streak in this new phase!",
        overall: "Beginning of Phase " + miniProject.currentPhase + ". Your journey continues.",
        weaknessAnalysis: "New phase starting. Growth areas will appear as you progress.",
        recommendation: "Welcome to Phase " + miniProject.currentPhase + "! Start with your new Mini Projects.",
        problemSolvingScore: 0,
        codeQualityScore: 0,
        debuggingSkillsScore: 0,
        projectMasteryScore: 0,
        consistencyScore: 0,
        overallScore: 0,
        phaseProgress: 0,
        generatedAt: new Date()
      };
      
      p.markModified('detailedAiAnalysis');
      p.markModified('previousAiAnalysis');
      await p.save();
    }
    
    res.json({
      success: true,
      message: `Successfully advanced to phase ${miniProject.currentPhase}`,
      newPhase: miniProject.currentPhase
    });
  } catch (error) {
    console.error('[Progress] Error advancing to next phase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to advance to next phase'
    });
  }
});

// Helper function to generate personalized recommendations
function generateRecommendations(progress) {
  const recommendations = [];

  // Analyze weak areas
  const jobReadiness = progress.jobReadiness;

  if (jobReadiness.problemSolving < 60) {
    recommendations.push({
      type: 'practice',
      priority: 'high',
      title: 'Improve Problem Solving',
      description: 'Try more challenging assignments and mini-projects to strengthen your problem-solving skills.',
      action: 'View recommended assignments'
    });
  }

  if (jobReadiness.efficiency < 60) {
    recommendations.push({
      type: 'time_management',
      priority: 'medium',
      title: 'Work on Time Management',
      description: 'Focus on submitting assignments on time to improve your efficiency score.',
      action: 'Set up study schedule'
    });
  }

  if (progress.streaks.currentStreak < 3) {
    recommendations.push({
      type: 'consistency',
      priority: 'high',
      title: 'Build Consistency',
      description: 'Try to code every day, even if it\'s just for 30 minutes, to build your learning streak.',
      action: 'Set daily reminder'
    });
  }

  // Language-specific recommendations
  ['java', 'python'].forEach(lang => {
    const langProgress = progress.skills[lang];
    if (langProgress.exercisesCompleted > 0 && langProgress.averageScore < 70) {
      recommendations.push({
        type: 'language',
        priority: 'medium',
        title: `Strengthen ${lang.toUpperCase()} Fundamentals`,
        description: `Focus on basic ${lang} concepts to improve your average score.`,
        action: `Practice ${lang} exercises`
      });
    }
  });

  return recommendations;
}

export default router;
