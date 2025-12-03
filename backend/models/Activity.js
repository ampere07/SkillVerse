import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Classroom is required'],
    index: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  instructions: {
    type: String,
    required: [true, 'Instructions are required'],
    trim: true,
    maxlength: [5000, 'Instructions cannot exceed 5000 characters']
  },
  duration: {
    hours: {
      type: Number,
      default: 0,
      min: [0, 'Hours cannot be negative']
    },
    minutes: {
      type: Number,
      default: 0,
      min: [0, 'Minutes cannot be negative'],
      max: [59, 'Minutes cannot exceed 59']
    }
  },
  dueDate: {
    type: Date,
    index: true
  },
  points: {
    type: Number,
    default: 100,
    min: [0, 'Points cannot be negative']
  },
  requiresCompiler: {
    type: Boolean,
    default: false
  },
  compilerLanguage: {
    type: String,
    enum: ['java', 'python'],
    default: 'python'
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    content: {
      type: String,
      trim: true
    },
    codeBase: {
      type: String,
      trim: true
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number,
      publicId: String
    }],
    grade: {
      type: Number,
      min: 0
    },
    feedback: {
      type: String,
      trim: true
    },
    aiFeedback: {
      type: String,
      trim: true
    },
    aiScore: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'returned'],
      default: 'submitted'
    }
  }]
}, {
  timestamps: true
});

activitySchema.index({ classroom: 1, isPublished: 1 });
activitySchema.index({ teacher: 1, createdAt: -1 });
activitySchema.index({ dueDate: 1 });

activitySchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

activitySchema.methods.submitActivity = function(studentId, content, codeBase, attachments = []) {
  console.log('=== submitActivity Method ===');
  console.log('StudentId:', studentId);
  console.log('Content length:', content.length);
  console.log('CodeBase length:', codeBase ? codeBase.length : 0);
  console.log('Attachments received:', JSON.stringify(attachments, null, 2));
  console.log('Attachments count:', attachments.length);
  
  const existingSubmission = this.submissions.find(
    s => s.student.toString() === studentId.toString()
  );

  if (existingSubmission) {
    throw new Error('Activity already submitted');
  }

  const newSubmission = {
    student: studentId,
    content,
    codeBase,
    attachments
  };

  console.log('New submission object:', JSON.stringify(newSubmission, null, 2));
  this.submissions.push(newSubmission);

  console.log('Submission added to activity, total submissions:', this.submissions.length);
  return this.save();
};

activitySchema.methods.gradeSubmission = function(studentId, grade, feedback) {
  const submission = this.submissions.find(
    s => s.student.toString() === studentId.toString()
  );

  if (!submission) {
    throw new Error('Submission not found');
  }

  submission.grade = grade;
  submission.feedback = feedback;
  submission.status = 'graded';

  return this.save();
};

export default mongoose.model('Activity', activitySchema);
