/**
 * EMOTION.JS - Text Emotion Analysis
 * Analyzes emotional content in user's text using keyword matching and sentiment analysis
 */

class TextEmotionAnalyzer {
    constructor() {
        // Emotion keyword dictionaries
        this.emotionKeywords = {
            happy: {
                keywords: [
                    'happy', 'joy', 'joyful', 'excited', 'great', 'amazing', 'wonderful',
                    'fantastic', 'excellent', 'good', 'glad', 'pleased', 'delighted',
                    'cheerful', 'thrilled', 'love', 'loving', 'blessed', 'grateful',
                    'awesome', 'brilliant', 'perfect', 'beautiful', 'fun', 'enjoy',
                    'celebrating', 'laugh', 'smile', 'yay', 'haha', 'lol', '😊', '😄',
                    '😁', '🎉', '❤️', '💕', '✨'
                ],
                intensifiers: ['very', 'so', 'really', 'extremely', 'super', 'absolutely']
            },
            sad: {
                keywords: [
                    'sad', 'unhappy', 'depressed', 'down', 'upset', 'hurt', 'crying',
                    'tears', 'lonely', 'alone', 'miserable', 'devastated', 'heartbroken',
                    'blue', 'gloomy', 'disappointed', 'hopeless', 'despair', 'grief',
                    'sorrow', 'melancholy', 'sorry', 'regret', 'miss', 'lost', 'broken',
                    'empty', 'numb', 'pain', 'ache', '😢', '😭', '💔', '😞'
                ],
                intensifiers: ['very', 'so', 'really', 'extremely', 'deeply', 'totally']
            },
            angry: {
                keywords: [
                    'angry', 'mad', 'furious', 'rage', 'annoyed', 'frustrated', 'irritated',
                    'pissed', 'hate', 'hatred', 'disgusted', 'outraged', 'livid', 'fuming',
                    'bitter', 'resentful', 'hostile', 'violent', 'aggressive', 'fight',
                    'argue', 'stupid', 'idiot', 'damn', 'hell', 'awful', 'terrible',
                    'worst', '😠', '😡', '🤬', '💢'
                ],
                intensifiers: ['very', 'so', 'really', 'extremely', 'absolutely', 'totally']
            },
            anxious: {
                keywords: [
                    'anxious', 'worried', 'nervous', 'scared', 'afraid', 'fear', 'fearful',
                    'panic', 'stress', 'stressed', 'overwhelmed', 'tense', 'uneasy',
                    'concerned', 'troubled', 'distressed', 'frightened', 'terrified',
                    'insecure', 'uncertain', 'doubt', 'worry', '😰', '😨', '😟'
                ],
                intensifiers: ['very', 'so', 'really', 'extremely', 'totally']
            },
            neutral: {
                keywords: [
                    'okay', 'ok', 'fine', 'alright', 'normal', 'regular', 'usual',
                    'average', 'so-so', 'meh', 'whatever', 'sure', 'maybe'
                ],
                intensifiers: []
            }
        };
        
        // Common dismissive phrases (indicate hidden emotions)
        this.dismissivePhrases = [
            "i'm fine",
            "it's fine",
            "i'm ok",
            "i'm okay",
            "nothing's wrong",
            "don't worry",
            "it's nothing",
            "never mind",
            "forget it",
            "doesn't matter"
        ];
        
        // Negation words
        this.negationWords = ['not', 'no', 'never', 'neither', 'nobody', 'nothing', "don't", "doesn't", "didn't", "can't", "won't"];
    }
    
    /**
     * Analyze text and return detected emotion
     * @param {string} text - User's input text
     * @returns {Object} - { emotion: string, confidence: number, isDismissive: boolean }
     */
    analyze(text) {
        if (!text || text.trim().length === 0) {
            return { emotion: 'neutral', confidence: 0, isDismissive: false };
        }
        
        const lowerText = text.toLowerCase().trim();
        
        // Check for dismissive phrases
        const isDismissive = this.isDismissivePhrase(lowerText);
        
        // Calculate emotion scores
        const scores = this.calculateEmotionScores(lowerText);
        
        // Get dominant emotion
        const dominantEmotion = this.getDominantEmotion(scores);
        
        return {
            emotion: dominantEmotion.emotion,
            confidence: dominantEmotion.confidence,
            isDismissive: isDismissive,
            allScores: scores
        };
    }
    
    /**
     * Check if text contains dismissive phrases
     */
    isDismissivePhrase(text) {
        return this.dismissivePhrases.some(phrase => text.includes(phrase));
    }
    
