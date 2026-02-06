/**
 * CAMERA.JS - Webcam & Face Emotion Detection
 * Uses face-api.js for real-time facial emotion recognition
 */

class CameraManager {
    constructor() {
        // DOM Elements
        this.videoElement = document.getElementById('videoElement');
        this.overlay = document.getElementById('overlay');
        this.startBtn = document.getElementById('startCameraBtn');
        this.stopBtn = document.getElementById('stopCameraBtn');
        this.statusIndicator = document.getElementById('cameraStatus');
        this.placeholder = document.getElementById('videoPlaceholder');
        this.emotionDisplay = document.getElementById('currentEmotion');
        this.emotionConfidence = document.getElementById('emotionConfidence');
        this.chartBars = document.getElementById('chartBars');
        
        // State
        this.stream = null;
        this.detectionInterval = null;
        this.modelsLoaded = false;
        this.isDetecting = false;
        this.currentEmotion = null;
        this.emotionHistory = []; 
        
        // Bind methods
        this.startCamera = this.startCamera.bind(this);
        this.stopCamera = this.stopCamera.bind(this);
        this.detectEmotions = this.detectEmotions.bind(this);
        
        // Initialize
        this.init();
    }
    
    async init() {
        console.log('🎥 Initializing Camera Manager...');
        
        // Event listeners
        this.startBtn.addEventListener('click', this.startCamera);
        this.stopBtn.addEventListener('click', this.stopCamera);
        
        // Load face-api models
        await this.loadModels();
    }
    
    /**
     * Load face-api.js models
     */
    async loadModels() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        try {
            console.log('📦 Loading face-api.js models...');
            
            // Path to your models folder
            const MODEL_URL = './models'; 

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
            
            this.modelsLoaded = true;
            console.log('✅ Models loaded successfully!');
            
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            
        } catch (error) {
            console.error('❌ Error loading models:', error);
            alert('Failed to load face detection models. Please ensure you are using a local server (e.g., Live Server).');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Start webcam
     */
    async startCamera() {
        if (!this.modelsLoaded) {
            alert('Face detection models are still loading. Please wait...');
            return;
        }
        
        try {
            console.log('📹 Starting camera...');
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            this.videoElement.srcObject = this.stream;
            
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => resolve();
            });
            
            // Ensure video plays before setting canvas
            await this.videoElement.play();
            
            this.overlay.width = this.videoElement.videoWidth;
            this.overlay.height = this.videoElement.videoHeight;
            
            this.placeholder.style.display = 'none';
            this.videoElement.style.display = 'block';
            this.overlay.style.display = 'block';
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.statusIndicator.classList.add('active');
            this.statusIndicator.querySelector('.status-text').textContent = 'Active';
            
            this.startDetection();
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    }
    
    stopCamera() {
        this.stopDetection();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.videoElement.srcObject = null;
        this.videoElement.style.display = 'none';
        this.overlay.style.display = 'none';
        this.placeholder.style.display = 'flex';
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.statusIndicator.classList.remove('active');
        this.statusIndicator.querySelector('.status-text').textContent = 'Inactive';
    }
    
    startDetection() {
        this.isDetecting = true;
        this.detectionInterval = setInterval(async () => {
            if (this.isDetecting) await this.detectEmotions();
        }, 500);
    }
    
    stopDetection() {
        this.isDetecting = false;
        if (this.detectionInterval) clearInterval(this.detectionInterval);
        const ctx = this.overlay.getContext('2d');
        ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    }
    
    async detectEmotions() {
        try {
            const detections = await faceapi
                .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();
            
            const ctx = this.overlay.getContext('2d');
            ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
            
            if (detections && detections.length > 0) {
                const detection = detections[0];
                this.drawFaceBox(ctx, detection.detection.box);
                
                const dominantEmotion = this.getDominantEmotion(detection.expressions);
                this.currentEmotion = {
                    emotion: dominantEmotion.emotion,
                    confidence: dominantEmotion.confidence,
                    timestamp: new Date()
                };
                
                this.updateEmotionDisplay(this.currentEmotion);
                this.addToHistory(this.currentEmotion);
                this.updateChart();
            } else {
                this.currentEmotion = null;
                this.emotionDisplay.textContent = 'No face detected';
                this.emotionConfidence.textContent = '0%';
            }
        } catch (error) {
            console.error('Detection error:', error);
        }
    }

    /**
     * Returns the current detected emotion for use in app.js
     */
    getCurrentEmotion() {
        return this.currentEmotion;
    }
    
    drawFaceBox(ctx, box) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
    
    getDominantEmotion(expressions) {
        const emotionMap = {
            'happy': 'happy', 'sad': 'sad', 'angry': 'angry',
            'neutral': 'neutral', 'surprised': 'neutral',
            'fearful': 'sad', 'disgusted': 'angry'
        };
        let maxEmotion = 'neutral';
        let maxValue = 0;
        for (const [emotion, value] of Object.entries(expressions)) {
            if (value > maxValue) {
                maxValue = value;
                maxEmotion = emotion;
            }
        }
        return {
            emotion: emotionMap[maxEmotion] || 'neutral',
            confidence: Math.round(maxValue * 100)
        };
    }
    
    updateEmotionDisplay(emotion) {
        const icons = { 'happy': '😊', 'sad': '😢', 'angry': '😠', 'neutral': '😐' };
        this.emotionDisplay.textContent = `${icons[emotion.emotion]} ${emotion.emotion.toUpperCase()}`;
        this.emotionConfidence.textContent = `${emotion.confidence}%`;
    }
    
    addToHistory(emotion) {
        this.emotionHistory.push(emotion);
        if (this.emotionHistory.length > 10) this.emotionHistory.shift();
    }
    
    updateChart() {
        this.chartBars.innerHTML = '';
        const recent = this.emotionHistory.slice(-5).reverse();
        recent.forEach((data) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            const icons = { 'happy': '😊', 'sad': '😢', 'angry': '😠', 'neutral': '😐' };
            bar.innerHTML = `
                <div class="chart-bar-label">${icons[data.emotion]} ${data.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div class="chart-bar-fill">
                    <div class="chart-bar-progress" style="width: ${data.confidence}%"></div>
                </div>
            `;
            this.chartBars.appendChild(bar);
        });
    }
}

window.CameraManager = CameraManager;