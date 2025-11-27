import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Classroom name is required'],
    trim: true,
    maxlength: [100, 'Classroom name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Classroom code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  yearLevelSection: {
    type: String,
    trim: true,
    maxlength: [50, 'Year level and section cannot exceed 50 characters']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required'],
    index: true
  },
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowStudentPosts: {
      type: Boolean,
      default: false
    },
    requireApprovalToJoin: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
classroomSchema.index({ teacher: 1, isActive: 1 });
classroomSchema.index({ 'students.studentId': 1 });

// Generate unique classroom code
classroomSchema.statics.generateCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Method to add student to classroom
classroomSchema.methods.addStudent = function(studentId) {
  const alreadyEnrolled = this.students.some(
    s => s.studentId.toString() === studentId.toString()
  );
  
  if (!alreadyEnrolled) {
    this.students.push({ studentId });
  }
  return this.save();
};

// Method to remove student from classroom
classroomSchema.methods.removeStudent = function(studentId) {
  this.students = this.students.filter(
    s => s.studentId.toString() !== studentId.toString()
  );
  return this.save();
};

export default mongoose.model('Classroom', classroomSchema);
