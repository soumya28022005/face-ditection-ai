/**
 * API.JS - API Routes
 * Handles all API endpoints for the emotion companion
 */

const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');
const responseController = require('../controllers/responseController');
const db = require('../config/database');

/**
 * POST /api/analyze
 * Analyze user message and generate AI response
 * 
 * Request body:
 * {
 *   userText: string,
 *   textEmotion: { emotion, confidence, isDismissive },
 *   faceEmotion: { emotion, confidence } | null,
 *   timestamp: string
 * }
 */
router.post('/analyze', async (req, res) => {
    try {
        const { userText, textEmotion, faceEmotion, timestamp } = req.body;
        
        console.log('📨 Received message:', { userText, textEmotion, faceEmotion });
        
        // Compare face and text emotions
        const emotionAnalysis = emotionController.compareEmotions(faceEmotion, textEmotion);
        
        // Generate empathetic AI response
        const aiResponse = responseController.generateResponse(
            userText,
            textEmotion,
            faceEmotion,
            emotionAnalysis
        );
        
        // Store in database
        const conversationId = await saveConversation({
            userText,
            aiResponse,
            textEmotion,
            faceEmotion,
            emotionAnalysis
        });
        
        // Update daily summary
        await updateDailySummary(textEmotion.emotion);
        
        res.json({
            success: true,
            aiResponse,
            emotionAnalysis,
            detectedEmotion: textEmotion.emotion,
            conversationId
        });
        
    } catch (error) {
        console.error('Error in /api/analyze:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze message',
            aiResponse: "I'm sorry, I'm having trouble processing that right now."
        });
    }
});

/**
 * GET /api/history
 * Get conversation history
 * Query params: limit (default 50)
 */
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        const history = await db.query(
            `SELECT c.*, e.face_emotion, e.text_emotion, e.confidence_face, e.confidence_text, e.mismatch
             FROM conversations c
             LEFT JOIN emotions e ON c.id = e.conversation_id
             ORDER BY c.created_at DESC
             LIMIT ?`,
            [limit]
        );
        
        res.json({
            success: true,
            history,
            count: history.length
        });
        
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch history'
        });
    }
});

/**
 * GET /api/summary
 * Get daily emotion summary
 * Query params: date (default today, format: YYYY-MM-DD)
 */
router.get('/summary', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        
        let summary = await db.queryOne(
            'SELECT * FROM emotion_summary WHERE date = ?',
            [date]
        );
        
        // If no summary for today, create one
        if (!summary) {
            await db.query(
                'INSERT INTO emotion_summary (date, happy_count, sad_count, angry_count, neutral_count) VALUES (?, 0, 0, 0, 0)',
                [date]
            );
            summary = {
                date,
                happy_count: 0,
                sad_count: 0,
                angry_count: 0,
                neutral_count: 0
            };
        }
        
        res.json({
            success: true,
            summary: {
                happy: summary.happy_count,
                sad: summary.sad_count,
                angry: summary.angry_count,
                neutral: summary.neutral_count,
                date: summary.date
            }
        });
        
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch summary'
        });
    }
});

/**
 * DELETE /api/history
 * Clear conversation history (optional endpoint)
 */
router.delete('/history', async (req, res) => {
    try {
        await db.query('DELETE FROM conversations');
        await db.query('DELETE FROM emotions');
        
        res.json({
            success: true,
            message: 'History cleared'
        });
        
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear history'
        });
    }
});

// ========== HELPER FUNCTIONS ==========

/**
 * Save conversation to database
 */
async function saveConversation(data) {
    const { userText, aiResponse, textEmotion, faceEmotion, emotionAnalysis } = data;
    
    // Insert conversation
    const result = await db.query(
        'INSERT INTO conversations (user_text, ai_response) VALUES (?, ?)',
        [userText, aiResponse]
    );
    
    const conversationId = result.insertId;
    
    // Insert emotion data
    await db.query(
        `INSERT INTO emotions (conversation_id, face_emotion, text_emotion, confidence_face, confidence_text, mismatch)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            conversationId,
            faceEmotion ? faceEmotion.emotion : null,
            textEmotion.emotion,
            faceEmotion ? faceEmotion.confidence : null,
            textEmotion.confidence,
            emotionAnalysis.mismatch || false
        ]
    );
    
    return conversationId;
}

/**
 * Update daily emotion summary
 */
async function updateDailySummary(emotion) {
    const today = new Date().toISOString().split('T')[0];
    
    // Map emotion to column name
    const emotionColumn = `${emotion}_count`;
    
    // Check if summary exists for today
    const existing = await db.queryOne(
        'SELECT id FROM emotion_summary WHERE date = ?',
        [today]
    );
    
    if (existing) {
        // Update existing
        await db.query(
            `UPDATE emotion_summary SET ${emotionColumn} = ${emotionColumn} + 1 WHERE date = ?`,
            [today]
        );
    } else {
        // Create new
        await db.query(
            `INSERT INTO emotion_summary (date, ${emotionColumn}) VALUES (?, 1)`,
            [today]
        );
    }
}

module.exports = router;