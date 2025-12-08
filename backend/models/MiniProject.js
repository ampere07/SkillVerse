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
  status: {
    type: String,
    enum: ['paused', 'submitted', 'completed'],
    default: 'completed'
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  lastSavedAt: {
    type: Date,
    default: null
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
  rubrics: {
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
  javaProjects: {
    type: [availableProjectSchema],
    default: []
  },
  pythonProjects: {
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
  const javaProjects = [];
  const pythonProjects = [];
  
  // Separate projects by language
  projects.forEach(project => {
    const projectData = {
      title: project.title,
      description: project.description,
      language: project.language,
      requirements: project.requirements || '',
      sampleOutput: project.sampleOutput || '',
      rubrics: project.rubrics || '',
      isAIGenerated: true,
      generatedAt: new Date(),
      weekNumber: weekNumber || this.currentWeekNumber + 1,
      createdAt: new Date()
    };
    
    if (project.language.toLowerCase() === 'java') {
      javaProjects.push(projectData);
    } else if (project.language.toLowerCase() === 'python') {
      pythonProjects.push(projectData);
    }
  });
  
  const targetWeekNumber = weekNumber || this.currentWeekNumber || 1;
  
  // Check if week already exists
  const existingWeek = this.weeklyProjectHistory.find(
    week => week.weekNumber === targetWeekNumber
  );
  
  if (existingWeek) {
    // Add to existing week
    console.log(`[Model] Adding projects to existing week ${targetWeekNumber}`);
    if (javaProjects.length > 0) {
      existingWeek.javaProjects.push(...javaProjects);
    }
    if (pythonProjects.length > 0) {
      existingWeek.pythonProjects.push(...pythonProjects);
    }
  } else {
    // Create new week
    console.log(`[Model] Creating new week ${targetWeekNumber}`);
    const weekHistory = {
      weekNumber: targetWeekNumber,
      weekStartDate: weekStartDate || new Date(),
      weekEndDate: weekEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      javaProjects: javaProjects,
      pythonProjects: pythonProjects,
      generatedAt: new Date()
    };
    
    this.weeklyProjectHistory.push(weekHistory);
    this.currentWeekNumber = targetWeekNumber;
  }
  
  this.lastGenerationDate = new Date();
};

miniProjectSchema.methods.getCurrentWeekProjects = function(language) {
  const currentWeek = this.weeklyProjectHistory.find(
    week => week.weekNumber === this.currentWeekNumber
  );
  
  if (!currentWeek) return [];
  
  if (language.toLowerCase() === 'java') {
    return currentWeek.javaProjects || [];
  } else if (language.toLowerCase() === 'python') {
    return currentWeek.pythonProjects || [];
  }
  
  return [];
};

miniProjectSchema.methods.getProjectsByLanguage = function(language) {
  // Get projects from current week only
  const currentWeek = this.weeklyProjectHistory.find(
    week => week.weekNumber === this.currentWeekNumber
  );
  
  if (!currentWeek) return [];
  
  if (language.toLowerCase() === 'java') {
    return currentWeek.javaProjects || [];
  } else if (language.toLowerCase() === 'python') {
    return currentWeek.pythonProjects || [];
  }
  return [];
};

miniProjectSchema.methods.clearProjectsByLanguage = function(language) {
  const currentWeek = this.weeklyProjectHistory.find(
    week => week.weekNumber === this.currentWeekNumber
  );
  
  if (!currentWeek) return;
  
  if (language.toLowerCase() === 'java') {
    currentWeek.javaProjects = [];
  } else if (language.toLowerCase() === 'python') {
    currentWeek.pythonProjects = [];
  }
};

miniProjectSchema.methods.getProjectsByWeek = function(weekNumber, language) {
  const history = this.weeklyProjectHistory.find(
    week => week.weekNumber === weekNumber
  );
  
  if (!history) return [];
  
  if (language) {
    if (language.toLowerCase() === 'java') {
      return history.javaProjects || [];
    } else if (language.toLowerCase() === 'python') {
      return history.pythonProjects || [];
    }
  }
  
  // Return all projects if no language specified
  return [...(history.javaProjects || []), ...(history.pythonProjects || [])];
};

export default mongoose.model('MiniProject', miniProjectSchema);
