import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    buggyCode: { type: String, required: true },
    correctCode: { type: String, required: true },
    hints: [String],
    difficulty: { type: String, default: 'Beginner' },
    language: { type: String, required: true },
    isFixed: { type: Boolean, default: false },
    timeToFix: { type: Number, default: 0 }, // in seconds
    score: { type: Number, default: 0 }
});

const bugHuntSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ['java', 'python']
    },
    challenges: [challengeSchema],
    totalScore: {
        type: Number,
        default: 0
    },
    totalTime: {
        type: Number,
        default: 0
    },
    hintsUsed: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'cancelled', 'surrendered'],
        default: 'in-progress'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

const BugHuntSession = mongoose.model('BugHuntSession', bugHuntSessionSchema);

export default BugHuntSession;
