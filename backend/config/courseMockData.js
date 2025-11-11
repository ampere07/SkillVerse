const courseMockData = [
  {
    title: "Complete Web Development Bootcamp",
    description: "Master full-stack web development with HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and deploy them to production.",
    instructor: "Sarah Johnson",
    category: "Programming",
    level: "Beginner",
    duration: 480,
    price: 89.99,
    rating: 4.8,
    enrolledStudents: 12543,
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    modules: [
      {
        title: "Introduction to Web Development",
        lessons: [
          { title: "Course Overview", duration: 15, completed: false },
          { title: "Setting Up Your Development Environment", duration: 30, completed: false },
          { title: "HTML Basics", duration: 45, completed: false }
        ]
      },
      {
        title: "CSS Fundamentals",
        lessons: [
          { title: "CSS Syntax and Selectors", duration: 40, completed: false },
          { title: "Flexbox and Grid", duration: 60, completed: false },
          { title: "Responsive Design", duration: 50, completed: false }
        ]
      },
      {
        title: "JavaScript Essentials",
        lessons: [
          { title: "Variables and Data Types", duration: 35, completed: false },
          { title: "Functions and Scope", duration: 45, completed: false },
          { title: "DOM Manipulation", duration: 55, completed: false }
        ]
      }
    ]
  },
  {
    title: "Advanced React and Redux",
    description: "Take your React skills to the next level. Learn hooks, context API, Redux, performance optimization, and modern React patterns.",
    instructor: "Michael Chen",
    category: "Programming",
    level: "Advanced",
    duration: 360,
    price: 119.99,
    rating: 4.9,
    enrolledStudents: 8234,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
    modules: [
      {
        title: "React Hooks Deep Dive",
        lessons: [
          { title: "useState and useEffect", duration: 50, completed: false },
          { title: "Custom Hooks", duration: 40, completed: false },
          { title: "useContext and useReducer", duration: 45, completed: false }
        ]
      },
      {
        title: "State Management with Redux",
        lessons: [
          { title: "Redux Fundamentals", duration: 60, completed: false },
          { title: "Redux Toolkit", duration: 55, completed: false },
          { title: "Async Actions with Thunks", duration: 50, completed: false }
        ]
      }
    ]
  },
  {
    title: "UI/UX Design Masterclass",
    description: "Learn the principles of user interface and user experience design. Create stunning designs using Figma and Adobe XD.",
    instructor: "Emily Rodriguez",
    category: "Design",
    level: "Intermediate",
    duration: 300,
    price: 79.99,
    rating: 4.7,
    enrolledStudents: 9876,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
    modules: [
      {
        title: "Design Principles",
        lessons: [
          { title: "Color Theory", duration: 40, completed: false },
          { title: "Typography", duration: 35, completed: false },
          { title: "Layout and Composition", duration: 45, completed: false }
        ]
      },
      {
        title: "User Research",
        lessons: [
          { title: "User Personas", duration: 30, completed: false },
          { title: "User Journey Maps", duration: 40, completed: false },
          { title: "Usability Testing", duration: 50, completed: false }
        ]
      }
    ]
  },
  {
    title: "Data Science with Python",
    description: "Master data science using Python, NumPy, Pandas, and Matplotlib. Learn statistical analysis and machine learning basics.",
    instructor: "Dr. James Wilson",
    category: "Data Science",
    level: "Intermediate",
    duration: 420,
    price: 99.99,
    rating: 4.8,
    enrolledStudents: 11234,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
    modules: [
      {
        title: "Python for Data Science",
        lessons: [
          { title: "NumPy Fundamentals", duration: 45, completed: false },
          { title: "Pandas DataFrames", duration: 60, completed: false },
          { title: "Data Cleaning", duration: 50, completed: false }
        ]
      },
      {
        title: "Data Visualization",
        lessons: [
          { title: "Matplotlib Basics", duration: 40, completed: false },
          { title: "Seaborn for Statistical Plots", duration: 45, completed: false },
          { title: "Interactive Visualizations", duration: 55, completed: false }
        ]
      }
    ]
  },
  {
    title: "Digital Marketing Strategy",
    description: "Learn how to create and execute effective digital marketing campaigns. Master SEO, social media, content marketing, and analytics.",
    instructor: "Amanda Lee",
    category: "Marketing",
    level: "Beginner",
    duration: 240,
    price: 69.99,
    rating: 4.6,
    enrolledStudents: 15678,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    modules: [
      {
        title: "Marketing Fundamentals",
        lessons: [
          { title: "Understanding Your Audience", duration: 30, completed: false },
          { title: "Marketing Channels Overview", duration: 35, completed: false },
          { title: "Creating a Marketing Plan", duration: 40, completed: false }
        ]
      },
      {
        title: "SEO and Content Marketing",
        lessons: [
          { title: "Keyword Research", duration: 35, completed: false },
          { title: "On-Page SEO", duration: 40, completed: false },
          { title: "Content Strategy", duration: 45, completed: false }
        ]
      }
    ]
  },
  {
    title: "Business Analytics and Intelligence",
    description: "Learn to make data-driven business decisions. Master Excel, SQL, and business intelligence tools like Tableau and Power BI.",
    instructor: "Robert Kumar",
    category: "Business",
    level: "Intermediate",
    duration: 350,
    price: 94.99,
    rating: 4.7,
    enrolledStudents: 7890,
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
    modules: [
      {
        title: "Excel for Business Analytics",
        lessons: [
          { title: "Advanced Formulas", duration: 45, completed: false },
          { title: "Pivot Tables and Charts", duration: 50, completed: false },
          { title: "Data Analysis Tools", duration: 40, completed: false }
        ]
      },
      {
        title: "SQL for Data Analysis",
        lessons: [
          { title: "SQL Basics", duration: 40, completed: false },
          { title: "Joins and Subqueries", duration: 55, completed: false },
          { title: "Aggregate Functions", duration: 45, completed: false }
        ]
      }
    ]
  },
  {
    title: "Machine Learning Fundamentals",
    description: "Understand the core concepts of machine learning. Build and train models using Python, scikit-learn, and TensorFlow.",
    instructor: "Dr. Lisa Martinez",
    category: "Data Science",
    level: "Advanced",
    duration: 480,
    price: 129.99,
    rating: 4.9,
    enrolledStudents: 6543,
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
    modules: [
      {
        title: "Introduction to Machine Learning",
        lessons: [
          { title: "Types of Machine Learning", duration: 40, completed: false },
          { title: "Supervised vs Unsupervised Learning", duration: 45, completed: false },
          { title: "Model Evaluation Metrics", duration: 50, completed: false }
        ]
      },
      {
        title: "Supervised Learning Algorithms",
        lessons: [
          { title: "Linear Regression", duration: 60, completed: false },
          { title: "Decision Trees and Random Forests", duration: 65, completed: false },
          { title: "Support Vector Machines", duration: 55, completed: false }
        ]
      }
    ]
  },
  {
    title: "Graphic Design Essentials",
    description: "Master the fundamentals of graphic design using Adobe Photoshop, Illustrator, and InDesign. Create professional designs from scratch.",
    instructor: "David Thompson",
    category: "Design",
    level: "Beginner",
    duration: 280,
    price: 74.99,
    rating: 4.5,
    enrolledStudents: 10234,
    thumbnail: "https://images.unsplash.com/photo-1626785774573-4b799315345d",
    modules: [
      {
        title: "Adobe Photoshop Basics",
        lessons: [
          { title: "Interface and Tools", duration: 35, completed: false },
          { title: "Layers and Masks", duration: 45, completed: false },
          { title: "Photo Manipulation", duration: 50, completed: false }
        ]
      },
      {
        title: "Adobe Illustrator",
        lessons: [
          { title: "Vector Graphics Fundamentals", duration: 40, completed: false },
          { title: "Creating Logos", duration: 55, completed: false },
          { title: "Typography in Illustrator", duration: 45, completed: false }
        ]
      }
    ]
  },
  {
    title: "Productivity and Time Management",
    description: "Boost your productivity and achieve your goals. Learn proven time management techniques, habit formation, and focus strategies.",
    instructor: "Jennifer Adams",
    category: "Personal Development",
    level: "Beginner",
    duration: 180,
    price: 49.99,
    rating: 4.8,
    enrolledStudents: 18765,
    thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b",
    modules: [
      {
        title: "Time Management Fundamentals",
        lessons: [
          { title: "Understanding Your Time", duration: 25, completed: false },
          { title: "Priority Management", duration: 30, completed: false },
          { title: "The Eisenhower Matrix", duration: 35, completed: false }
        ]
      },
      {
        title: "Building Productive Habits",
        lessons: [
          { title: "The Science of Habit Formation", duration: 30, completed: false },
          { title: "Morning Routines", duration: 25, completed: false },
          { title: "Overcoming Procrastination", duration: 35, completed: false }
        ]
      }
    ]
  },
  {
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile apps for iOS and Android using React Native. Learn navigation, animations, and native module integration.",
    instructor: "Alex Park",
    category: "Programming",
    level: "Intermediate",
    duration: 400,
    price: 109.99,
    rating: 4.7,
    enrolledStudents: 7456,
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    modules: [
      {
        title: "React Native Basics",
        lessons: [
          { title: "Setting Up React Native", duration: 40, completed: false },
          { title: "Core Components", duration: 50, completed: false },
          { title: "Styling in React Native", duration: 45, completed: false }
        ]
      },
      {
        title: "Navigation and Routing",
        lessons: [
          { title: "React Navigation Setup", duration: 45, completed: false },
          { title: "Stack and Tab Navigation", duration: 55, completed: false },
          { title: "Passing Data Between Screens", duration: 40, completed: false }
        ]
      }
    ]
  }
];

export default courseMockData;
