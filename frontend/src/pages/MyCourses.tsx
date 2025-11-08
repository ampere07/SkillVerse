import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Clock, BarChart3, X, Plus, Star, Users } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  rating: number;
  enrolledStudents: number;
  thumbnail: string;
  progress?: number;
  lastAccessedAt?: string;
  enrolledAt?: string;
}

const allCourses: Course[] = [
  {
    _id: '1',
    title: 'Complete Web Development Bootcamp',
    description: 'Master full-stack web development with HTML, CSS, JavaScript, React, Node.js, and MongoDB.',
    instructor: 'Sarah Johnson',
    category: 'Programming',
    level: 'Beginner',
    duration: 480,
    price: 89.99,
    rating: 4.8,
    enrolledStudents: 12543,
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'
  },
  {
    _id: '2',
    title: 'Advanced React and Redux',
    description: 'Take your React skills to the next level with hooks, context API, Redux, and performance optimization.',
    instructor: 'Michael Chen',
    category: 'Programming',
    level: 'Advanced',
    duration: 360,
    price: 119.99,
    rating: 4.9,
    enrolledStudents: 8234,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400'
  },
  {
    _id: '3',
    title: 'UI/UX Design Masterclass',
    description: 'Learn the principles of user interface and user experience design using Figma and Adobe XD.',
    instructor: 'Emily Rodriguez',
    category: 'Design',
    level: 'Intermediate',
    duration: 300,
    price: 79.99,
    rating: 4.7,
    enrolledStudents: 9876,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400'
  },
  {
    _id: '4',
    title: 'Data Science with Python',
    description: 'Master data science using Python, NumPy, Pandas, and Matplotlib.',
    instructor: 'Dr. James Wilson',
    category: 'Data Science',
    level: 'Intermediate',
    duration: 420,
    price: 99.99,
    rating: 4.8,
    enrolledStudents: 11234,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'
  },
  {
    _id: '5',
    title: 'Digital Marketing Strategy',
    description: 'Learn how to create effective digital marketing campaigns with SEO and social media.',
    instructor: 'Amanda Lee',
    category: 'Marketing',
    level: 'Beginner',
    duration: 240,
    price: 69.99,
    rating: 4.6,
    enrolledStudents: 15678,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400'
  },
  {
    _id: '6',
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile apps for iOS and Android using React Native.',
    instructor: 'Alex Park',
    category: 'Programming',
    level: 'Intermediate',
    duration: 400,
    price: 109.99,
    rating: 4.7,
    enrolledStudents: 7456,
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400'
  },
  {
    _id: '7',
    title: 'Machine Learning Fundamentals',
    description: 'Understand the core concepts of machine learning. Build and train models using Python, scikit-learn, and TensorFlow.',
    instructor: 'Dr. Lisa Martinez',
    category: 'Data Science',
    level: 'Advanced',
    duration: 480,
    price: 129.99,
    rating: 4.9,
    enrolledStudents: 6543,
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400'
  },
  {
    _id: '8',
    title: 'Graphic Design Essentials',
    description: 'Master the fundamentals of graphic design using Adobe Photoshop, Illustrator, and InDesign.',
    instructor: 'David Thompson',
    category: 'Design',
    level: 'Beginner',
    duration: 280,
    price: 74.99,
    rating: 4.5,
    enrolledStudents: 10234,
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400'
  },
  {
    _id: '9',
    title: 'Productivity and Time Management',
    description: 'Boost your productivity and achieve your goals with proven time management techniques and habit formation.',
    instructor: 'Jennifer Adams',
    category: 'Personal Development',
    level: 'Beginner',
    duration: 180,
    price: 49.99,
    rating: 4.8,
    enrolledStudents: 18765,
    thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400'
  },
  {
    _id: '10',
    title: 'Business Analytics and Intelligence',
    description: 'Learn to make data-driven business decisions with Excel, SQL, and business intelligence tools.',
    instructor: 'Robert Kumar',
    category: 'Business',
    level: 'Intermediate',
    duration: 350,
    price: 94.99,
    rating: 4.7,
    enrolledStudents: 7890,
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400'
  },
  {
    _id: '11',
    title: 'Introduction to Cybersecurity',
    description: 'Learn the fundamentals of cybersecurity, network security, and ethical hacking.',
    instructor: 'Marcus Johnson',
    category: 'Programming',
    level: 'Intermediate',
    duration: 320,
    price: 109.99,
    rating: 4.6,
    enrolledStudents: 5432,
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400'
  },
  {
    _id: '12',
    title: 'Content Creation for Social Media',
    description: 'Master content creation strategies for Instagram, TikTok, and YouTube.',
    instructor: 'Sophie Williams',
    category: 'Marketing',
    level: 'Beginner',
    duration: 200,
    price: 59.99,
    rating: 4.4,
    enrolledStudents: 12456,
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'
  }
];

const initialEnrolledIds = ['1', '2', '3', '4', '5', '6'];

const getEnrolledCourses = () => {
  const stored = localStorage.getItem('enrolledCourseIds');
  return stored ? JSON.parse(stored) : initialEnrolledIds;
};

const saveEnrolledCourses = (ids: string[]) => {
  localStorage.setItem('enrolledCourseIds', JSON.stringify(ids));
};

