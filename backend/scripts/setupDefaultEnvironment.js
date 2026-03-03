import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import User from '../models/User.js';
import Classroom from '../models/Classroom.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

async function setupDefaultEnvironment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create a default teacher if none exists
    let teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('\n👨‍🏫 Creating default teacher...');
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      
      teacher = new User({
        name: 'Default Teacher',
        email: 'teacher@skillverse.com',
        password: hashedPassword,
        role: 'teacher',
        isEmailVerified: true,
        createdAt: new Date()
      });
      
      await teacher.save();
      console.log(`   ✅ Created teacher: ${teacher.name} (${teacher.email})`);
    } else {
      console.log(`\n👨‍🏫 Found existing teacher: ${teacher.name}`);
    }

    // Step 2: Create a default classroom if none exists
    let classroom = await Classroom.findOne();
    if (!classroom) {
      console.log('\n📚 Creating default classroom...');
      
      // Get all students
      const students = await User.find({ role: 'student' });
      console.log(`   Found ${students.length} students to enroll`);

      classroom = new Classroom({
        name: 'Default Classroom',
        code: 'DEFAULT',
        description: 'Default classroom for all students',
        teacher: teacher._id,
        students: students.map(s => ({
          studentId: s._id,
          joinedAt: new Date()
        })),
        isActive: true,
        createdAt: new Date()
      });

      await classroom.save();
      console.log(`   ✅ Created classroom: ${classroom.name}`);
      console.log(`   Code: ${classroom.code}`);
      console.log(`   Teacher: ${teacher.name}`);
      console.log(`   Enrolled ${students.length} students`);
    } else {
      console.log(`\n📚 Found existing classroom: ${classroom.name}`);
    }

    console.log('\n✅ Environment setup complete!');
    console.log('\nYou can now run the student progress analyzer:');
    console.log('   npm run cron-analyze');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupDefaultEnvironment();
