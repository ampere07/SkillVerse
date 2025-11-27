import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { courseAPI } from '../utils/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: number;
  rating: number;
  enrolledStudents: number;
}

const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'Personal Development'];

export default function BrowseCourses() {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [allCoursesRes, enrolledCoursesRes] = await Promise.all([
        courseAPI.getAllCourses(),
        courseAPI.getEnrolledCourses()
      ]);
      
      setAllCourses(allCoursesRes.courses || []);
      setEnrolledIds((enrolledCoursesRes.courses || []).map((c: any) => c._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const availableCourses = allCourses.filter(course => !enrolledIds.includes(course._id));

  const filteredCourses = selectedCategory === 'All' 
    ? availableCourses 
    : availableCourses.filter(course => course.category === selectedCategory);

  const handleEnroll = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const confirmEnroll = async () => {
    if (selectedCourse) {
      try {
        await courseAPI.enrollCourse(selectedCourse._id);
        await fetchCourses();
        setShowEnrollModal(false);
        setSelectedCourse(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to enroll in course');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Courses</h2>
        <p className="text-sm text-gray-600">
          Discover new skills and expand your knowledge with our course catalog
        </p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses available</h3>
          <p className="text-sm text-gray-600">
            {selectedCategory === 'All' 
              ? "You're already enrolled in all available courses!" 
              : `No courses available in ${selectedCategory} category or you're already enrolled in them all.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course._id} 
              course={course}
              onEnroll={handleEnroll}
            />
          ))}
        </div>
      )}

      {showEnrollModal && selectedCourse && (
        <EnrollModal
          course={selectedCourse}
          onConfirm={confirmEnroll}
          onCancel={() => {
            setShowEnrollModal(false);
            setSelectedCourse(null);
          }}
        />
      )}
    </div>
  );
}

interface CourseCardProps {
  course: Course;
  onEnroll: (course: Course) => void;
}

function CourseCard({ course, onEnroll }: CourseCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {course.category}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-900 rounded">
            {course.level}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>

        <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-1">
          {course.description}
        </p>

        <div className="mt-auto">
          <button
            onClick={() => onEnroll(course)}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}

interface EnrollModalProps {
  course: Course;
  onConfirm: () => void;
  onCancel: () => void;
}

function EnrollModal({ course, onConfirm, onCancel }: EnrollModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enroll in Course</h3>
            <p className="text-sm text-gray-500">{course.title}</p>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Duration</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          By enrolling, you'll get lifetime access to all course materials, assignments, and updates.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Confirm Enrollment
          </button>
        </div>
      </div>
    </div>
  );
}
