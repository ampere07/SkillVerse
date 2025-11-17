import express from 'express';
import Assignment from '../models/Assignment.js';
import Classroom from '../models/Classroom.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all assignments for a classroom
router.get('/classroom/:classroomId', authenticateToken, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);

    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    // Check if user has access to this classroom
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

    // Students only see published assignments
    const query = {
      classroom: req.params.classroomId
    };

    if (req.user.role === 'student') {
      query.isPublished = true;
    }

    const assignments = await Assignment.find(query)
      .populate('teacher', 'name email')
      .populate('students.studentId', 'name email')
      .populate('submissions.student', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch assignments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single assignment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('classroom')
      .populate('students.studentId', 'name email')
      .populate('submissions.student', 'name email');

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if user has access
    const isTeacher = assignment.teacher._id.toString() === req.user.userId;
    const isStudent = assignment.classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this assignment' 
      });
    }

    // Students shouldn't see unpublished assignments
    if (req.user.role === 'student' && !assignment.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This assignment is not yet published' 
      });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new assignment (teachers only)
router.post('/', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { 
      classroomId, 
      title, 
      description, 
      type,
      dueDate,
      points,
      instructions,
      isPublished,
      allowLateSubmission
    } = req.body;

    if (!classroomId || !title || !description) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom ID, title, and description are required' 
      });
    }

    // Verify classroom exists and teacher owns it
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
        message: 'You can only create assignments in your own classrooms' 
      });
    }

    // Get all students from the classroom
    const classroomStudents = classroom.students.map(s => ({
      studentId: s.studentId,
      assignedAt: new Date()
    }));

    const assignment = new Assignment({
      classroom: classroomId,
      teacher: req.user.userId,
      title,
      description,
      type: type || null,
      dueDate: dueDate || null,
      points: points || 0,
      instructions: instructions || '',
      students: classroomStudents,
      isPublished: isPublished !== undefined ? isPublished : true,
      allowLateSubmission: allowLateSubmission || false
    });

    await assignment.save();
    await assignment.populate('teacher', 'name email');
    await assignment.populate('classroom', 'name code');

    console.log(`New assignment created: ${assignment.title} in ${classroom.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update assignment (teacher only)
router.put('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if teacher owns this assignment
    if (assignment.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update your own assignments' 
      });
    }

    const { 
      title, 
      description, 
      type,
      dueDate,
      points,
      instructions,
      isPublished,
      allowLateSubmission
    } = req.body;

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (type) assignment.type = type;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (points !== undefined) assignment.points = points;
    if (instructions !== undefined) assignment.instructions = instructions;
    if (isPublished !== undefined) assignment.isPublished = isPublished;
    if (allowLateSubmission !== undefined) assignment.allowLateSubmission = allowLateSubmission;

    await assignment.save();
    await assignment.populate('teacher', 'name email');
    await assignment.populate('classroom', 'name code');

    console.log(`Assignment updated: ${assignment.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete assignment (teacher only)
router.delete('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if teacher owns this assignment
    if (assignment.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own assignments' 
      });
    }

    await assignment.deleteOne();

    console.log(`Assignment deleted: ${assignment.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Submit assignment (students only)
router.post('/:id/submit', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const { content, attachments } = req.body;

    const assignment = await Assignment.findById(req.params.id)
      .populate('classroom');

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if student is in the classroom
    const isEnrolled = assignment.classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (!isEnrolled) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not enrolled in this classroom' 
      });
    }

    // Check if assignment is published
    if (!assignment.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This assignment is not yet published' 
      });
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      s => s.student.toString() === req.user.userId
    );

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already submitted this assignment' 
      });
    }

    // Check if past due date
    if (assignment.dueDate && !assignment.allowLateSubmission) {
      if (new Date() > new Date(assignment.dueDate)) {
        return res.status(400).json({ 
          success: false,
          message: 'Submission deadline has passed' 
        });
      }
    }

    await assignment.submitAssignment(req.user.userId, content, attachments);

    console.log(`Assignment submitted: ${assignment.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to submit assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Grade submission (teacher only)
router.post('/:id/grade/:studentId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if teacher owns this assignment
    if (assignment.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only grade assignments in your own classrooms' 
      });
    }

    if (grade === undefined || grade < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid grade is required' 
      });
    }

    await assignment.gradeSubmission(req.params.studentId, grade, feedback);

    console.log(`Assignment graded: ${assignment.title} - Student: ${req.params.studentId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to grade assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
