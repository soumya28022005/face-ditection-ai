/**
 * EMOTION CONTROLLER - Emotion Analysis Logic
 * Compares face emotion vs text emotion and detects inconsistencies
 */

/**
 * Compare face emotion with text emotion
 * Detects when someone is hiding their true feelings
 * 
 * @param {Object} faceEmotion - { emotion, confidence }
 * @param {Object} textEmotion - { emotion, confidence, isDismissive }
 * @returns {Object} - Analysis result with mismatch detection
 */
function compareEmotions(faceEmotion, textEmotion) {
    // If no face emotion detected, rely on text
    if (!faceEmotion) {
        return {
            match: true,
            mismatch: false,
            primaryEmotion: textEmotion.emotion,
            confidence: textEmotion.confidence,
            note: 'Analysis based on text only (no face detected)'
        };
    }
    
    const face = faceEmotion.emotion;
    const text = textEmotion.emotion;
    
    // Perfect match - emotions align
    if (face === text) {
        return {
            match: true,
            mismatch: false,
            primaryEmotion: face,
            confidence: Math.min(faceEmotion.confidence, textEmotion.confidence),
            note: 'Emotions are aligned'
        };
    }
    
    // Detect concerning mismatches
    const concerningMismatches = {
        // User says they're fine/neutral but looks sad
        'sad-neutral': true,
        'sad-happy': true,
        
        // User says they're fine but looks angry
        'angry-neutral': true,
        'angry-happy': true,
        
        // Other emotional conflicts
        'sad-angry': true,
        'angry-sad': true
    };
    
    const mismatchKey = `${face}-${text}`;
    const isConcerning = concerningMismatches[mismatchKey] || false;
    
    // Check if user is being dismissive (saying "I'm fine" type phrases)
    const isHidingFeelings = textEmotion.isDismissive && (face === 'sad' || face === 'angry');
    
    return {
        match: false,
        mismatch: true,
        concerningMismatch: isConcerning,
        hidingFeelings: isHidingFeelings,
        faceEmotion: face,
        textEmotion: text,
        faceConfidence: faceEmotion.confidence,
        textConfidence: textEmotion.confidence,
        primaryEmotion: face, // Trust face more than words
        isDismissive: textEmotion.isDismissive,
        severity: calculateMismatchSeverity(face, text, faceEmotion.confidence)
    };
}

/**
 * Calculate how severe the emotion mismatch is
 * Higher severity = more concerning
 */
function calculateMismatchSeverity(faceEmotion, textEmotion, faceConfidence) {
    // Base severity scores
    const severityMatrix = {
        'sad-happy': 9,      // Very concerning - pretending to be happy
        'sad-neutral': 7,    // Concerning - hiding sadness
        'angry-happy': 9,    // Very concerning - pretending to be happy
        'angry-neutral': 7,  // Concerning - suppressing anger
        'sad-angry': 5,      // Mixed emotions
        'angry-sad': 5,      // Mixed emotions
        'neutral-sad': 3,    // Mild concern
        'neutral-angry': 3,  // Mild concern
        'happy-sad': 6,      // Unusual - needs attention
        'happy-angry': 6     // Unusual - needs attention
    };
    
    const key = `${faceEmotion}-${textEmotion}`;
    let severity = severityMatrix[key] || 2;
    
    // Increase severity if face detection is very confident
    if (faceConfidence > 80) {
        severity += 1;
    }
    
    return Math.min(severity, 10); // Cap at 10
}

/**
 * Get empathetic insight about the emotion state
 */
function getEmotionInsight(emotionAnalysis) {
    if (!emotionAnalysis.mismatch) {
        return null;
    }
    
    const { faceEmotion, textEmotion, hidingFeelings, severity } = emotionAnalysis;
    
    const insights = {
        'sad-neutral': {
            concern: "I sense you might be feeling sadder than you're letting on.",
            suggestion: "It's okay to acknowledge difficult feelings."
        },
        'sad-happy': {
            concern: "Your words sound positive, but I notice some sadness in your expression.",
            suggestion: "Sometimes it helps to be honest about how we really feel."
        },
        'angry-neutral': {
            concern: "I can see some frustration even though you're staying calm with your words.",
            suggestion: "It's healthy to express what's bothering you."
        },
        'angry-happy': {
            concern: "You're being positive with your words, but I sense some underlying frustration.",
            suggestion: "You don't have to hide your anger. I'm here to listen."
        },
        'sad-angry': {
            concern: "You seem to be experiencing mixed emotions - both sadness and frustration.",
            suggestion: "These complex feelings are valid and understandable."
        }
    };
    
    const key = `${faceEmotion}-${textEmotion}`;
    return insights[key] || {
        concern: `I notice your expression shows ${faceEmotion} while your words seem ${textEmotion}.`,
        suggestion: "How are you really feeling?"
    };
}

/**
 * Determine response strategy based on emotion analysis
 */
function getResponseStrategy(emotionAnalysis) {
    if (!emotionAnalysis.mismatch) {
        // Emotions match - respond normally to the emotion
        return {
            type: 'aligned',
            approach: 'supportive',
            priority: 'validate_emotion'
        };
    }
    
    // Mismatch detected
    if (emotionAnalysis.hidingFeelings) {
        return {
            type: 'dismissive_detected',
            approach: 'gentle_probing',
            priority: 'acknowledge_hidden_emotion',
            severity: emotionAnalysis.severity
        };
    }
    
    if (emotionAnalysis.concerningMismatch) {
        return {
            type: 'concerning_mismatch',
            approach: 'empathetic_confrontation',
            priority: 'express_concern',
            severity: emotionAnalysis.severity
        };
    }
    
    return {
        type: 'mild_mismatch',
        approach: 'curious_inquiry',
        priority: 'understand_better'
    };
}

module.exports = {
    compareEmotions,
    getEmotionInsight,
    getResponseStrategy,
    calculateMismatchSeverity
};