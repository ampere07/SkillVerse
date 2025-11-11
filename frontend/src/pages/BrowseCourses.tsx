import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';

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

const allCourses: Course[] = [
  {
    _id: '1',
    title: 'Complete Web Development Bootcamp',
    description: 'Master full-stack web development with HTML, CSS, JavaScript, React, Node.js, and MongoDB.',
    instructor: 'Sarah Johnson',
    category: 'Programming',
    level: 'Beginner',
    duration: 480,
    rating: 4.8,
    enrolledStudents: 12543
  },
  {
    _id: '2',
    title: 'Advanced React and Redux',
    description: 'Take your React skills to the next level with hooks, context API, Redux, and performance optimization.',
    instructor: 'Michael Chen',
    category: 'Programming',
    level: 'Advanced',
    duration: 360,
    rating: 4.9,
    enrolledStudents: 8234
  },
  {
    _id: '3',
    title: 'UI/UX Design Masterclass',
    description: 'Learn the principles of user interface and user experience design using Figma and Adobe XD.',
    instructor: 'Emily Rodriguez',
    category: 'Design',
    level: 'Intermediate',
    duration: 300,
    rating: 4.7,
    enrolledStudents: 9876
  },
  {
    _id: '4',
    title: 'Data Science with Python',
    description: 'Master data science using Python, NumPy, Pandas, and Matplotlib.',
    instructor: 'Dr. James Wilson',
    category: 'Data Science',
    level: 'Intermediate',
    duration: 420,
    rating: 4.8,
    enrolledStudents: 11234
  },
  {
    _id: '5',
    title: 'Digital Marketing Strategy',
    description: 'Learn how to create effective digital marketing campaigns with SEO and social media.',
    instructor: 'Amanda Lee',
    category: 'Marketing',
    level: 'Beginner',
    duration: 240,
    rating: 4.6,
    enrolledStudents: 15678
  },
  {
    _id: '6',
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile apps for iOS and Android using React Native.',
    instructor: 'Alex Park',
    category: 'Programming',
    level: 'Intermediate',
    duration: 400,
    rating: 4.7,
    enrolledStudents: 7456
  },
  {
    _id: '7',
    title: 'Machine Learning Fundamentals',
    description: 'Understand the core concepts of machine learning. Build and train models using Python, scikit-learn, and TensorFlow.',
    instructor: 'Dr. Lisa Martinez',
    category: 'Data Science',
    level: 'Advanced',
    duration: 480,
    rating: 4.9,
    enrolledStudents: 6543
  },
  {
    _id: '8',
    title: 'Graphic Design Essentials',
    description: 'Master the fundamentals of graphic design using Adobe Photoshop, Illustrator, and InDesign.',
    instructor: 'David Thompson',
    category: 'Design',
    level: 'Beginner',
    duration: 280,
    rating: 4.5,
    enrolledStudents: 10234
  },
  {
    _id: '9',
    title: 'Productivity and Time Management',
    description: 'Boost your productivity and achieve your goals with proven time management techniques and habit formation.',
    instructor: 'Jennifer Adams',
    category: 'Personal Development',
    level: 'Beginner',
    duration: 180,
    rating: 4.8,
    enrolledStudents: 18765
  },
  {
    _id: '10',
    title: 'Business Analytics and Intelligence',
    description: 'Learn to make data-driven business decisions with Excel, SQL, and business intelligence tools.',
    instructor: 'Robert Kumar',
    category: 'Business',
    level: 'Intermediate',
    duration: 350,
    rating: 4.7,
    enrolledStudents: 7890
  },
  {
    _id: '11',
    title: 'Introduction to Cybersecurity',
    description: 'Learn the fundamentals of cybersecurity, network security, and ethical hacking.',
    instructor: 'Marcus Johnson',
    category: 'Programming',
    level: 'Intermediate',
    duration: 320,
    rating: 4.6,
    enrolledStudents: 5432
  },
  {
    _id: '12',
    title: 'Content Creation for Social Media',
    description: 'Master content creation strategies for Instagram, TikTok, and YouTube.',
    instructor: 'Sophie Williams',
    category: 'Marketing',
    level: 'Beginner',
    duration: 200,
    rating: 4.4,
    enrolledStudents: 12456
  }
];

const getEnrolledCourses = () => {
  const stored = localStorage.getItem('enrolledCourseIds');
  return stored ? JSON.parse(stored) : ['1', '2', '3', '4', '5', '6'];
};

const saveEnrolledCourses = (ids: string[]) => {
  localStorage.setItem('enrolledCourseIds', JSON.stringify(ids));
};

export default function BrowseCourses() {
  const [enrolledIds, setEnrolledIds] = useState<string[]>(getEnrolledCourses());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setEnrolledIds(getEnrolledCourses());
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'Personal Development'];

  const availableCourses = allCourses.filter(course => !enrolledIds.includes(course._id));

  const filteredCourses = selectedCategory === 'All' 
    ? availableCourses 
    : availableCourses.filter(course => course.category === selectedCategory);

  const handleEnroll = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const confirmEnroll = () => {
    if (selectedCourse) {
      const newEnrolledIds = [...enrolledIds, selectedCourse._id];
      setEnrolledIds(newEnrolledIds);
      saveEnrolledCourses(newEnrolledIds);
      setShowEnrollModal(false);
      setSelectedCourse(null);
    }
  };

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
