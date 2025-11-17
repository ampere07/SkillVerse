import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
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
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    default: null
  },
  dueDate: {
    type: Date,
    index: true
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  instructions: {
    type: String,
    trim: true,
    maxlength: [5000, 'Instructions cannot exceed 5000 characters']
  },
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
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String
    }],
    grade: {
      type: Number,
      min: 0
    },
    feedback: {
      type: String,
      trim: true
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

// Indexes for efficient queries
assignmentSchema.index({ classroom: 1, isPublished: 1 });
assignmentSchema.index({ teacher: 1, createdAt: -1 });
assignmentSchema.index({ dueDate: 1 });

// Virtual to check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Method to submit assignment
assignmentSchema.methods.submitAssignment = function(studentId, content, attachments = []) {
  const existingSubmission = this.submissions.find(
    s => s.student.toString() === studentId.toString()
  );

  if (existingSubmission) {
    throw new Error('Assignment already submitted');
  }

  this.submissions.push({
    student: studentId,
    content,
    attachments
  });

  return this.save();
};

// Method to grade submission
assignmentSchema.methods.gradeSubmission = function(studentId, grade, feedback) {
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

export default mongoose.model('Assignment', assignmentSchema);
