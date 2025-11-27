import express from 'express';
import Activity from '../models/Activity.js';
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

    const activities = await Activity.find(query)
      .populate('teacher', 'name email')
      .populate('students.studentId', 'name email')
      .populate('submissions.student', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('classroom')
      .populate('students.studentId', 'name email')
      .populate('submissions.student', 'name email');

    if (!activity) {
      return res.status(404).json({ 
        success: false,
        message: 'Activity not found' 
      });
    }

    const isTeacher = activity.teacher._id.toString() === req.user.userId;
    const isStudent = activity.classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this activity' 
      });
    }

    if (req.user.role === 'student' && !activity.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This activity is not yet published' 
      });
    }

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch activity',
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
      dueDate,
      points,
      instructions,
      duration,
      requiresCompiler,
      isPublished,
      allowLateSubmission,
      attachments
    } = req.body;

    if (!classroomId || !title || !description || !instructions) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom ID, title, description, and instructions are required' 
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
        message: 'You can only create activities in your own classrooms' 
      });
    }

    const classroomStudents = classroom.students.map(s => ({
      studentId: s.studentId,
      assignedAt: new Date()
    }));

    const activity = new Activity({
      classroom: classroomId,
      teacher: req.user.userId,
      title,
      description,
      dueDate: dueDate || null,
      points: points || 100,
      instructions,
      duration: duration || { hours: 0, minutes: 0 },
      requiresCompiler: requiresCompiler || false,
      attachments: attachments || [],
      students: classroomStudents,
      isPublished: isPublished !== undefined ? isPublished : true,
      allowLateSubmission: allowLateSubmission || false
    });

    await activity.save();
    await activity.populate('teacher', 'name email');
    await activity.populate('classroom', 'name code');

    console.log(`New activity created: ${activity.title} in ${classroom.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ 
        success: false,
        message: 'Activity not found' 
      });
    }

    if (activity.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update your own activities' 
      });
    }

    const { 
      title, 
      description, 
      dueDate,
      points,
      instructions,
      duration,
      requiresCompiler,
      isPublished,
      allowLateSubmission
    } = req.body;

    if (title) activity.title = title;
    if (description) activity.description = description;
    if (dueDate !== undefined) activity.dueDate = dueDate;
    if (points !== undefined) activity.points = points;
    if (instructions !== undefined) activity.instructions = instructions;
    if (duration !== undefined) activity.duration = duration;
    if (requiresCompiler !== undefined) activity.requiresCompiler = requiresCompiler;
    if (isPublished !== undefined) activity.isPublished = isPublished;
    if (allowLateSubmission !== undefined) activity.allowLateSubmission = allowLateSubmission;

    await activity.save();
    await activity.populate('teacher', 'name email');
    await activity.populate('classroom', 'name code');

    console.log(`Activity updated: ${activity.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/:id', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ 
        success: false,
        message: 'Activity not found' 
      });
    }

    if (activity.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own activities' 
      });
    }

    await activity.deleteOne();

    console.log(`Activity deleted: ${activity.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:id/submit', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('classroom');

    if (!activity) {
      return res.status(404).json({ 
        success: false,
        message: 'Activity not found' 
      });
    }

    const isEnrolled = activity.classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (!isEnrolled) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not enrolled in this classroom' 
      });
    }

    if (!activity.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This activity is not yet published' 
      });
    }

    const existingSubmission = activity.submissions.find(
      s => s.student.toString() === req.user.userId
    );

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already submitted this activity' 
      });
    }

    if (activity.dueDate && !activity.allowLateSubmission) {
      if (new Date() > new Date(activity.dueDate)) {
        return res.status(400).json({ 
          success: false,
          message: 'Submission deadline has passed' 
        });
      }
    }

    let content = '';
    let attachments = [];

    if (activity.requiresCompiler) {
      content = req.body.codeBase || '';
    } else {
      content = req.body.content || '';
      attachments = req.body.attachments || [];
    }

    await activity.submitActivity(req.user.userId, content, attachments);

    console.log(`Activity submitted: ${activity.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Activity submitted successfully'
    });
  } catch (error) {
    console.error('Submit activity error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to submit activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:id/unsubmit', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('classroom');

    if (!activity) {
      return res.status(404).json({ 
        success: false,
        message: 'Activity not found' 
      });
    }

    const isEnrolled = activity.classroom.students.some(
      s => s.studentId.toString() === req.user.userId
    );

    if (!isEnrolled) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not enrolled in this classroom' 
      });
    }

    const submissionIndex = activity.submissions.findIndex(
      s => s.student.toString() === req.user.userId
    );

    if (submissionIndex === -1) {
      return res.status(400).json({ 
        success: false,
        message: 'No submission found to unsubmit' 
      });
    }

    activity.submissions.splice(submissionIndex, 1);
    await activity.save();

    console.log(`Activity unsubmitted: ${activity.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Activity unsubmitted successfully'
    });
  } catch (error) {
    console.error('Unsubmit activity error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to unsubmit activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:id/grade/:studentId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ 
        success: false,
        message: 'Activity not found' 
      });
    }

    if (activity.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only grade activities in your own classrooms' 
      });
    }

    if (grade === undefined || grade < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid grade is required' 
      });
    }

    await activity.gradeSubmission(req.params.studentId, grade, feedback);

    console.log(`Activity graded: ${activity.title} - Student: ${req.params.studentId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Activity graded successfully'
    });
  } catch (error) {
    console.error('Grade activity error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to grade activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
