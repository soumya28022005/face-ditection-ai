/**
 * SPEECH.JS - Voice Input using Web Speech API
 * Allows users to speak their feelings instead of typing
 */

class SpeechManager {
    constructor() {
        // Check browser support
        this.recognition = null;
        this.isSupported = this.checkSupport();
        
        // DOM Elements
        this.voiceBtn = document.getElementById('voiceBtn');
        this.messageInput = document.getElementById('messageInput');
        
        // State
        this.isListening = false;
        this.interimTranscript = '';
        this.finalTranscript = '';
        
        // Initialize
        this.init();
    }
    
    /**
     * Check if browser supports Web Speech API
     */
    checkSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('⚠️ Web Speech API not supported in this browser');
            return false;
        }
        
        this.recognition = new SpeechRecognition();
        return true;
    }
    
    /**
     * Initialize speech recognition
     */
    init() {
        if (!this.isSupported) {
            // Hide voice button if not supported
            if (this.voiceBtn) {
                this.voiceBtn.style.display = 'none';
            }
            return;
        }
        
        // Configure speech recognition
        this.recognition.continuous = false; // Stop after one sentence
        this.recognition.interimResults = true; // Show interim results
        this.recognition.lang = 'en-US'; // Language
        this.recognition.maxAlternatives = 1;
        
        // Event listeners
        this.setupRecognitionEvents();
        
        // Button event
        this.voiceBtn.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });
        
        console.log('🎤 Speech recognition initialized');
    }
    
    /**
     * Setup recognition event handlers
     */
    setupRecognitionEvents() {
        // When recognition starts
        this.recognition.onstart = () => {
            console.log('🎤 Listening...');
            this.isListening = true;
            this.voiceBtn.classList.add('active');
            this.messageInput.placeholder = 'Listening...';
        };
        
        // When recognition ends
        this.recognition.onend = () => {
            console.log('🎤 Stopped listening');
            this.isListening = false;
            this.voiceBtn.classList.remove('active');
            this.messageInput.placeholder = 'Type how you\'re feeling...';
            
            // If we got final transcript, use it
            if (this.finalTranscript) {
                this.messageInput.value = this.finalTranscript;
                this.finalTranscript = '';
                
                // Auto-focus on input for editing
                this.messageInput.focus();
            }
        };
        
        // On result (speech recognized)
        this.recognition.onresult = (event) => {
            this.interimTranscript = '';
            this.finalTranscript = '';
            
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript + ' ';
                } else {
                    this.interimTranscript += transcript;
                }
            }
            
            // Show interim results in input
            this.messageInput.value = this.finalTranscript + this.interimTranscript;
        };
        
        // On error
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            this.isListening = false;
            this.voiceBtn.classList.remove('active');
            this.messageInput.placeholder = 'Type how you\'re feeling...';
            
            // Handle specific errors
            if (event.error === 'no-speech') {
                this.showError('No speech detected. Please try again.');
            } else if (event.error === 'audio-capture') {
                this.showError('Microphone not accessible. Please check permissions.');
            } else if (event.error === 'not-allowed') {
                this.showError('Microphone permission denied.');
            } else {
                this.showError('Speech recognition failed. Please try again.');
            }
        };
    }
    
    /**
     * Start listening for speech
     */
    startListening() {
        if (!this.isSupported) {
            this.showError('Speech recognition not supported in your browser.');
            return;
        }
        
        try {
            this.finalTranscript = '';
            this.interimTranscript = '';
            this.messageInput.value = '';
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.showError('Failed to start speech recognition.');
        }
    }
    
    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    /**
     * Show error message to user
     */
    showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f87171;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1000;
            animation: fadeInUp 0.3s ease;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }
    
    /**
     * Check if currently listening
     */
    isActive() {
        return this.isListening;
    }
}

// Export for use in app.js
window.SpeechManager = SpeechManager;