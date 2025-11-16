import mongoose from 'mongoose';

const completedTaskSchema = new mongoose.Schema({
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  codeBase: {
    type: String,
    default: ''
  },
  aiAnalyization: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const availableProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    default: ''
  },
  sampleOutput: {
    type: String,
    default: ''
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: null
  },
  weekNumber: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const weeklyProjectHistorySchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  generatedProjects: {
    type: [availableProjectSchema],
    default: []
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const miniProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  completedTasks: {
    type: [completedTaskSchema],
    default: []
  },
  availableProjects: {
    type: [availableProjectSchema],
    default: []
  },
  weekStartDate: {
    type: Date,
    default: null
  },
  lastWeekCompletedCount: {
    type: Number,
    default: 0
  },
  generationEnabled: {
    type: Boolean,
    default: false
  },
  lastGenerationDate: {
    type: Date,
    default: null
  },
  currentWeekNumber: {
    type: Number,
    default: 0
  },
  weeklyProjectHistory: {
    type: [weeklyProjectHistorySchema],
    default: []
  }
}, {
  timestamps: true
});

miniProjectSchema.index({ userId: 1 });

miniProjectSchema.methods.enableGeneration = function() {
  this.generationEnabled = true;
  this.lastGenerationDate = new Date();
};

miniProjectSchema.methods.addWeeklyGeneratedProjects = function(projects, weekNumber, weekStartDate, weekEndDate) {
  const weekHistory = {
    weekNumber: weekNumber || this.currentWeekNumber + 1,
    weekStartDate: weekStartDate || new Date(),
    weekEndDate: weekEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    generatedProjects: projects.map(project => ({
      ...project,
      isAIGenerated: true,
      generatedAt: new Date(),
      weekNumber: weekNumber || this.currentWeekNumber + 1
    })),
    generatedAt: new Date()
  };
  
  this.weeklyProjectHistory.push(weekHistory);
  this.currentWeekNumber = weekHistory.weekNumber;
  
  const projectsToAdd = weekHistory.generatedProjects.map(project => ({
    title: project.title,
    description: project.description,
    language: project.language,
    requirements: project.requirements || '',
    sampleOutput: project.sampleOutput || '',
    isAIGenerated: true,
    generatedAt: new Date(),
    weekNumber: weekHistory.weekNumber,
    createdAt: new Date()
  }));
  
  this.availableProjects.push(...projectsToAdd);
  this.lastGenerationDate = new Date();
};

miniProjectSchema.methods.getCurrentWeekProjects = function() {
  return this.availableProjects.filter(
    project => project.weekNumber === this.currentWeekNumber
  );
};

miniProjectSchema.methods.getProjectsByWeek = function(weekNumber) {
  const history = this.weeklyProjectHistory.find(
    week => week.weekNumber === weekNumber
  );
  return history ? history.generatedProjects : [];
};

export default mongoose.model('MiniProject', miniProjectSchema);
