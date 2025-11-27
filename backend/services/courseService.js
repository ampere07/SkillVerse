import Course from '../models/Course.js';
import User from '../models/User.js';

export const courseService = {
  async getAllCourses() {
    return await Course.find({});
  },

  async getEnrolledCourses(userId) {
    const user = await User.findById(userId).populate('enrolledCourses.courseId');
    
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return [];
    }

    if (!user.enrolledCourses || user.enrolledCourses.length === 0) {
      return [];
    }

    return user.enrolledCourses
      .filter(enrollment => enrollment.courseId)
      .map(enrollment => ({
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
  },

  async enrollCourse(userId, courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const alreadyEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.courseId.toString() === courseId
    );

    if (alreadyEnrolled) {
      throw new Error('Already enrolled in this course');
    }

    user.enrolledCourses.push({
      courseId,
      progress: 0,
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    });

    course.enrolledStudents += 1;

    await user.save();
    await course.save();

    return course;
  }
};
