import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  primaryLanguage: {
    type: String,
    enum: ['java', 'python'],
    required: true
  },
  courseInterest: {
    type: String,
    required: false
  },
  learningGoals: {
    type: String,
    required: false
  },
  javaExpertise: {
    type: String,
    enum: ['no-experience', 'beginner', 'intermediate', 'advanced', 'expert'],
    required: false,
    default: undefined
  },
  pythonExpertise: {
    type: String,
    enum: ['no-experience', 'beginner', 'intermediate', 'advanced', 'expert'],
    required: false,
    default: undefined
  },
  javaQuestions: {
    answers: [Number],
    score: {
      total: Number,
      easy: Number,
      medium: Number,
      hard: Number,
      percentage: Number
    }
  },
  pythonQuestions: {
    answers: [Number],
    score: {
      total: Number,
      easy: Number,
      medium: Number,
      hard: Number,
      percentage: Number
    }
  },
  completed: {
    type: Boolean,
    default: true
  },
  aiAnalysis: {
    type: String,
    default: null
  },
  analysisGeneratedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

surveySchema.index({ userId: 1, primaryLanguage: 1 }, { unique: true });

export default mongoose.model('Survey', surveySchema);
