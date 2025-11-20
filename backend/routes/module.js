import express from 'express';
import Module from '../models/Module.js';
import Classroom from '../models/Classroom.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/classroom/:classroomId', authenticateToken, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    const isTeacher = classroom.teacher.toString() === req.user.userId;
    const isStudent = classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this classroom' 
      });
    }

    const query = { classroom: req.params.classroomId };

    if (req.user.role === 'student') {
      query.isPublished = true;
    }

    const modules = await Module.find(query)
      .populate('teacher', 'name email')
      .populate('students.studentId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: modules.length,
      modules
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch modules',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('classroom')
      .populate('students.studentId', 'name email');

    if (!module) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found' 
      });
    }

    const isTeacher = module.teacher._id.toString() === req.user.userId;
    const isStudent = module.classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this module' 
      });
    }

    if (req.user.role === 'student' && !module.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This module is not yet published' 
      });
    }

    res.json({
      success: true,
      module
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { 
      classroomId, 
      title, 
      description, 
      isPublished,
      attachments
    } = req.body;

    if (!classroomId || !title || !description) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom ID, title, and description are required' 
      });
    }

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    if (classroom.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only create modules in your own classrooms' 
      });
    }

    const classroomStudents = classroom.students.map(s => ({
      studentId: s.studentId,
      assignedAt: new Date()
    }));

    const module = new Module({
      classroom: classroomId,
      teacher: req.user.userId,
      title,
      description,
      attachments: attachments || [],
      students: classroomStudents,
      isPublished: isPublished !== undefined ? isPublished : true
    });

    await module.save();
    await module.populate('teacher', 'name email');
    await module.populate('classroom', 'name code');

    console.log(`New module created: ${module.title} in ${classroom.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      module
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found' 
      });
    }

    if (module.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update your own modules' 
      });
    }

    const { 
      title, 
      description, 
      isPublished
    } = req.body;

    if (title) module.title = title;
    if (description) module.description = description;
    if (isPublished !== undefined) module.isPublished = isPublished;

    await module.save();
    await module.populate('teacher', 'name email');
    await module.populate('classroom', 'name code');

    console.log(`Module updated: ${module.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Module updated successfully',
      module
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found' 
      });
    }

    if (module.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own modules' 
      });
    }

    await module.deleteOne();

    console.log(`Module deleted: ${module.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
