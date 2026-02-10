require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { Server } = require('socket.io');
const passport = require('passport');

const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const configureSocket = require('./config/socket');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const assetRoutes = require('./routes/assets');
const invitationRoutes = require('./routes/invitations');
const noteRoutes = require('./routes/notes');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const chatbotRoutes = require('./routes/chatbot');
const chatRoutes = require('./routes/chat');
const chatsRoutes = require('./routes/chats');
const quizzesRoutes = require('./routes/quizzes');
const workflowRoutes = require('./routes/workflow');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);

// Trust proxy for Render/load balancers
app.set('trust proxy', 1);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5500',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Configure Passport
configurePassport();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5500',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Passport
app.use(passport.initialize());

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/library', require('./routes/library'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/collaborators', require('./routes/collaborators'));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle SPA or specific routes - optional, but good for direct file access
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Configure Socket.io
configureSocket(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███████╗██╗███╗   ███╗██╗   ██╗███████╗██╗  ██╗        ║
║   ██╔════╝██║████╗ ████║██║   ██║██╔════╝╚██╗██╔╝        ║
║   ███████╗██║██╔████╔██║██║   ██║█████╗   ╚███╔╝         ║
║   ╚════██║██║██║╚██╔╝██║╚██╗ ██╔╝██╔══╝   ██╔██╗         ║
║   ███████║██║██║ ╚═╝ ██║ ╚████╔╝ ███████╗██╔╝ ██╗        ║
║   ╚══════╝╚═╝╚═╝     ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝        ║
║                                                           ║
║   Server running on port ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
