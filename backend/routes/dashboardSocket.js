import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Store active connections by user ID
const activeConnections = new Map();

export const setupDashboardSocket = (io) => {
    // Create a namespace for dashboard updates
    const dashboardNamespace = io.of('/dashboard');

    dashboardNamespace.on('connection', (socket) => {
        console.log('Dashboard client connected:', socket.id);

        // Authenticate socket connection
        socket.on('authenticate', async (token) => {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;

                // Store the connection
                if (!activeConnections.has(socket.userId)) {
                    activeConnections.set(socket.userId, new Set());
                }
                activeConnections.get(socket.userId).add(socket.id);

                socket.emit('authenticated', { success: true, userId: socket.userId });
                console.log(`User ${socket.userId} authenticated on dashboard socket`);

                // Join user-specific room
                socket.join(`user-${socket.userId}`);
            } catch (error) {
                console.error('Socket authentication failed:', error.message);
                socket.emit('authentication-error', { message: 'Invalid token' });
                socket.disconnect();
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            if (socket.userId && activeConnections.has(socket.userId)) {
                const userSockets = activeConnections.get(socket.userId);
                userSockets.delete(socket.id);

                if (userSockets.size === 0) {
                    activeConnections.delete(socket.userId);
                }
            }
            console.log('Dashboard client disconnected:', socket.id);
        });

        // Handle request for dashboard data
        socket.on('request-dashboard-update', async () => {
            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            try {
                // Here you can emit updated data
                // This is just a placeholder - you'll integrate with your actual data fetching logic
                socket.emit('dashboard-update', {
                    timestamp: new Date().toISOString(),
                    message: 'Dashboard data updated'
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                socket.emit('error', { message: 'Failed to fetch dashboard data' });
            }
        });
    });

    return dashboardNamespace;
};

// Helper function to emit updates to a specific user
export const emitToUser = (io, userId, event, data) => {
    const dashboardNamespace = io.of('/dashboard');
    dashboardNamespace.to(`user-${userId}`).emit(event, data);
};

// Helper function to emit updates when mini-projects are completed
export const emitMiniProjectUpdate = (io, userId, projectData) => {
    emitToUser(io, userId, 'mini-project-update', projectData);
};

// Helper function to emit updates when assignments are updated
export const emitAssignmentUpdate = (io, userId, assignmentData) => {
    emitToUser(io, userId, 'assignment-update', assignmentData);
};

// Helper function to emit updates when courses are enrolled
export const emitCourseUpdate = (io, userId, courseData) => {
    emitToUser(io, userId, 'course-update', courseData);
};

// Helper function to emit real-time activity updates
export const emitActivityUpdate = (io, userId, activityData) => {
    emitToUser(io, userId, 'activity-update', activityData);
};
