/**
 * EMOTION COMPARATOR UTILITY
 * Advanced emotion comparison and pattern detection
 */

/**
 * Emotion compatibility matrix
 * Defines how compatible different emotions are with each other
 * 0 = highly incompatible, 10 = perfectly compatible
 */
const EMOTION_COMPATIBILITY = {
    'happy-happy': 10,
    'sad-sad': 10,
    'angry-angry': 10,
    'neutral-neutral': 10,
    'anxious-anxious': 10,
    
    // Mild incompatibilities
    'happy-neutral': 6,
    'neutral-happy': 6,
    'sad-neutral': 5,
    'neutral-sad': 5,
    'angry-neutral': 4,
    'neutral-angry': 4,
    
    // Moderate incompatibilities
    'happy-anxious': 4,
    'anxious-happy': 4,
    'sad-anxious': 5,
    'anxious-sad': 5,
    
    // High incompatibilities (concerning)
    'happy-sad': 2,
    'sad-happy': 2,
    'happy-angry': 1,
    'angry-happy': 1,
    'sad-angry': 3,
    'angry-sad': 3,
    'angry-anxious': 4,
    'anxious-angry': 4
};

/**
 * Get compatibility score between two emotions
 */
function getCompatibilityScore(emotion1, emotion2) {
    const key = `${emotion1}-${emotion2}`;
    return EMOTION_COMPATIBILITY[key] || 5; // Default to moderate compatibility
}

/**
 * Detect emotional patterns over time
 * Useful for identifying trends in user's emotional state
 */
function detectEmotionalPattern(emotionHistory) {
    if (!emotionHistory || emotionHistory.length < 3) {
        return {
            pattern: 'insufficient_data',
            trend: null,
            concern: false
        };
    }
    
    // Count each emotion
    const counts = {
        happy: 0,
        sad: 0,
        angry: 0,
        neutral: 0,
        anxious: 0
    };
    
    emotionHistory.forEach(entry => {
        const emotion = entry.emotion || entry.text_emotion;
        if (counts.hasOwnProperty(emotion)) {
            counts[emotion]++;
        }
    });
    
    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxCount = 0;
    
    for (const [emotion, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            dominantEmotion = emotion;
        }
    }
    
    const totalEntries = emotionHistory.length;
    const dominancePercentage = (maxCount / totalEntries) * 100;
    
    // Detect concerning patterns
    const isConcerning = 
        (dominantEmotion === 'sad' && dominancePercentage > 60) ||
        (dominantEmotion === 'angry' && dominancePercentage > 50) ||
        (dominantEmotion === 'anxious' && dominancePercentage > 60);
    
    // Detect trend (improving/declining)
    const recentEmotions = emotionHistory.slice(-5);
    const olderEmotions = emotionHistory.slice(0, Math.min(5, emotionHistory.length - 5));
    
    const recentPositive = recentEmotions.filter(e => e.emotion === 'happy' || e.text_emotion === 'happy').length;
    const olderPositive = olderEmotions.filter(e => e.emotion === 'happy' || e.text_emotion === 'happy').length;
    
    let trend = 'stable';
    if (recentPositive > olderPositive + 1) trend = 'improving';
    if (recentPositive < olderPositive - 1) trend = 'declining';
    
    return {
        pattern: dominantEmotion,
        dominancePercentage: Math.round(dominancePercentage),
        trend,
        concern: isConcerning,
        emotionBreakdown: counts,
        totalEntries
    };
}

/**
 * Calculate emotional volatility
 * How much emotions are fluctuating
 */
function calculateEmotionalVolatility(emotionHistory) {
    if (!emotionHistory || emotionHistory.length < 2) {
        return {
            volatility: 0,
            stable: true
        };
    }
    
    let changes = 0;
    for (let i = 1; i < emotionHistory.length; i++) {
        const current = emotionHistory[i].emotion || emotionHistory[i].text_emotion;
        const previous = emotionHistory[i - 1].emotion || emotionHistory[i - 1].text_emotion;
        
        if (current !== previous) {
            changes++;
        }
    }
    
    const volatilityScore = (changes / (emotionHistory.length - 1)) * 100;
    
    return {
        volatility: Math.round(volatilityScore),
        stable: volatilityScore < 40,
        message: getVolatilityMessage(volatilityScore)
    };
}

/**
 * Get message about emotional volatility
 */
function getVolatilityMessage(volatilityScore) {
    if (volatilityScore < 30) {
        return "Your emotions have been quite stable.";
    } else if (volatilityScore < 60) {
        return "You're experiencing some emotional ups and downs.";
    } else {
        return "You're going through a lot of emotional changes.";
    }
}

/**
 * Suggest appropriate intervention based on patterns
 */
function suggestIntervention(emotionPattern, volatility) {
    const interventions = [];
    
    // High concern patterns
    if (emotionPattern.concern) {
        if (emotionPattern.pattern === 'sad' && emotionPattern.dominancePercentage > 70) {
            interventions.push({
                type: 'professional_help',
                priority: 'high',
                message: "I notice you've been feeling quite sad lately. It might help to talk to a counselor or therapist who can provide professional support."
            });
        }
        
        if (emotionPattern.pattern === 'angry' && emotionPattern.dominancePercentage > 60) {
            interventions.push({
                type: 'stress_management',
                priority: 'medium',
                message: "You've been experiencing a lot of frustration. Consider trying stress-relief techniques like deep breathing, exercise, or talking to someone you trust."
            });
        }
        
        if (emotionPattern.pattern === 'anxious' && emotionPattern.dominancePercentage > 70) {
            interventions.push({
                type: 'anxiety_support',
                priority: 'high',
                message: "Your anxiety levels seem elevated. Techniques like mindfulness, grounding exercises, or speaking with a mental health professional might help."
            });
        }
    }
    
    // High volatility
    if (volatility.volatility > 70) {
        interventions.push({
            type: 'emotional_regulation',
            priority: 'medium',
            message: "Your emotions seem to be changing rapidly. It might help to keep a journal or practice grounding techniques to find more emotional balance."
        });
    }
    
    // Declining trend
    if (emotionPattern.trend === 'declining') {
        interventions.push({
            type: 'check_in',
            priority: 'medium',
            message: "I've noticed things might not be going as well lately. Would you like to talk about what's changed or what's bothering you?"
        });
    }
    
    return interventions;
}

/**
 * Generate summary insight about emotional state
 */
function generateEmotionalInsight(emotionHistory) {
    if (!emotionHistory || emotionHistory.length === 0) {
        return "Not enough data to generate insights yet.";
    }
    
    const pattern = detectEmotionalPattern(emotionHistory);
    const volatility = calculateEmotionalVolatility(emotionHistory);
    
    const emotionLabels = {
        happy: 'happy and positive',
        sad: 'sad or down',
        angry: 'frustrated or angry',
        anxious: 'worried or anxious',
        neutral: 'relatively neutral'
    };
    
    let insight = `Looking at your recent emotional state, you've been mostly ${emotionLabels[pattern.pattern] || 'balanced'}. `;
    
    if (volatility.stable) {
        insight += "Your emotions have been fairly stable. ";
    } else {
        insight += `${volatility.message} `;
    }
    
    if (pattern.trend === 'improving') {
        insight += "On a positive note, things seem to be looking up recently! 🌟";
    } else if (pattern.trend === 'declining') {
        insight += "I've noticed things might be getting tougher lately. Remember, it's okay to ask for support.";
    }
    
    return insight;
}

module.exports = {
    getCompatibilityScore,
    detectEmotionalPattern,
    calculateEmotionalVolatility,
    suggestIntervention,
    generateEmotionalInsight
};