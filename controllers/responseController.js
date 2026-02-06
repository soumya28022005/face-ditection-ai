/**
 * RESPONSE CONTROLLER - AI Response Generation
 * Generates empathetic, human-like responses based on emotion analysis
 */

const emotionController = require('./emotionController');

/**
 * Generate empathetic AI response
 * 
 * @param {string} userText - User's message
 * @param {Object} textEmotion - Detected text emotion
 * @param {Object} faceEmotion - Detected face emotion
 * @param {Object} emotionAnalysis - Result from compareEmotions
 * @returns {string} - AI response
 */
function generateResponse(userText, textEmotion, faceEmotion, emotionAnalysis) {
    // Get response strategy
    const strategy = emotionController.getResponseStrategy(emotionAnalysis);
    
    // Handle different scenarios
    if (emotionAnalysis.hidingFeelings) {
        return generateDismissiveResponse(userText, faceEmotion, textEmotion, strategy);
    }
    
    if (emotionAnalysis.concerningMismatch) {
        return generateMismatchResponse(userText, emotionAnalysis, strategy);
    }
    
    // Normal aligned response
    return generateAlignedResponse(userText, emotionAnalysis.primaryEmotion, strategy);
}

/**
 * Response when user is being dismissive ("I'm fine" but looks sad/angry)
 */
function generateDismissiveResponse(userText, faceEmotion, textEmotion, strategy) {
    if (!faceEmotion) {
        return generateAlignedResponse(userText, textEmotion.emotion, strategy);
    }
    
    const dismissiveResponses = {
        sad: [
            "I hear you saying you're okay, but I can't help but notice you seem a bit down. It's completely fine to not be fine, you know. Would you like to talk about what's really going on?",
            "You mentioned you're fine, but something in your expression tells me you might be carrying some sadness. I'm here if you want to share what's weighing on you. 💙",
            "I sense there might be more to how you're feeling than just 'fine.' Sometimes it's hard to open up, but I promise it's safe here. What's really on your mind?",
            "It's okay to admit when things aren't going well. I notice you might be feeling sadder than you're letting on. Want to talk about it?"
        ],
        angry: [
            "I can see you're keeping things calm with your words, but I sense some frustration underneath. It's healthy to express what's bothering you - I'm here to listen without judgment.",
            "You say you're fine, but I notice some tension. If something's making you angry or frustrated, it's totally valid to feel that way. What's going on?",
            "I hear 'fine,' but your expression suggests you might be more upset than that. Sometimes we try to keep it together, but it's okay to let it out. I'm listening.",
            "It seems like something might be frustrating you even though you're staying composed. Would you like to talk about what's really bothering you?"
        ],
        anxious: [
            "You're saying things are okay, but I sense some worry or nervousness. Anxiety can be tough to admit. What's making you feel uneasy?",
            "I notice you might be more worried than you're expressing. It's okay to feel anxious - want to share what's on your mind?",
            "Sometimes 'fine' really means 'I'm stressed but trying to keep it together.' I'm here if you need to talk about what's worrying you."
        ]
    };
    
    const responses = dismissiveResponses[faceEmotion.emotion] || dismissiveResponses.sad;
    return selectRandomResponse(responses);
}

/**
 * Response when there's a concerning emotion mismatch
 */
function generateMismatchResponse(userText, emotionAnalysis, strategy) {
    const insight = emotionController.getEmotionInsight(emotionAnalysis);
    
    if (!insight) {
        return generateAlignedResponse(userText, emotionAnalysis.primaryEmotion, strategy);
    }
    
    // Combine concern with suggestion
    const empathyPhrases = [
        "I want you to know",
        "I'm noticing that",
        "It seems to me that",
        "I can see that"
    ];
    
    const transitionPhrases = [
        "How are you really feeling right now?",
        "What's going on for you?",
        "Would you like to share what you're experiencing?",
        "Can you tell me more about what's happening?",
        "I'm here to listen - what's really on your mind?"
    ];
    
    const empathy = selectRandomResponse(empathyPhrases);
    const transition = selectRandomResponse(transitionPhrases);
    
    // High severity - more direct
    if (strategy.severity >= 7) {
        return `${empathy} ${insight.concern.toLowerCase()} ${insight.suggestion} ${transition}`;
    }
    
    // Medium severity - gentle
    return `${insight.concern} ${insight.suggestion} ${transition}`;
}

