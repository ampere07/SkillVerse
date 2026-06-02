import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongodbUri = process.env.MONGODB_URI;

// Define inline schemas/models to avoid import issues
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  level: Number,
  xp: Number
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const ClassroomSchema = new mongoose.Schema({
  name: String,
  code: String
});
const Classroom = mongoose.models.Classroom || mongoose.model('Classroom', ClassroomSchema);

const ProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  skills: {
    java: {
      exercisesCompleted: { type: Number, default: 0 },
      projectsCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastActivity: { type: Date }
    },
    python: {
      exercisesCompleted: { type: Number, default: 0 },
      projectsCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastActivity: { type: Date }
    }
  },
  activities: {
    codeExecutions: {
      total: { type: Number, default: 0 },
      java: { type: Number, default: 0 },
      python: { type: Number, default: 0 }
    },
    assignments: {
      totalSubmitted: { type: Number, default: 0 },
      onTime: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    },
    miniProjects: {
      completed: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    },
    bugHunt: {
      participated: { type: Number, default: 0 },
      bugsFound: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 }
    }
  },
  jobReadiness: {
    overallScore: Number,
    problemSolving: Number,
    codeQuality: Number,
    efficiency: Number,
    collaboration: Number,
    consistency: Number
  },
  detailedAiAnalysis: {
    overallScore: Number,
    problemSolvingScore: Number,
    codeQualityScore: Number,
    debuggingSkillsScore: Number,
    projectMasteryScore: Number,
    consistencyScore: Number,
    generatedAt: Date
  },
  streaks: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalActiveDays: { type: Number, default: 0 }
  },
  timeSpent: {
    totalMinutes: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 }
  }
});
const Progress = mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);

async function run() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected.');

    const studentId = '6988662735a8a428bf086232'; // Raven Ampere
    const progressRecords = await Progress.find({ student: studentId })
      .populate('student')
      .populate('classroom');

    console.log(`Found ${progressRecords.length} progress records.`);

    for (const p of progressRecords) {
      console.log(`Classroom: ${p.classroom?.name}`);
      console.log(`  jobReadiness.overallScore: ${p.jobReadiness?.overallScore}`);
      console.log(`  detailedAiAnalysis.overallScore: ${p.detailedAiAnalysis?.overallScore}`);
      console.log(`  detailedAiAnalysis detail:`, JSON.stringify(p.detailedAiAnalysis, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
