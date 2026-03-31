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
    collaboration: { type: String },
    consistency: { type: String },
    overall: { type: String },
    weaknessAnalysis: { type: String },
    recommendation: { type: String },
    javaProficiency: { type: Number },
    pythonProficiency: { type: Number },
    problemSolvingScore: { type: Number },
    codeQualityScore: { type: Number },
    efficiencyScore: { type: Number },
    collaborationScore: { type: Number },
    consistencyScore: { type: Number },
    overallScore: { type: Number },
    phaseProgress: { type: Number },
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
  let scores = {
    problemSolving: 0,
    codeQuality: 0,
    efficiency: 0,
    collaboration: 0,
    consistency: 0
  };

  // Problem Solving: weighted by number of completed activities (not just raw score)
  // Requires meaningful volume of work - max 100 after ~10 projects/assignments
  const assignmentsCompleted = progressData.activities.assignments.totalSubmitted || 0;
  const projectsCompleted = progressData.activities.miniProjects.completed || 0;
  const assignmentScore = progressData.activities.assignments.averageScore || 0;
  const projectScore = progressData.activities.miniProjects.averageScore || 0;

  const totalActivities = assignmentsCompleted + projectsCompleted;
  if (totalActivities > 0) {
    const weightedScore = (assignmentScore * assignmentsCompleted + projectScore * projectsCompleted) / totalActivities;
    // Scale by volume: each activity contributes up to 10 points towards a max of 100
    const volumeWeight = Math.min(1, totalActivities / 10);
    scores.problemSolving = Math.round(weightedScore * volumeWeight);
  }

  // Code Quality: based on language scores weighted by exercises + projects completed
  const javaActivity = (progressData.skills.java.exercisesCompleted || 0) + (progressData.skills.java.projectsCompleted || 0);
  const pythonActivity = (progressData.skills.python.exercisesCompleted || 0) + (progressData.skills.python.projectsCompleted || 0);
  const totalLangActivity = javaActivity + pythonActivity;

  if (totalLangActivity > 0) {
    const javaScore = progressData.skills.java.averageScore || 0;
    const pythonScore = progressData.skills.python.averageScore || 0;
    const weightedLangScore = (javaScore * javaActivity + pythonScore * pythonActivity) / totalLangActivity;
    const langVolumeWeight = Math.min(1, totalLangActivity / 10);
    scores.codeQuality = Math.round(weightedLangScore * langVolumeWeight);
  }

  // Efficiency: based on on-time submission rate (requires at least 1 assignment)
  if (assignmentsCompleted > 0) {
    const onTime = progressData.activities.assignments.onTime || 0;
    scores.efficiency = Math.round((onTime / assignmentsCompleted) * 100);
  }

  // Collaboration: 0 until student participates in classroom activities
  // Grows with bug hunt participation and assignments (social activities)
  const bugHuntScore = progressData.activities.bugHunt?.participated > 0 ? 
    Math.min(100, progressData.activities.bugHunt.participated * 10) : 0;
  const classroomScore = assignmentsCompleted > 0 ? Math.min(50, assignmentsCompleted * 5) : 0;
  scores.collaboration = Math.min(100, bugHuntScore + classroomScore);

  // Consistency: based on streaks and regular activity (unchanged)
  const consistencyScore = Math.min(100, 
    (progressData.streaks.currentStreak * 5) + 
    (progressData.streaks.totalActiveDays * 2)
  );
  scores.consistency = Math.round(consistencyScore);

  // Calculate overall score
  const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

  return {
    ...scores,
    overallScore: Math.round(overallScore),
    lastCalculated: new Date()
  };
};

export default mongoose.model('Progress', progressSchema);
