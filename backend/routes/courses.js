import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { courseService } from '../services/courseService.js';

const router = express.Router();

router.get('/all', authenticateToken, async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

router.get('/enrolled', authenticateToken, async (req, res) => {
  try {
    const courses = await courseService.getEnrolledCourses(req.user.userId);
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: error.message || 'Error fetching courses' });
  }
});

router.post('/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await courseService.enrollCourse(req.user.userId, courseId);
    res.json({ message: 'Successfully enrolled in course', course });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    
    if (error.message === 'Course not found' || error.message === 'Already enrolled in this course') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Error enrolling in course' });
  }
});

export default router;
