/**
 * SERVER.JS - Main Express Server
 * Emotion-Aware AI Companion Backend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const db = require('./server/config/database');

// API Routes
const apiRoutes = require('./server/routes/api');
app.use('/api', apiRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Initialize database tables
async function initializeDatabase() {
    try {
        console.log('🗄️  Initializing database...');
        
        // Create tables if they don't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_text TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS emotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                conversation_id INT,
                face_emotion VARCHAR(50),
                text_emotion VARCHAR(50),
                confidence_face INT,
                confidence_text INT,
                mismatch BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        `);
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS emotion_summary (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL UNIQUE,
                happy_count INT DEFAULT 0,
                sad_count INT DEFAULT 0,
                angry_count INT DEFAULT 0,
                neutral_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

// Start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Start listening
        app.listen(PORT, () => {
            console.log('🚀 ================================');
            console.log(`🤖 Emotion Companion Server Running`);
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log('🚀 ================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    db.end();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, closing server...');
    db.end();
    process.exit(0);
});

// Start the server
startServer();