import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import User from '../models/User.js';
import Classroom from '../models/Classroom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

async function fixEnrollment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the default classroom
    const classroom = await Classroom.findOne({ code: 'DEFAULT' });
    if (!classroom) {
      console.log('❌ No default classroom found');
      process.exit(1);
    }

    // Get all students
    const students = await User.find({ role: 'student' });
    console.log(`\n👥 Found ${students.length} students`);

    // Check current enrollment
    const currentlyEnrolled = classroom.students || [];
    console.log(`\n📚 Currently enrolled: ${currentlyEnrolled.length} students`);

    // Enroll all students
    const studentIds = students.map(s => ({
      studentId: s._id,
      joinedAt: new Date()
    }));

    classroom.students = studentIds;
    await classroom.save();

    console.log(`\n✅ Enrolled ${students.length} students in ${classroom.name}`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEnrollment();
