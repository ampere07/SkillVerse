import express from 'express';
import User from '../models/User.js';
import Survey from '../models/Survey.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const {
      userId,
      primaryLanguage,
      javaExpertise,
      pythonExpertise
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if survey already exists for this user
    let survey = await Survey.findOne({ userId });

    if (survey) {
      // Update existing survey
      survey.primaryLanguage = primaryLanguage;
      survey.javaExpertise = javaExpertise;
      survey.pythonExpertise = pythonExpertise;
      survey.completed = true;
      await survey.save();
    } else {
      // Create new survey
      survey = new Survey({
        userId,
        primaryLanguage,
        javaExpertise,
        pythonExpertise,
        completed: true
      });
      await survey.save();
    }

    // Update user's surveyCompleted flag
    user.onboardingSurvey = {
      surveyCompleted: true
    };
    await user.save();

    res.status(200).json({
      message: 'Survey submitted successfully',
      survey: {
        id: survey._id,
        userId: survey.userId,
        primaryLanguage: survey.primaryLanguage,
        javaExpertise: survey.javaExpertise,
        pythonExpertise: survey.pythonExpertise,
        completed: survey.completed
      }
    });
  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({ message: 'Server error during survey submission' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const survey = await Survey.findOne({ userId });

    res.status(200).json({
      surveyCompleted: survey?.completed || false,
      surveyData: survey || null
    });
  } catch (error) {
    console.error('Survey fetch error:', error);
    res.status(500).json({ message: 'Server error fetching survey data' });
  }
});

export default router;
