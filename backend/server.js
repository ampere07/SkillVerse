import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import compilerRoutes from './routes/compiler.js';
import surveyRoutes from './routes/survey.js';
import coursesRoutes from './routes/courses.js';
import miniProjectsRoutes from './routes/miniProjects.js';
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
app.use('/api/mini-projects', miniProjectsRoutes);

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
  console.log(`WebSocket server running`);
  
  await connectDB();
  
  initializeCronJobs();
});
