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

async function createDefaultClassroom() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any classroom exists
    const existingClassroom = await Classroom.findOne();
    if (existingClassroom) {
      console.log(`\n⚠️  Classroom already exists: ${existingClassroom.name}`);
      console.log('   No need to create a default classroom.');
      process.exit(0);
    }

    // Get a teacher to assign as classroom owner
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('\n⚠️  No teacher found. Creating classroom without teacher.');
    }

    // Get all students to enroll them
    const students = await User.find({ role: 'student' });
    console.log(`\n📚 Found ${students.length} students to enroll`);

    // Create default classroom
    const classroom = new Classroom({
      name: 'Default Classroom',
      code: 'DEFAULT',
      description: 'Default classroom for all students',
      teacher: teacher?._id || null,
      students: students.map(s => s._id),
      isActive: true,
      createdAt: new Date()
    });

    await classroom.save();
    console.log(`\n✅ Created default classroom: ${classroom.name}`);
    console.log(`   Code: ${classroom.code}`);
    console.log(`   Enrolled ${students.length} students`);
    
    if (teacher) {
      console.log(`   Teacher: ${teacher.name}`);
    }

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createDefaultClassroom();
