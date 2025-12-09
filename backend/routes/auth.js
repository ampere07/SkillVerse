import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import MiniProject from '../models/MiniProject.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmail } from '../services/gmailService.js';

const router = express.Router();

const verificationCodes = new Map();
const passwordResetCodes = new Map();

const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    verificationCodes.set(email.toLowerCase(), {
      code: verificationCode,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">SkillVerse</h1>
          <p style="color: #FFB300; margin: 10px 0 0 0; font-size: 14px;">Educational Platform</p>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1B5E20; margin-top: 0;">Email Verification</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">Welcome to SkillVerse! Please use the verification code below to complete your registration:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="color: #888; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code</p>
            <p style="font-size: 36px; font-weight: bold; color: #1B5E20; margin: 0; letter-spacing: 8px;">${verificationCode}</p>
          </div>
          <p style="color: #777; font-size: 14px; line-height: 1.6;">
            This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">© 2024 SkillVerse. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(email, 'SkillVerse - Email Verification Code', htmlBody);

    console.log(`Verification code sent to: ${email}`);

    res.json({ 
      message: 'Verification code sent successfully',
      success: true 
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ 
      message: 'Failed to send verification code. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/send-password-reset-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    passwordResetCodes.set(email.toLowerCase(), {
      code: resetCode,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">SkillVerse</h1>
          <p style="color: #FFB300; margin: 10px 0 0 0; font-size: 14px;">Educational Platform</p>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1B5E20; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">You requested to reset your password. Please use the verification code below:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="color: #888; margin: 0 0 10px 0; font-size: 14px;">Your Password Reset Code</p>
            <p style="font-size: 36px; font-weight: bold; color: #1B5E20; margin: 0; letter-spacing: 8px;">${resetCode}</p>
          </div>
          <p style="color: #777; font-size: 14px; line-height: 1.6;">
            This code will expire in <strong>10 minutes</strong>. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">© 2024 SkillVerse. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(email, 'SkillVerse - Password Reset Code', htmlBody);

    console.log(`Password reset code sent to: ${email}`);

    res.json({ 
      message: 'Password reset code sent successfully',
      success: true 
    });
  } catch (error) {
    console.error('Send password reset code error:', error);
    res.status(500).json({ 
      message: 'Failed to send password reset code. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;

    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const storedData = passwordResetCodes.get(email.toLowerCase());
    if (!storedData) {
      return res.status(400).json({ message: 'Verification code not found. Please request a new code.' });
    }

    if (Date.now() > storedData.expiresAt) {
      passwordResetCodes.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    if (storedData.code !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    passwordResetCodes.delete(email.toLowerCase());

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }

    if (!hasNumber) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    if (!hasSpecialChar) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    console.log(`Password reset successfully for user: ${user.email}`);

    res.json({ 
      message: 'Password reset successfully',
      success: true 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Failed to reset password. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', { email: req.body.email, role: req.body.role, name: req.body.name });
    
    const { email, password, role, name, verificationCode } = req.body;

    if (!email || !password || !role || !name) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!verificationCode) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    const storedData = verificationCodes.get(email.toLowerCase());
    if (!storedData) {
      return res.status(400).json({ message: 'Verification code not found. Please request a new code.' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    if (storedData.code !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    verificationCodes.delete(email.toLowerCase());

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

    const nameParts = name.trim().split(/\s+/);
    let firstName, middleInitial, lastName;

    if (nameParts.length === 1) {
      firstName = toTitleCase(nameParts[0]);
      middleInitial = '';
      lastName = toTitleCase(nameParts[0]);
    } else if (nameParts.length === 2) {
      firstName = toTitleCase(nameParts[0]);
      middleInitial = '';
      lastName = toTitleCase(nameParts[1]);
    } else {
      firstName = toTitleCase(nameParts[0]);
      const middle = nameParts[1];
      if (middle.length === 1 || (middle.length === 2 && middle.endsWith('.'))) {
        middleInitial = middle.charAt(0).toUpperCase();
        lastName = toTitleCase(nameParts.slice(2).join(' '));
      } else {
        middleInitial = '';
        lastName = toTitleCase(nameParts.slice(1).join(' '));
      }
    }

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      firstName,
      middleInitial,
      lastName
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
        name: `${user.firstName}${user.middleInitial ? ' ' + user.middleInitial + '.' : ''} ${user.lastName}`,
        firstName: user.firstName,
        middleInitial: user.middleInitial || '',
        lastName: user.lastName,
        role: user.role,
        surveyCompleted: user.onboardingSurvey?.surveyCompleted || false,
        primaryLanguage: user.primaryLanguage || null
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

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User found, comparing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
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
        name: `${user.firstName}${user.middleInitial ? ' ' + user.middleInitial + '.' : ''} ${user.lastName}`,
        firstName: user.firstName,
        middleInitial: user.middleInitial || '',
        lastName: user.lastName,
        role: user.role,
        surveyCompleted: user.onboardingSurvey?.surveyCompleted || false,
        primaryLanguage: user.primaryLanguage || null
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
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        name: `${user.firstName}${user.middleInitial ? ' ' + user.middleInitial + '.' : ''} ${user.lastName}`,
        firstName: user.firstName,
        middleInitial: user.middleInitial || '',
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        surveyCompleted: user.onboardingSurvey?.surveyCompleted || false,
        primaryLanguage: user.primaryLanguage || null,
        surveyCompletedLanguages: user.surveyCompletedLanguages || []
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, middleInitial, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: req.user.userId }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const formattedFirstName = toTitleCase(firstName.trim());
    const formattedLastName = toTitleCase(lastName.trim());
    const formattedMiddleInitial = middleInitial ? middleInitial.trim().charAt(0).toUpperCase() : '';

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        firstName: formattedFirstName,
        middleInitial: formattedMiddleInitial,
        lastName: formattedLastName,
        email: email.toLowerCase()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Profile updated for user: ${user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        name: `${user.firstName}${user.middleInitial ? ' ' + user.middleInitial + '.' : ''} ${user.lastName}`,
        firstName: user.firstName,
        middleInitial: user.middleInitial || '',
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        surveyCompleted: user.onboardingSurvey?.surveyCompleted || false
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }

    if (!hasNumber) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    if (!hasSpecialChar) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    console.log(`Password changed for user: ${user.email}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  console.log(`User logged out: ${req.user.email}`);
  res.json({ message: 'Logout successful' });
});

router.get('/check-survey-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const needsSurvey = !user.surveyCompletedLanguages || 
                        !user.surveyCompletedLanguages.includes(user.primaryLanguage);
    
    res.json({ needsSurvey });
  } catch (error) {
    console.error('Check survey status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-language', authenticateToken, async (req, res) => {
  try {
    const { language } = req.body;

    console.log(`[Auth] ========== LANGUAGE CHANGE REQUEST ==========`);
    console.log(`[Auth] User ID: ${req.user.userId}`);
    console.log(`[Auth] Requested language: ${language}`);

    if (!language || !['java', 'python'].includes(language)) {
      return res.status(400).json({ message: 'Valid language is required (java or python)' });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[Auth] User found: ${user.email}`);
    console.log(`[Auth] Current primaryLanguage in DB: ${user.primaryLanguage}`);
    
    const oldLanguage = user.primaryLanguage;
    user.primaryLanguage = language;
    await user.save();
    
    console.log(`[Auth] Language updated from ${oldLanguage} to ${language}`);
    console.log(`[Auth] Saved to database successfully`);
    console.log(`[Auth] User primaryLanguage after save: ${user.primaryLanguage}`);
    console.log(`[Auth] ================================================`);

    console.log(`Language changed to ${language} for user: ${user.email}`);

    res.json({ 
      success: true,
      message: 'Language changed successfully',
      user: {
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        name: `${user.firstName}${user.middleInitial ? ' ' + user.middleInitial + '.' : ''} ${user.lastName}`,
        firstName: user.firstName,
        middleInitial: user.middleInitial || '',
        lastName: user.lastName,
        role: user.role,
        primaryLanguage: user.primaryLanguage
      }
    });
  } catch (error) {
    console.error('[Auth] Change language error:', error);
    console.error('[Auth] Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/update-language', authenticateToken, async (req, res) => {
  try {
    const { primaryLanguage } = req.body;

    console.log('[Update Language] Request received:', { primaryLanguage, userId: req.user.userId });

    if (!primaryLanguage || !['java', 'python'].includes(primaryLanguage)) {
      return res.status(400).json({ message: 'Valid language is required (java or python)' });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[Update Language] User found:', { 
      email: user.email, 
      currentLanguage: user.primaryLanguage,
      surveyCompletedLanguages: user.surveyCompletedLanguages 
    });

    const completedLanguages = user.surveyCompletedLanguages || [];
    if (!completedLanguages.includes(primaryLanguage)) {
      console.log('[Update Language] Survey not completed for language:', primaryLanguage);
      return res.status(400).json({ 
        message: `You must complete the ${primaryLanguage.toUpperCase()} survey before switching to this language` 
      });
    }

    const oldLanguage = user.primaryLanguage;
    user.primaryLanguage = primaryLanguage;
    await user.save();

    console.log('[Update Language] User language updated:', { 
      oldLanguage, 
      newLanguage: primaryLanguage 
    });

    // DO NOT clear projects when switching languages
    // Projects are stored separately for each language and should persist
    console.log('[Update Language] Language switch complete - projects preserved');

    console.log(`[Update Language] Language changed to ${primaryLanguage} for user: ${user.email}`);
    console.log('[Update Language] Sending success response');

    return res.json({ 
      success: true,
      message: 'Language updated successfully',
      user: {
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        name: `${user.firstName}${user.middleInitial ? ' ' + user.middleInitial + '.' : ''} ${user.lastName}`,
        firstName: user.firstName,
        middleInitial: user.middleInitial || '',
        lastName: user.lastName,
        role: user.role,
        primaryLanguage: user.primaryLanguage,
        surveyCompletedLanguages: user.surveyCompletedLanguages
      }
    });
  } catch (error) {
    console.error('[Update Language] Error:', error);
    console.error('[Update Language] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

export default router;
