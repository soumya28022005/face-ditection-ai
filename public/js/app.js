/**
 * APP.JS - Main Application Controller
 * Coordinates camera, emotion analysis, speech, and backend communication
 */

class EmotionCompanionApp {
    constructor() {
        // Initialize managers
        this.camera = null;
        this.emotionAnalyzer = null;
        this.speech = null;
        
        // DOM Elements
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.summaryGrid = document.getElementById('summaryGrid');
        
        // State
        this.conversationHistory = [];
        this.dailySummary = {
            happy: 0,
            sad: 0,
            neutral: 0,
            angry: 0
        };
        
        // Initialize
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Emotion Companion App...');
        
        // Wait for DOM and face-api to load
        await this.waitForDependencies();
        
        // Initialize components
        this.camera = new CameraManager();
        this.emotionAnalyzer = new TextEmotionAnalyzer();
        this.speech = new SpeechManager();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load conversation history from backend
        await this.loadHistory();
        
        // Load daily summary
        await this.loadDailySummary();
        
        console.log('✅ App initialized successfully!');
    }
    
    /**
     * Wait for dependencies to load
     */
    async waitForDependencies() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (typeof faceapi !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
        
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
    }
    
    /**
     * Send user message and get AI response
     */
    async sendMessage() {
        const userText = this.messageInput.value.trim();
        
        if (!userText) return;
        
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        this.addMessage('user', userText);
        
        // Analyze text emotion
        const textEmotion = this.emotionAnalyzer.analyze(userText);
        
        // Get current face emotion from camera (Now fixed!)
        const faceEmotion = this.camera.getCurrentEmotion();
        
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userText: userText,
                    textEmotion: textEmotion,
                    faceEmotion: faceEmotion,
                    timestamp: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage('ai', data.aiResponse);
                this.updateDailySummary(data.detectedEmotion || textEmotion.emotion);
                
                this.conversationHistory.push({
                    userText,
                    aiResponse: data.aiResponse,
                    textEmotion,
                    faceEmotion,
                    timestamp: new Date()
                });
            }, 1000 + Math.random() * 500);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('ai', "I'm sorry, I'm having trouble connecting right now. Please try again.");
        }
    }
    
    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarSVG = sender === 'ai' ? `
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
                <circle cx="14" cy="16" r="2" fill="currentColor"/>
                <circle cx="26" cy="16" r="2" fill="currentColor"/>
                <path d="M12 24 Q20 28 28 24" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
        ` : `
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
                <circle cx="20" cy="16" r="6" fill="currentColor"/>
                <path d="M8 32 Q12 26 20 26 Q28 26 32 32" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
        `;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatarSVG}</div>
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            const messages = this.chatMessages.querySelectorAll('.message');
            for (let i = 1; i < messages.length; i++) {
                messages[i].remove();
            }
            this.conversationHistory = [];
        }
    }
    
    updateDailySummary(emotion) {
        if (this.dailySummary.hasOwnProperty(emotion)) {
            this.dailySummary[emotion]++;
            this.renderDailySummary();
        }
    }
    
    renderDailySummary() {
        const emotionIcons = { happy: '😊', sad: '😢', neutral: '😐', angry: '😠' };
        const emotionNames = { happy: 'Happy', sad: 'Sad', neutral: 'Neutral', angry: 'Angry' };
        
        this.summaryGrid.innerHTML = '';
        for (const [emotion, count] of Object.entries(this.dailySummary)) {
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <div class="summary-emotion">${emotionIcons[emotion]} ${emotionNames[emotion]}</div>
                <div class="summary-count">${count} ${count === 1 ? 'time' : 'times'}</div>
            `;
            this.summaryGrid.appendChild(item);
        }
    }
    
    async loadHistory() {
        try {
            const response = await fetch('/api/history?limit=10');
            const data = await response.json();
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    async loadDailySummary() {
        try {
            const response = await fetch('/api/summary');
            const data = await response.json();
            if (data.summary) {
                this.dailySummary = {
                    happy: data.summary.happy || 0,
                    sad: data.summary.sad || 0,
                    neutral: data.summary.neutral || 0,
                    angry: data.summary.angry || 0
                };
                this.renderDailySummary();
            }
        } catch (error) {
            console.error('Error loading summary:', error);
            this.renderDailySummary();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new EmotionCompanionApp();
});