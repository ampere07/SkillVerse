import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Get all students' progress for a specific classroom
router.get('/classroom/:classroomId/students', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user.userId;

    // Verify the teacher owns this classroom
    const Classroom = (await import('../models/Classroom.js')).default;
    const classroom = await Classroom.findOne({ 
      _id: classroomId, 
      teacher: teacherId 
    });

    if (!classroom) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not teach this classroom' 
      });
    }

    // Get all enrolled students
    const User = (await import('../models/User.js')).default;
    const studentIds = classroom.students.map(s => s.studentId);
    const students = await User.find({ 
      _id: { $in: studentIds },
      role: 'student'
    }).select('name email profilePicture level xp');

    // Get progress data for each student
    const Progress = (await import('../models/Progress.js')).default;
    const progressRecords = await Progress.find({ 
      classroom: classroomId,
      student: { $in: studentIds }
    }).populate('student', 'name email');

    // Combine student data with their progress
    const studentsWithProgress = students.map(student => {
      const progress = progressRecords.find(p => 
        p.student._id.toString() === student._id.toString()
      );

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        profilePicture: student.profilePicture,
        level: student.level,
        progress: progress ? {
          activities: progress.activities,
          skills: progress.skills,
          jobReadiness: progress.jobReadiness,
          streaks: progress.streaks,
          totalXp: student.xp || 0,
          lastUpdated: progress.updatedAt
        } : null
      };
    });

    res.json({
      success: true,
      students: studentsWithProgress,
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        code: classroom.code
      }
    });
  } catch (error) {
    console.error('Error fetching classroom students progress:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
