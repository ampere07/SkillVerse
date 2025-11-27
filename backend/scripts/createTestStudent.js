import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Survey from '../models/Survey.js';
import MiniProject from '../models/MiniProject.js';

const createTestStudent = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'studenttest1@gmail.com';
    const password = 'Studenttest1@gmail.com';
    const name = 'Student Test One';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists. Deleting existing user...');
      await Survey.deleteOne({ userId: existingUser._id });
      await MiniProject.deleteOne({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('Existing user deleted');
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('Creating user...');
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student',
      name: name,
      onboardingSurvey: {
        surveyCompleted: true
      }
    });
    await user.save();
    console.log('User created successfully');

    console.log('Creating survey...');
    const survey = new Survey({
      userId: user._id,
      primaryLanguage: ['python', 'java'],
      courseInterest: 'Full Stack Web Development',
      learningGoals: 'Master backend and frontend development to build complete web applications',
      javaExpertise: 'intermediate',
      pythonExpertise: 'advanced',
      javaQuestions: {
        answers: [0, 1, 0, 2, 1, 3, 2, 1, 0, 2],
        score: {
          total: 6,
          easy: 3,
          medium: 2,
          hard: 1,
          percentage: 60
        }
      },
      pythonQuestions: {
        answers: [0, 1, 2, 1, 0, 3, 1, 2, 0, 1],
        score: {
          total: 8,
          easy: 4,
          medium: 3,
          hard: 1,
          percentage: 80
        }
      },
      completed: true,
      aiAnalysis: 'Based on your assessment results, you demonstrate strong proficiency in Python with advanced knowledge and intermediate skills in Java. Your interest in Full Stack Web Development aligns well with your programming expertise. I recommend focusing on web frameworks like Django or Flask for Python, and Spring Boot for Java to achieve your goal of mastering backend and frontend development.',
      analysisGeneratedAt: new Date()
    });
    await survey.save();
    console.log('Survey created successfully');

    console.log('Creating mini project...');
    const miniProject = new MiniProject({
      userId: user._id,
      completedTasks: [
        {
          projectTitle: 'Simple Calculator',
          score: 85,
          codeBase: 'def add(a, b): return a + b\ndef subtract(a, b): return a - b\ndef multiply(a, b): return a * b\ndef divide(a, b): return a / b if b != 0 else "Error"',
          aiAnalyization: 'Great job! Your calculator implementation is clean and handles the basic operations well. The division by zero check is a nice touch. Consider adding more advanced operations like power and modulo for a more complete calculator.',
          status: 'completed',
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastSavedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          projectTitle: 'Todo List Manager',
          score: 92,
          codeBase: 'tasks = []\n\ndef add_task(task):\n    tasks.append({"task": task, "completed": False})\n\ndef complete_task(index):\n    if 0 <= index < len(tasks):\n        tasks[index]["completed"] = True\n\ndef view_tasks():\n    for i, task in enumerate(tasks):\n        status = "✓" if task["completed"] else "✗"\n        print(f"{i+1}. [{status}] {task["task"]}")',
          aiAnalyization: 'Excellent work! Your todo list manager is well-structured and functional. The use of dictionaries to store task data is smart. You might want to add features like task deletion and priority levels to make it even better.',
          status: 'completed',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          lastSavedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ],
      availableProjects: [
        {
          title: 'Weather Data Analyzer',
          description: 'Create a program that analyzes weather data from a CSV file. Calculate average temperatures, find the hottest and coldest days, and display monthly statistics.',
          language: 'python',
          requirements: 'Read CSV file, calculate averages, find min/max values, group data by month',
          sampleOutput: 'Average Temperature: 72.5°F\nHottest Day: July 15 (95°F)\nColdest Day: January 3 (28°F)',
          isAIGenerated: true,
          generatedAt: new Date(),
          weekNumber: 1,
          createdAt: new Date()
        },
        {
          title: 'Student Grade System',
          description: 'Build a student grade management system that stores student information, calculates GPA, and generates report cards.',
          language: 'java',
          requirements: 'Classes for Student and Course, GPA calculation, grade letter conversion, report generation',
          sampleOutput: 'Student: John Doe\nGPA: 3.75\nGrades: Math (A), Science (B+), English (A-)',
          isAIGenerated: true,
          generatedAt: new Date(),
          weekNumber: 1,
          createdAt: new Date()
        },
        {
          title: 'Password Strength Checker',
          description: 'Develop a password strength checker that evaluates passwords based on length, character variety, and common patterns.',
          language: 'python',
          requirements: 'Check length, uppercase, lowercase, numbers, special characters, common password detection',
          sampleOutput: 'Password Strength: Strong\nScore: 85/100\nSuggestions: Consider adding more special characters',
          isAIGenerated: true,
          generatedAt: new Date(),
          weekNumber: 1,
          createdAt: new Date()
        }
      ],
      weekStartDate: new Date(),
      lastWeekCompletedCount: 2,
      generationEnabled: true,
      lastGenerationDate: new Date(),
      currentWeekNumber: 1,
      weeklyProjectHistory: [
        {
          weekNumber: 1,
          weekStartDate: new Date(),
          weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          generatedProjects: [
            {
              title: 'Weather Data Analyzer',
              description: 'Create a program that analyzes weather data from a CSV file',
              language: 'python',
              requirements: 'Read CSV file, calculate averages',
              sampleOutput: 'Average Temperature: 72.5°F',
              isAIGenerated: true,
              generatedAt: new Date(),
              weekNumber: 1,
              createdAt: new Date()
            },
            {
              title: 'Student Grade System',
              description: 'Build a student grade management system',
              language: 'java',
              requirements: 'Classes for Student and Course',
              sampleOutput: 'Student: John Doe\nGPA: 3.75',
              isAIGenerated: true,
              generatedAt: new Date(),
              weekNumber: 1,
              createdAt: new Date()
            },
            {
              title: 'Password Strength Checker',
              description: 'Develop a password strength checker',
              language: 'python',
              requirements: 'Check length, character variety',
              sampleOutput: 'Password Strength: Strong',
              isAIGenerated: true,
              generatedAt: new Date(),
              weekNumber: 1,
              createdAt: new Date()
            }
          ],
          generatedAt: new Date()
        }
      ]
    });
    await miniProject.save();
    console.log('Mini project created successfully');

    console.log('\n=== Test Student Created Successfully ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', user._id.toString());
    console.log('Survey Completed: true');
    console.log('Completed Tasks: 2');
    console.log('Available Projects: 3');
    console.log('=====================================\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating test student:', error);
    process.exit(1);
  }
};

createTestStudent();
