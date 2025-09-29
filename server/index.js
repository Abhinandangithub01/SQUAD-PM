const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/files', require('./routes/files'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

// Socket.io connection handling
const socketAuth = require('./middleware/socketAuth');

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Join user to their personal room for notifications
  socket.join(`user_${socket.userId}`);

  // Join project rooms
  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User ${socket.userId} joined project ${projectId}`);
  });

  // Leave project rooms
  socket.on('leave_project', (projectId) => {
    socket.leave(`project_${projectId}`);
    console.log(`User ${socket.userId} left project ${projectId}`);
  });

  // Join chat channels
  socket.on('join_channel', (channelId) => {
    socket.join(`channel_${channelId}`);
    console.log(`User ${socket.userId} joined channel ${channelId}`);
  });

  // Leave chat channels
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel_${channelId}`);
    console.log(`User ${socket.userId} left channel ${channelId}`);
  });

  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      const { channelId, content, type = 'text', replyTo = null } = data;
      
      // Save message to database (implement in chat controller)
      const message = {
        id: require('uuid').v4(),
        channel_id: channelId,
        user_id: socket.userId,
        content,
        type,
        reply_to: replyTo,
        created_at: new Date()
      };

      // Broadcast to channel members
      io.to(`channel_${channelId}`).emit('new_message', message);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle task updates
  socket.on('task_update', (data) => {
    const { projectId, task } = data;
    socket.to(`project_${projectId}`).emit('task_updated', task);
  });

  // Handle kanban updates
  socket.on('kanban_update', (data) => {
    const { projectId, update } = data;
    socket.to(`project_${projectId}`).emit('kanban_updated', update);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
