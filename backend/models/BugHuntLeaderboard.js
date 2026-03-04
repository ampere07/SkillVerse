import mongoose from 'mongoose';

const bugHuntLeaderboardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalScore: {
        type: Number,
        default: 0
    },
    totalTime: {
        type: Number,
        default: 0
    },
    sessionsCompleted: {
        type: Number,
        default: 0
    },
    sessionsSurrendered: {
        type: Number,
        default: 0
    },
    totalBugsFixed: {
        type: Number,
        default: 0
    },
    totalHintsUsed: {
        type: Number,
        default: 0
    },
    bestScore: {
        type: Number,
        default: 0
    },
    bestTime: {
        type: Number,
        default: null
    },
    lastPlayedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

bugHuntLeaderboardSchema.index({ totalScore: -1 });
bugHuntLeaderboardSchema.index({ userId: 1 });

const BugHuntLeaderboard = mongoose.model('BugHuntLeaderboard', bugHuntLeaderboardSchema);

export default BugHuntLeaderboard;
