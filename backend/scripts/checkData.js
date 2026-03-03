import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import User from '../models/User.js';
import Classroom from '../models/Classroom.js';
import Progress from '../models/Progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check students
    const students = await User.find({ role: 'student' });
    console.log(`\n📊 Found ${students.length} students:`);
    students.forEach(s => {
      console.log(`  - ${s.name} (${s.email})`);
    });

    // Check classrooms
    const classrooms = await Classroom.find();
    console.log(`\n📚 Found ${classrooms.length} classrooms:`);
    classrooms.forEach(c => {
      console.log(`  - ${c.name} (${c.code}) - ${c.students?.length || 0} students`);
    });

    // Check progress records
    const progress = await Progress.find().populate('student', 'name email').populate('classroom', 'name code');
    console.log(`\n📈 Found ${progress.length} progress records:`);
    progress.forEach(p => {
      console.log(`  - ${p.student?.name} in ${p.classroom?.name || 'No classroom'}`);
    });

    // Check if students are enrolled
    console.log('\n🔍 Checking enrollments:');
    for (const student of students) {
      const enrolledClassrooms = await Classroom.find({ students: student._id });
      console.log(`  - ${student.name}: enrolled in ${enrolledClassrooms.length} classrooms`);
      if (enrolledClassrooms.length > 0) {
        enrolledClassrooms.forEach(c => console.log(`    * ${c.name}`));
      }
    }

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
