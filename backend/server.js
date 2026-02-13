import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import compilerRoutes from './routes/compiler.js';
import surveyRoutes from './routes/survey.js';
import coursesRoutes from './routes/courses.js';
import classroomRoutes from './routes/classroom.js';
import assignmentRoutes from './routes/assignment.js';
import activityRoutes from './routes/activity.js';
import moduleRoutes from './routes/module.js';
import uploadRoutes from './routes/upload.js';
import miniProjectsRoutes from './routes/miniProjects.js';
import ollamaTestRoutes from './routes/ollamaTest.js';
import demoRoutes from './routes/demo.js';
import progressRoutes from './routes/progress.js';
import healthRoutes from './routes/health.js';
import bugHuntRoutes from './routes/bugHunt.js';
import { setupCompilerSocket } from './routes/compilerSocket.js';
import { setupPythonCompilerSocket } from './routes/pythonCompilerSocket.js';
import { initializeCronJobs } from './services/cronService.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/compiler', compilerRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mini-projects', miniProjectsRoutes);
app.use('/api/ollama', ollamaTestRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/bug-hunt', bugHuntRoutes);

setupCompilerSocket(io);
setupPythonCompilerSocket(io);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    dbName: mongoose.connection.db?.databaseName
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

httpServer.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  console.log(`AI Status: http://localhost:${PORT}/api/health/ai-status`);
  console.log(`WebSocket server running`);

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory');
  }

  await connectDB();

  initializeCronJobs();
});
