import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import MiniProject from '../models/MiniProject.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          return done(null, user);
        }

        const newUser = new User({
          email: profile.emails[0].value.toLowerCase(),
          name: profile.displayName,
          role: 'student',
          googleId: profile.id,
          password: Math.random().toString(36).slice(-8)
        });

        await newUser.save();

        const miniProject = new MiniProject({
          userId: newUser._id,
          completedTasks: [],
          availableProjects: [],
          weekStartDate: null,
          lastWeekCompletedCount: 0,
          generationEnabled: false,
          lastGenerationDate: null,
          currentWeekNumber: 0,
          weeklyProjectHistory: []
        });
        await miniProject.save();

        return done(null, newUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

export default passport;
