import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  primaryLanguage: [{
    type: String,
    enum: ['java', 'python'],
    required: true
  }],
  javaExpertise: {
    type: String,
    enum: ['no-experience', 'beginner', 'intermediate', 'advanced', 'expert']
  },
  pythonExpertise: {
    type: String,
    enum: ['no-experience', 'beginner', 'intermediate', 'advanced', 'expert']
  },
  completed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

surveySchema.index({ userId: 1 });

export default mongoose.model('Survey', surveySchema);
