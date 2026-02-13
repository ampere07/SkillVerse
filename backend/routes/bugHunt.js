import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateBugHuntChallenge, validateBugHuntFix, generateSubtleHint } from '../services/bugHuntService.js';
import BugHuntSession from '../models/BugHuntSession.js';
import User from '../models/User.js';

const router = express.Router();

// Generate and save a new session
router.get('/generate-session', authenticateToken, async (req, res) => {
    try {
        const { language, level } = req.query;
        const lang = language || 'java';
        const lvl = level || 'Beginner';

        console.log(`[BugHunt Route] Generating session for user ${req.user.userId} in ${lang}`);

        // Generate 3 challenges
        const challengeData = await Promise.all([
            generateBugHuntChallenge(lang, lvl),
            generateBugHuntChallenge(lang, lvl),
            generateBugHuntChallenge(lang, lvl)
        ]);

        // Create a new session in DB
        const session = new BugHuntSession({
            userId: req.user.userId,
            language: lang,
            challenges: challengeData,
            status: 'in-progress'
        });

        await session.save();

        res.json({
            success: true,
            sessionId: session._id,
            challenges: session.challenges
        });
    } catch (error) {
        console.error('[BugHunt Route] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate bug hunt session',
            error: error.message
        });
    }
});

// Validate a fix and update session progress
router.post('/validate', authenticateToken, async (req, res) => {
    try {
        const { sessionId, challengeIndex, code, timeTaken } = req.body;

        // 1. Fetch the session
        const session = await BugHuntSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (session.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Session already completed' });
        }

        const challenge = session.challenges[challengeIndex];
        if (!challenge) {
            return res.status(400).json({ success: false, message: 'Invalid challenge index' });
        }

        // 2. Validate with AI
        const result = await validateBugHuntFix(
            challenge.title,
            challenge.description,
            code,
            session.language
        );

        // 3. Update session if fixed
        if (result.fixed) {
            challenge.isFixed = true;
            challenge.timeToFix = timeTaken || 0;

            // Calculate score based on speed (simple example)
            const basePoints = 100;
            const speedPenalty = (timeTaken || 0) * 0.5;
            const challengeScore = Math.max(20, Math.floor(basePoints - speedPenalty));
            challenge.score = challengeScore;

            session.totalScore += challengeScore;
            session.totalTime += (timeTaken || 0);

            // Check if all challenges are fixed
            const allFixed = session.challenges.every(c => c.isFixed);
            if (allFixed) {
                session.status = 'completed';
                session.completedAt = new Date();

                // Reward XP to user
                const user = await User.findById(req.user.userId);
                if (user) {
                    const xpReward = Math.floor(session.totalScore / 5); // 1 XP for every 5 points
                    user.xp = (user.xp || 0) + xpReward;

                    // Simple level up logic (every 500 XP)
                    user.level = Math.floor(user.xp / 500) + 1;
                    await user.save();
                }
            }

            await session.save();
        }

        res.json({
            success: true,
            ...result,
            sessionStatus: session.status,
            totalScore: session.totalScore
        });
    } catch (error) {
        console.error('[BugHunt Route] Validation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user's bug hunt history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const history = await BugHuntSession.find({ userId: req.user.userId })
            .sort({ startedAt: -1 })
            .limit(10);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get AI subtle hint
router.post('/hint', authenticateToken, async (req, res) => {
    try {
        const { sessionId, challengeIndex, currentCode } = req.body;

        const session = await BugHuntSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const challenge = session.challenges[challengeIndex];
        if (!challenge) {
            return res.status(400).json({ success: false, message: 'Invalid challenge' });
        }

        // Deduct points for hint? (Optional, let's keep it simple for now)
        session.hintsUsed = (session.hintsUsed || 0) + 1;
        await session.save();

        const hint = await generateSubtleHint(
            challenge.title,
            challenge.description,
            challenge.buggyCode,
            currentCode,
            session.language
        );

        res.json({ success: true, hint });
    } catch (error) {
        console.error('[BugHunt Hint Route] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Surrender a session
router.post('/surrender', authenticateToken, async (req, res) => {
    try {
        const { sessionId, totalTime, totalScore } = req.body;

        const session = await BugHuntSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        session.status = 'surrendered';
        session.completedAt = new Date();
        if (totalTime) session.totalTime = totalTime;
        if (totalScore !== undefined) session.totalScore = totalScore;

        // Give partial XP even for surrender
        const user = await User.findById(req.user.userId);
        if (user) {
            const xpReward = Math.floor((totalScore || 0) / 10); // 1 XP for every 10 points on surrender
            user.xp = (user.xp || 0) + xpReward;
            user.level = Math.floor(user.xp / 500) + 1;
            await user.save();
        }

        await session.save();

        res.json({ success: true, message: 'Mission surrendered. Intel recorded.' });
    } catch (error) {
        console.error('[BugHunt Surrender Route] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get global leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const leaderboard = await BugHuntSession.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: '$userId',
                    totalScore: { $sum: '$totalScore' },
                    sessionsCompleted: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: '$user.name',
                    totalScore: 1,
                    sessionsCompleted: 1
                }
            },
            { $sort: { totalScore: -1 } },
            { $limit: 10 }
        ]);

        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('[BugHunt Leaderboard Route] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
