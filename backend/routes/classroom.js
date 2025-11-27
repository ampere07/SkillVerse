import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { classroomService } from '../services/classroomService.js';

const router = express.Router();

// Get all active classrooms (for browsing)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const classrooms = await classroomService.getAllActiveClassrooms();
    
    res.json({
      success: true,
      count: classrooms.length,
      classrooms
    });
  } catch (error) {
    console.error('Get all classrooms error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch classrooms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all classrooms for a teacher
router.get('/teacher', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const classrooms = await classroomService.getTeacherClassrooms(req.user.userId);

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
    const classrooms = await classroomService.getStudentClassrooms(req.user.userId);

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

    const classroom = await classroomService.joinClassroom(code, req.user.userId);

    console.log(`Student ${req.user.email} joined classroom: ${classroom.name}`);

    res.json({
      success: true,
      message: 'Successfully joined classroom',
      classroom
    });
  } catch (error) {
    console.error('Join classroom error:', error);
    
    if (error.message === 'Invalid classroom code' || error.message === 'You are already enrolled in this classroom') {
      return res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to join classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Leave classroom (student leaves on their own) - MUST come before /:id routes
router.post('/:id/leave', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    await classroomService.leaveClassroom(req.params.id, req.user.userId);

    console.log(`Student ${req.user.email} left classroom`);

    res.json({
      success: true,
      message: 'Successfully left classroom'
    });
  } catch (error) {
    console.error('Leave classroom error:', error);
    
    if (error.message === 'Classroom not found' || error.message === 'You are not enrolled in this classroom') {
      return res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to leave classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single classroom by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const classroom = await classroomService.getClassroomById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    const hasAccess = await classroomService.checkUserAccess(req.params.id, req.user.userId);
    if (!hasAccess) {
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
    const { name, description, yearLevelSection, settings } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom name is required' 
      });
    }

    const classroom = await classroomService.createClassroom({
      name,
      description,
      yearLevelSection,
      teacher: req.user.userId,
      settings: settings || {}
    });

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
    const { name, description, yearLevelSection, settings } = req.body;

    const isOwner = await classroomService.checkTeacherOwnership(req.params.id, req.user.userId);
    if (!isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only update your own classrooms.' 
      });
    }

    const classroom = await classroomService.updateClassroom(req.params.id, {
      name,
      description,
      yearLevelSection,
      settings
    });

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
    const isOwner = await classroomService.checkTeacherOwnership(req.params.id, req.user.userId);
    if (!isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only delete your own classrooms.' 
      });
    }

    await classroomService.deleteClassroom(req.params.id);

    console.log(`Classroom deleted by ${req.user.email}`);

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

// Remove student from classroom (teacher only)
router.delete('/:id/students/:studentId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const isOwner = await classroomService.checkTeacherOwnership(req.params.id, req.user.userId);
    if (!isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only manage your own classrooms.' 
      });
    }

    await classroomService.removeStudent(req.params.id, req.params.studentId);

    console.log(`Student removed from classroom by ${req.user.email}`);

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
