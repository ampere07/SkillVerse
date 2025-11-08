import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/enrolled', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('enrolledCourses.courseId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enrolledCoursesData = user.enrolledCourses.map(enrollment => ({
      _id: enrollment.courseId._id,
      title: enrollment.courseId.title,
      description: enrollment.courseId.description,
      instructor: enrollment.courseId.instructor,
      category: enrollment.courseId.category,
      level: enrollment.courseId.level,
      duration: enrollment.courseId.duration,
      thumbnail: enrollment.courseId.thumbnail,
      progress: enrollment.progress,
      lastAccessedAt: enrollment.lastAccessedAt,
      enrolledAt: enrollment.enrolledAt
    }));

    res.json({ courses: enrolledCoursesData });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

export default router;
