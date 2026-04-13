import mongoose from 'mongoose';
import Assignment from './models/Assignment.js';
import dotenv from 'dotenv';
dotenv.config();

const studentId = '6988662735a8a428bf086232';

async function checkAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const assignments = await Assignment.find({});
    console.log(`Total assignments in DB: ${assignments.length}`);

    let userSubmissions = 0;
    assignments.forEach(a => {
      const sub = a.submissions.find(s => s.student?.toString() === studentId);
      if (sub) {
        userSubmissions++;
        console.log(`Found submission in assignment: ${a.title}`);
        console.log(`Submission content:`, sub);
      }
    });

    console.log(`Total submissions found for user ${studentId}: ${userSubmissions}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAssignments();
