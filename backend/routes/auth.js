import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import MiniProject from '../models/MiniProject.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', { email: req.body.email, role: req.body.role, name: req.body.name });
    
    const { email, password, role, name } = req.body;

    if (!email || !password || !role || !name) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }

    if (!hasNumber) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    if (!hasSpecialChar) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    const formattedName = toTitleCase(name.trim());

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      name: formattedName
    });

    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully');

    if (role === 'student') {
      console.log('Creating mini project document for student...');
      const miniProject = new MiniProject({
        userId: user._id,
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
      console.log('Mini project document created successfully (awaiting survey completion)');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`New user registered: ${user.email} as ${user.role}`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        surveyCompleted: user.onboardingSurvey?.surveyCompleted || false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        surveyCompleted: user.onboardingSurvey?.surveyCompleted || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        surveyCompleted: user.onboardingSurvey?.surveyCompleted || false
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  console.log(`User logged out: ${req.user.email}`);
  res.json({ message: 'Logout successful' });
});

export default router;
