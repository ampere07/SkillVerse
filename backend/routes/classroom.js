import express from 'express';
import Classroom from '../models/Classroom.js';
import User from '../models/User.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all classrooms for a teacher
router.get('/teacher', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const classrooms = await Classroom.find({ 
      teacher: req.user.userId,
      isActive: true 
    })
    .populate('teacher', 'name email')
    .populate('students.studentId', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: classrooms.length,
      classrooms
    });
  } catch (error) {
    console.error('Get teacher classrooms error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch classrooms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all classrooms for a student (enrolled classrooms)
router.get('/student', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const classrooms = await Classroom.find({ 
      'students.studentId': req.user.userId,
      isActive: true 
    })
    .populate('teacher', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: classrooms.length,
      classrooms
    });
  } catch (error) {
    console.error('Get student classrooms error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch classrooms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single classroom by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students.studentId', 'name email');

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    // Check if user has access to this classroom
    const isTeacher = classroom.teacher._id.toString() === req.user.userId;
    const isStudent = classroom.students.some(
      s => s.studentId._id.toString() === req.user.userId
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this classroom' 
      });
    }

    res.json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new classroom (teachers only)
router.post('/', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom name is required' 
      });
    }

    // Generate unique classroom code
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Classroom.generateCode();
      const existing = await Classroom.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
    }

    const classroom = new Classroom({
      name,
      code,
      description,
      teacher: req.user.userId,
      settings: settings || {}
    });

    await classroom.save();
    await classroom.populate('teacher', 'name email');

    console.log(`New classroom created: ${classroom.name} (${classroom.code}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      classroom
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update classroom (teacher only)
router.put('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    // Check if the teacher owns this classroom
    if (classroom.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only update your own classrooms.' 
      });
    }

    if (name) classroom.name = name;
    if (description !== undefined) classroom.description = description;
    if (settings) classroom.settings = { ...classroom.settings, ...settings };

    await classroom.save();
    await classroom.populate('teacher', 'name email');

    console.log(`Classroom updated: ${classroom.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Classroom updated successfully',
      classroom
    });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete classroom (soft delete - set isActive to false)
router.delete('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    // Check if the teacher owns this classroom
    if (classroom.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only delete your own classrooms.' 
      });
    }

    classroom.isActive = false;
    await classroom.save();

    console.log(`Classroom deleted: ${classroom.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Join classroom with code (students only)
router.post('/join', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom code is required' 
      });
    }

    const classroom = await Classroom.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid classroom code' 
      });
    }

    // Check if student is already enrolled
    const alreadyEnrolled = classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ 
        success: false,
        message: 'You are already enrolled in this classroom' 
      });
    }

    await classroom.addStudent(req.user.userId);
    await classroom.populate('teacher', 'name email');

    console.log(`Student ${req.user.email} joined classroom: ${classroom.name}`);

    res.json({
      success: true,
      message: 'Successfully joined classroom',
      classroom
    });
  } catch (error) {
    console.error('Join classroom error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to join classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove student from classroom (teacher only)
router.delete('/:id/students/:studentId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    // Check if the teacher owns this classroom
    if (classroom.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only manage your own classrooms.' 
      });
    }

    await classroom.removeStudent(req.params.studentId);

    console.log(`Student removed from classroom: ${classroom.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Student removed from classroom'
    });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to remove student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
