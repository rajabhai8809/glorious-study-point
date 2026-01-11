const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');

// Route files
const authRoutes = require('./routes/auth.routes');
const examRoutes = require('./routes/exam.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const noteRoutes = require('./routes/note.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' })); // Increased limit for profile images

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://placehold.co", "https://ui-avatars.com"],
            connectSrc: ["'self'", "http://localhost:5000", "https://cdn.jsdelivr.net"],
        },
    },
})); // Set security headers with custom CSP
app.use(cors()); // Enable CORS
app.use(xss()); // Prevent XSS attacks

// Logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Serve static files from the project root (../../ goes up from src -> backend -> root)
app.use(express.static(path.join(__dirname, '../../'), {
    maxAge: '0', // Disable cache for development so changes appear immediately
    etag: false
}));

module.exports = app;