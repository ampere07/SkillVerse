import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['teacher', 'student'],
      message: 'Role must be either teacher or student'
    },
    required: [true, 'Role is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  onboardingSurvey: {
    surveyCompleted: {
      type: Boolean,
      default: false
    }
  },
  primaryLanguage: {
    type: String,
    enum: ['java', 'python'],
    required: false
  },
  surveyCompletedLanguages: [{
    type: String,
    enum: ['java', 'python']
  }],
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      moduleIndex: Number,
      lessonIndex: Number,
      completedAt: Date
    }],
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // XP and Badge System (for students)
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    type: String
  }],
  // Demo/Presentation fields (separate from real progress)
  demoXP: {
    type: Number,
    default: 0
  },
  demoLevel: {
    type: Number,
    default: 1
  },
  demoBadges: [{
    type: String
  }]
}, {
  timestamps: true
});

userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