/**
 * Response when emotions are aligned (face matches text)
 */
function generateAlignedResponse(userText, emotion, strategy) {
    const responses = {
        happy: [
            "That's wonderful to hear! 😊 I'm so glad you're feeling happy. What's bringing you joy today?",
            "Your happiness is contagious! 🌟 I love hearing about the good things in your life. Tell me more!",
            "I'm really happy for you! It's great to see you in such good spirits. What's been going well?",
            "That's fantastic! Your positive energy really shows. What's making you smile today?",
            "Yay! It's so nice to see you happy. Keep that positive momentum going! What's contributing to this good mood?"
        ],
        sad: [
            "I'm really sorry you're feeling this way. 💙 Your feelings are completely valid. Would you like to talk about what's making you sad?",
            "Thank you for sharing that with me. It takes courage to be vulnerable. I'm here for you. What's been weighing on your heart?",
            "I can hear the sadness in your words, and I want you to know that it's okay to feel this way. What's going on that's making you feel down?",
            "Your feelings matter, and I'm here to listen without judgment. Sometimes just talking helps. What's troubling you?",
            "I'm sorry you're going through a difficult time. You don't have to face this alone. Want to share what's hurting?"
        ],
        angry: [
            "I can understand why you'd feel frustrated. Your anger is valid - something clearly isn't right. What happened that upset you?",
            "It sounds like something really got under your skin. It's healthy to acknowledge anger. What's making you feel this way?",
            "You have every right to feel angry when things aren't fair or right. I'm listening - what's frustrating you?",
            "I hear your frustration, and it's completely understandable. Sometimes we need to vent. What's triggering these feelings?",
            "Thank you for being honest about your anger. Let's talk through what's bothering you. What happened?"
        ],
        anxious: [
            "Anxiety can be really overwhelming. I'm sorry you're feeling this way. What's causing you to feel worried or stressed?",
            "It's okay to feel anxious - these feelings are valid and real. Would you like to talk about what's making you nervous?",
            "I understand that anxious feeling. Sometimes it helps to voice our worries. What's on your mind?",
            "Stress and worry can be so draining. You're not alone in this. What's been making you feel anxious?",
            "Thank you for sharing your anxiety with me. Let's work through this together. What are you most concerned about?"
        ],
        neutral: [
            "I'm here with you. How are things really going?",
            "Thanks for sharing. What's on your mind today?",
            "I'm listening. Is there anything specific you'd like to talk about?",
            "How can I support you today? What would be helpful to discuss?",
            "I hear you. Want to tell me more about what's happening?"
        ]
    };
    
    const emotionResponses = responses[emotion] || responses.neutral;
    return selectRandomResponse(emotionResponses);
}

/**
 * Generate follow-up questions based on emotion
 */
function generateFollowUpQuestion(emotion) {
    const followUps = {
        happy: [
            "What's the best part of your day so far?",
            "How long have you been feeling this way?",
            "Is there anything you want to celebrate?"
        ],
        sad: [
            "How long have you been feeling this way?",
            "Is there someone you can talk to about this?",
            "What would help you feel a little better right now?"
        ],
        angry: [
            "What triggered this feeling?",
            "Have you been able to express this to the person or situation involved?",
            "What would make you feel heard or validated?"
        ],
        anxious: [
            "What's the main thing worrying you?",
            "Have you tried anything to help with the anxiety?",
            "Is this a new feeling or has it been building up?"
        ],
        neutral: [
            "What's been on your mind lately?",
            "Is there anything you'd like to talk through?",
            "How has your week been?"
        ]
    };
    
    const questions = followUps[emotion] || followUps.neutral;
    return selectRandomResponse(questions);
}

/**
 * Helper: Select random response from array
 */
function selectRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Add validation and supportive closing
 */
function addSupportiveClosure(response, emotion) {
    const closures = [
        "I'm here for you. 💙",
        "You're not alone in this.",
        "Take your time - I'm listening.",
        "Your feelings are important.",
        "Thank you for trusting me with this."
    ];
    
    // For sad/angry/anxious, add supportive closure
    if (['sad', 'angry', 'anxious'].includes(emotion)) {
        return response + " " + selectRandomResponse(closures);
    }
    
    return response;
}

module.exports = {
    generateResponse,
    generateFollowUpQuestion,
    generateAlignedResponse,
    generateMismatchResponse,
    generateDismissiveResponse
};