import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  
  // Skill categories and their progress
  skills: {
    // Programming language proficiency
    java: {
      exercisesCompleted: { type: Number, default: 0 },
      projectsCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastActivity: { type: Date },
      concepts: [{
        name: String, // e.g., "Variables", "OOP", "Collections"
        mastered: { type: Boolean, default: false },
        practiceCount: { type: Number, default: 0 },
        lastPracticed: { type: Date }
      }]
    },
    python: {
      exercisesCompleted: { type: Number, default: 0 },
      projectsCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastActivity: { type: Date },
      concepts: [{
        name: String,
        mastered: { type: Boolean, default: false },
        practiceCount: { type: Number, default: 0 },
        lastPracticed: { type: Date }
      }]
    }
  },

  // Activity tracking
  activities: {
    codeExecutions: {
      total: { type: Number, default: 0 },
      java: { type: Number, default: 0 },
      python: { type: Number, default: 0 },
      lastExecution: { type: Date }
    },
    assignments: {
      totalSubmitted: { type: Number, default: 0 },
      onTime: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastSubmission: { type: Date }
    },
    miniProjects: {
      completed: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastCompleted: { type: Date }
    },
    bugHunt: {
      participated: { type: Number, default: 0 },
      bugsFound: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
      lastParticipated: { type: Date }
    }
  },

  // AI Interaction tracking
  aiInteractions: {
    hintsRequested: { type: Number, default: 0 },
    feedbackReceived: { type: Number, default: 0 },
    lastHintAt: { type: Date, default: null },
    lastFeedbackAt: { type: Date, default: null }
  },

  // AI-generated insights and recommendations
  aiInsights: {
    insights: [{ type: String }],
    generatedAt: { type: Date },
    dataVersion: { type: Number }
  },

  aiRecommendations: {
    items: [{
      title: { type: String },
      description: { type: String },
      difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
      time: { type: String },
      type: { type: String, enum: ['Exercise', 'Project', 'Practice', 'Review'] }
    }],
    generatedAt: { type: Date },
    applied: [{ type: String }] // Track applied recommendations by title
  },

  skillGapAnalysis: {
    java: [{
      concept: { type: String },
      priority: { type: String, enum: ['High', 'Medium', 'Low'] },
      practice: { type: String },
      time: { type: String }
    }],
    python: [{
      concept: { type: String },
      priority: { type: String, enum: ['High', 'Medium', 'Low'] },
      practice: { type: String },
      time: { type: String }
    }],
    analyzedAt: { type: Date }
  },

  detailedAiAnalysis: {
    problemSolving: { type: String },
    codeQuality: { type: String },
    efficiency: { type: String },
    debuggingSkills: { type: String },
    collaboration: { type: String },
    projectMastery: { type: String },
    consistency: { type: String },
    overall: { type: String },
    weaknessAnalysis: { type: String },
    recommendation: { type: String },
    javaProficiency: { type: Number },
    pythonProficiency: { type: Number },
    problemSolvingScore: { type: Number },
    codeQualityScore: { type: Number },
    debuggingSkillsScore: { type: Number },
    projectMasteryScore: { type: Number },
    efficiencyScore: { type: Number },
    collaborationScore: { type: Number },
    consistencyScore: { type: Number },
    overallScore: { type: Number },
    phaseProgress: { type: Number },
    activitySnapshot: {
      executions: { type: Number, default: 0 },
      assignments: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      bugHunts: { type: Number, default: 0 }
    },
    generatedAt: { type: Date }
  },
  
  previousAiAnalysis: {
    problemSolving: { type: String },
    codeQuality: { type: String },
    efficiency: { type: String },
    debuggingSkills: { type: String },
    collaboration: { type: String },
    projectMastery: { type: String },
    consistency: { type: String },
    overall: { type: String },
    weaknessAnalysis: { type: String },
    recommendation: { type: String },
    javaProficiency: { type: Number },
    pythonProficiency: { type: Number },
    problemSolvingScore: { type: Number },
    codeQualityScore: { type: Number },
    debuggingSkillsScore: { type: Number },
    projectMasteryScore: { type: Number },
    efficiencyScore: { type: Number },
    collaborationScore: { type: Number },
    consistencyScore: { type: Number },
    overallScore: { type: Number },
    phaseProgress: { type: Number },
    activitySnapshot: {
      executions: { type: Number, default: 0 },
      assignments: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      bugHunts: { type: Number, default: 0 }
    },
    generatedAt: { type: Date }
  },

  // Job readiness metrics
  jobReadiness: {
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    problemSolving: { type: Number, default: 0, min: 0, max: 100 },
    codeQuality: { type: Number, default: 0, min: 0, max: 100 },
    efficiency: { type: Number, default: 0, min: 0, max: 100 },
    collaboration: { type: Number, default: 0, min: 0, max: 100 },
    consistency: { type: Number, default: 0, min: 0, max: 100 },
    lastCalculated: { type: Date, default: Date.now }
  },

  // Learning streaks
  streaks: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    totalActiveDays: { type: Number, default: 0 }
  },

  // Time tracking
  timeSpent: {
    totalMinutes: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    averagePerDay: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
progressSchema.index({ student: 1, classroom: 1 });
progressSchema.index({ student: 1 });
progressSchema.index({ classroom: 1 });
progressSchema.index({ 'jobReadiness.overallScore': -1 });

// Static method to calculate job readiness score
progressSchema.statics.calculateJobReadiness = function(progressData) {
  const userLevel = progressData.level || 1;
  const currentPhase = Math.ceil(userLevel / 3);
  const phaseStartLevel = (currentPhase - 1) * 3 + 1;
  const phaseEndLevel = currentPhase * 3;
  
  // Phase progress based on level within that phase
  // Phase 1 (1-3): L1=33%, L2=66%, L3=100%
  // Phase 2 (4-6): L4=33%, L5=66%, L6=100%
  const levelInPhase = ((userLevel - 1) % 3) + 1;
  const phaseLevelProgress = levelInPhase / 3;

  let scores = {
    problemSolving: 0,
    codeQuality: 0,
    efficiency: 0, // Used for Debugging
    collaboration: 0, // Used for Project Mastery
    consistency: 0
  };

  const assignmentsCompleted = progressData.activities?.assignments?.totalSubmitted || 0;
  const projectsCompleted = progressData.activities?.miniProjects?.completed || 0;
  const assignmentScore = progressData.activities?.assignments?.averageScore || 0;
  const projectScore = progressData.activities?.miniProjects?.averageScore || 0;

  // 1. Problem Solving: Phase-relative activity volume
  const activitiesInPhase = assignmentsCompleted + projectsCompleted;
  const targetActivitiesInPhase = currentPhase * 4; 
  const problemSolvingBase = (assignmentScore * 0.4) + (projectScore * 0.6);
  const volumeWeight = Math.min(1, activitiesInPhase / targetActivitiesInPhase);
  scores.problemSolving = Math.round(problemSolvingBase * volumeWeight);

  // 2. Code Quality: Relative to current language concepts practiced
  const javaScore = progressData.skills?.java?.averageScore || 0;
  const pythonScore = progressData.skills?.python?.averageScore || 0;
  const langScore = Math.max(javaScore, pythonScore);
  const javaActivity = (progressData.skills?.java?.exercisesCompleted || 0);
  const pythonActivity = (progressData.skills?.python?.exercisesCompleted || 0);
  const totalExercises = javaActivity + pythonActivity;
  const exerciseWeight = Math.min(1, totalExercises / (currentPhase * 5));
  scores.codeQuality = Math.round(langScore * exerciseWeight);

  // 3. Debugging (Efficiency): Participation in events available at this phase
  const bugHuntStats = progressData.activities?.bugHunt || { participated: 0, bugsFound: 0 };
  const participationScore = Math.min(50, bugHuntStats.participated * (15 / currentPhase)); 
  const bugsScore = Math.min(50, bugHuntStats.bugsFound * (10 / currentPhase));
  scores.efficiency = Math.round(participationScore + bugsScore);

  // 4. Project Mastery (Collaboration): Completion of phase-specific projects
  if (projectsCompleted > 0) {
    const projectVolumeWeight = Math.min(1, projectsCompleted / currentPhase);
    scores.collaboration = Math.round(projectScore * projectVolumeWeight);
  }

  // 5. Consistency: Engagement relative to phase
  const consistencyBase = Math.min(100, 
    (progressData.streaks?.currentStreak * 10) + 
    (progressData.streaks?.totalActiveDays * 2) +
    (progressData.timeSpent?.totalMinutes / 60)
  );
  scores.consistency = Math.round(consistencyBase);

  // --- FINAL PHASE WEIGHTING ---
  // The User Level in phase acts as the 'Cap' for the score.
  // Level 1 users can MAX reach ~33%
  // Level 2 users can MAX reach ~66%
  // Level 3 users can MAX reach 100%
  const phaseWeight = phaseLevelProgress; 

  scores.problemSolving = Math.round(scores.problemSolving * phaseWeight);
  scores.codeQuality = Math.round(scores.codeQuality * phaseWeight);
  scores.efficiency = Math.min(100, Math.round(scores.efficiency * phaseWeight));
  scores.collaboration = Math.round(scores.collaboration * phaseWeight);
  scores.consistency = Math.round(scores.consistency * phaseWeight);

  // Calculate overall score
  const overallScore = Object.values(scores).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) / 5;

  return {
    ...scores,
    overallScore: Math.round(overallScore),
    lastCalculated: new Date()
  };
};

export default mongoose.model('Progress', progressSchema);