    /**
     * Calculate scores for each emotion based on keyword matching
     */
    calculateEmotionScores(text) {
        const words = text.split(/\s+/);
        const scores = {
            happy: 0,
            sad: 0,
            angry: 0,
            anxious: 0,
            neutral: 0
        };
        
        // Track if negation is active
        let negationActive = false;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i].toLowerCase().replace(/[^\w]/g, '');
            
            // Check for negation
            if (this.negationWords.includes(word)) {
                negationActive = true;
                continue;
            }
            
            // Check each emotion
            for (const [emotion, data] of Object.entries(this.emotionKeywords)) {
                if (data.keywords.includes(word)) {
                    let score = 1;
                    
                    // Check for intensifiers in previous word
                    if (i > 0) {
                        const prevWord = words[i - 1].toLowerCase();
                        if (data.intensifiers.includes(prevWord)) {
                            score *= 1.5;
                        }
                    }
                    
                    // Apply negation (reverse the emotion)
                    if (negationActive) {
                        score *= -0.5;
                        negationActive = false;
                    }
                    
                    scores[emotion] += score;
                }
            }
            
            // Reset negation after 2 words
            if (i > 0 && this.negationWords.includes(words[i - 2])) {
                negationActive = false;
            }
        }
        
        // Normalize scores
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore > 0) {
            for (const emotion in scores) {
                scores[emotion] = Math.max(0, scores[emotion]); // Remove negative scores
            }
        }
        
        return scores;
    }
    
    /**
     * Get dominant emotion from scores
     */
    getDominantEmotion(scores) {
        let maxEmotion = 'neutral';
        let maxScore = 0;
        
        for (const [emotion, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                maxEmotion = emotion;
            }
        }
        
        // Calculate confidence (0-100)
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const confidence = totalScore > 0 
            ? Math.round((maxScore / totalScore) * 100)
            : 0;
        
        return {
            emotion: maxEmotion,
            confidence: Math.min(confidence, 100)
        };
    }
    
    /**
     * Compare face emotion with text emotion
     * Returns mismatch information
     */
    compareEmotions(faceEmotion, textEmotion) {
        // If no face emotion detected
        if (!faceEmotion) {
            return {
                match: true,
                mismatch: false,
                reason: null
            };
        }
        
        const face = faceEmotion.emotion;
        const text = textEmotion.emotion;
        
        // Direct match
        if (face === text) {
            return {
                match: true,
                mismatch: false,
                confidence: Math.min(faceEmotion.confidence, textEmotion.confidence)
            };
        }
        
        // Common mismatches (hiding true feelings)
        const commonMismatches = {
            // Saying "fine" but looking sad
            sad_neutral: textEmotion.isDismissive,
            sad_happy: textEmotion.isDismissive,
            
            // Saying "fine" but looking angry
            angry_neutral: textEmotion.isDismissive,
            angry_happy: textEmotion.isDismissive,
            
            // Other concerning patterns
            sad_angry: true,
            angry_sad: true
        };
        
        const mismatchKey = `${face}_${text}`;
        const isConcerningMismatch = commonMismatches[mismatchKey] || false;
        
        return {
            match: false,
            mismatch: true,
            concerningMismatch: isConcerningMismatch,
            faceEmotion: face,
            textEmotion: text,
            isDismissive: textEmotion.isDismissive,
            message: this.getMismatchMessage(face, text, textEmotion.isDismissive)
        };
    }
    
    /**
     * Get empathetic message for emotion mismatch
     */
    getMismatchMessage(faceEmotion, textEmotion, isDismissive) {
        if (isDismissive) {
            const messages = {
                sad: "I notice you're saying you're fine, but you seem a bit sad. It's okay to not be okay. Would you like to talk about what's bothering you?",
                angry: "I can see you might be feeling frustrated even though you say you're fine. Sometimes it helps to let it out. I'm here to listen.",
                anxious: "You mentioned you're okay, but I sense some worry in your expression. Want to share what's on your mind?"
            };
            return messages[faceEmotion] || "I'm here for you, and it's okay to share how you really feel.";
        }
        
        return `I notice your expression seems ${faceEmotion}, but your words sound ${textEmotion}. How are you really feeling?`;
    }
    
    /**
     * Get sentiment score (-1 to 1)
     * Negative = sad/angry, Positive = happy, Zero = neutral
     */
    getSentimentScore(text) {
        const analysis = this.analyze(text);
        const scores = analysis.allScores;
        
        const positive = scores.happy;
        const negative = scores.sad + scores.angry + scores.anxious;
        const total = positive + negative;
        
        if (total === 0) return 0;
        
        return (positive - negative) / total;
    }
}

// Export for use in other modules
window.TextEmotionAnalyzer = TextEmotionAnalyzer;