export default function MyCourses() {
  const { user } = useAuth();
  const [enrolledIds, setEnrolledIds] = useState<string[]>(getEnrolledCourses());
  const [showDropModal, setShowDropModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [showBrowseModal, setShowBrowseModal] = useState(false);

  const enrolledCourses = allCourses
    .filter(course => enrolledIds.includes(course._id))
    .map((course, index) => ({
      ...course,
      progress: [75, 45, 60, 0, 20, 35][index] || 0,
      lastAccessedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      enrolledAt: new Date(Date.now() - (30 - index * 5) * 24 * 60 * 60 * 1000).toISOString()
    }));

  const handleDropCourse = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDropModal(true);
  };

  const confirmDropCourse = () => {
    if (courseToDelete) {
      const newEnrolledIds = enrolledIds.filter(id => id !== courseToDelete);
      setEnrolledIds(newEnrolledIds);
      saveEnrolledCourses(newEnrolledIds);
      setShowDropModal(false);
      setCourseToDelete(null);
    }
  };

  const handleEnroll = (courseId: string) => {
    const newEnrolledIds = [...enrolledIds, courseId];
    setEnrolledIds(newEnrolledIds);
    saveEnrolledCourses(newEnrolledIds);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Courses</h2>
          <p className="text-sm text-gray-600">
            Continue learning and track your progress across all enrolled courses
          </p>
        </div>
        <button
          onClick={() => setShowBrowseModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Join Class
        </button>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-sm text-gray-600 mb-6">
            Start your learning journey by enrolling in your first course
          </p>
          <button 
            onClick={() => setShowBrowseModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <CourseCard 
              key={course._id} 
              course={course} 
              onDrop={handleDropCourse}
            />
          ))}
        </div>
      )}

      {showDropModal && (
        <DropCourseModal
          onConfirm={confirmDropCourse}
          onCancel={() => {
            setShowDropModal(false);
            setCourseToDelete(null);
          }}
        />
      )}

      {showBrowseModal && (
        <BrowseCoursesModal
          enrolledIds={enrolledIds}
          onEnroll={handleEnroll}
          onClose={() => setShowBrowseModal(false)}
        />
      )}
    </div>
  );
}

interface CourseCardProps {
  course: Course;
  onDrop: (courseId: string) => void;
}

function CourseCard({ course, onDrop }: CourseCardProps) {
  const formatLastAccessed = (date: string) => {
    const lastAccessed = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return lastAccessed.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-gray-200">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-white text-xs font-medium text-gray-900 rounded">
            {course.level}
          </span>
        </div>
        <button
          onClick={() => onDrop(course._id)}
          className="absolute top-3 left-3 w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition-colors group"
          title="Drop course"
        >
          <X className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {course.category}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-gray-700">
          {course.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>

        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.floor(course.duration / 60)}h {course.duration % 60}m</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{course.progress}% complete</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Progress</span>
            <span className="text-xs font-medium text-gray-900">{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Last accessed: {formatLastAccessed(course.lastAccessedAt || '')}
          </p>
        </div>
      </div>
    </div>
  );
}

interface DropCourseModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DropCourseModal({ onConfirm, onCancel }: DropCourseModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop Course</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to drop this course? All your progress will be lost and you'll need to re-enroll to access it again.
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
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Drop Course
          </button>
        </div>
      </div>
    </div>
  );
}

interface BrowseCoursesModalProps {
  enrolledIds: string[];
  onEnroll: (courseId: string) => void;
  onClose: () => void;
}

function BrowseCoursesModal({ enrolledIds, onEnroll, onClose }: BrowseCoursesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'Personal Development'];

  const availableCourses = allCourses.filter(course => !enrolledIds.includes(course._id));

  const filteredCourses = selectedCategory === 'All' 
    ? availableCourses 
    : availableCourses.filter(course => course.category === selectedCategory);

  const handleEnrollClick = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const confirmEnroll = () => {
    if (selectedCourse) {
      onEnroll(selectedCourse._id);
      setShowEnrollModal(false);
      setSelectedCourse(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Courses</h2>
              <p className="text-sm text-gray-600 mt-1">
                Discover new skills and expand your knowledge
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

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

        <div className="flex-1 overflow-y-auto p-6">
          {filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses available</h3>
              <p className="text-sm text-gray-600">
                {selectedCategory === 'All' 
                  ? "You're already enrolled in all available courses!" 
                  : `No courses available in ${selectedCategory} category.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <BrowseCourseCard 
                  key={course._id} 
                  course={course}
                  onEnroll={handleEnrollClick}
                />
              ))}
            </div>
          )}
        </div>

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
    </div>
  );
}

interface BrowseCourseCardProps {
  course: Course;
  onEnroll: (course: Course) => void;
}

function BrowseCourseCard({ course, onEnroll }: BrowseCourseCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-gray-200">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-white text-xs font-medium text-gray-900 rounded">
            {course.level}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {course.category}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.floor(course.duration / 60)}h {course.duration % 60}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>{course.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{course.enrolledStudents.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xl font-bold text-gray-900">${course.price}</span>
          <button
            onClick={() => onEnroll(course)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
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
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Course Price</span>
            <span className="text-lg font-bold text-gray-900">${course.price}</span>
          </div>
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
