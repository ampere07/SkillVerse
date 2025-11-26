import { Ollama } from 'ollama';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';

const MODEL_NAME = OLLAMA_CONFIG.model;
const OLLAMA_URL = OLLAMA_CONFIG.url;

const ollama = new Ollama({ host: OLLAMA_URL });

console.log('Ollama Service Initialized');
console.log('Model:', MODEL_NAME);
console.log('URL:', OLLAMA_URL);

export const validateLearningInputs = async (courseInterest, learningGoals) => {
  try {
    const prompt = `You are validating student responses. Accept ANY language including mixed English-Tagalog (Taglish), shortcuts, and slang.

Question 1: "What are you interested in learning?"
Answer: "${courseInterest}"

Question 2: "What do you want to achieve with programming?"
Answer: "${learningGoals}"

ACCEPT these as VALID:
- Any mix of English and Tagalog
- Shortcuts like "ng", "yung", "ano", "pag", "kasi", "dun"
- "I dont know", "wala pa", "di ko sure" - uncertainty is OK
- Any programming words: "web", "app", "coding", "games", etc.
- Typos and informal grammar

REJECT only if:
- Only curse words with no programming mention
- Random letters like "aaaaa" or "qwerty"
- Only non-tech topics like "basketball" or "cooking"

If VALID, respond: "VALID"
If INVALID, respond: "INVALID: " then explain what word or phrase you did not understand (max 8 words)

Be specific about what confused you. Examples:
- "INVALID: The word tangina is not about programming"
- "INVALID: Random letters aaaaa do not tell us anything"
- "INVALID: Basketball is not a programming topic"

Validate now:`;

    const response = await ollama.chat({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: 0.3,
        num_predict: 100
      }
    });

    const result = response.message.content.trim();
    const isValid = result.toUpperCase().includes('VALID') && !result.toUpperCase().includes('INVALID');
    
    let reason = result
      .replace(/^VALID\s*:?\s*/i, '')
      .replace(/^INVALID\s*:?\s*/i, '')
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/---/g, '')
      .replace(/^-+\s*/, '')
      .replace(/^=+\s*/, '')
      .replace(/Question\s*\d+:/gi, '')
      .replace(/Student Answer:/gi, '')
      .replace(/Validation:/gi, '')
      .replace(/Answer:/gi, '')
      .trim();

    return {
      valid: isValid,
      reason: reason || (isValid ? 'OK' : 'Please tell us about programming or say I dont know')
    };
  } catch (error) {
    console.error('Validation error:', error.message);
    throw new Error(`AI validation failed: ${error.message}`);
  }
};

export const analyzeStudentSkills = async (surveyData, fullName = 'Student') => {
  try {
    console.log('Starting AI analysis for student skills...');
    
    const uncertainPhrases = ['dont know', 'diko alam', 'di ko alam', 'wala pa', 'not sure', 'idk', 'dunno', 'hindi ko alam'];
    const isUncertain = uncertainPhrases.some(phrase => 
      surveyData.courseInterest.toLowerCase().includes(phrase) || 
      surveyData.learningGoals.toLowerCase().includes(phrase)
    );
    
    const prompt = constructPrompt(surveyData, fullName, isUncertain);
    
    const response = await ollama.chat({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: 0.7,
        top_p: 0.95,
        num_predict: 1000
      }
    });

    const analysis = response.message.content;
    
    if (!analysis || analysis.trim().length === 0) {
      throw new Error('Empty analysis received from Ollama');
    }

    console.log('AI analysis completed successfully');
    return {
      success: true,
      analysis: analysis.trim()
    };
  } catch (error) {
    console.error('Ollama API Error:', error.message);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
};

const constructPrompt = (surveyData, fullName = 'Student', isUncertain = false) => {
  const { primaryLanguage, courseInterest, learningGoals, javaExpertise, pythonExpertise, javaQuestions, pythonQuestions } = surveyData;
  
  const languages = primaryLanguage.join(' and ');
  const javaLevel = javaExpertise || 'not specified';
  const pythonLevel = pythonExpertise || 'not specified';

  let prompt = `Analyze this student's programming skills and provide personalized learning recommendations.

IMPORTANT: The student may have answered in very informal mixed languages (Taglish with shortcuts like "ng", "yung", "ano", "pag make"). Understand their intent even if grammar is casual or uses shortcuts. Provide your analysis in English.

Student Profile:
Languages: ${languages}
Interest: ${courseInterest}
Goals: ${learningGoals}
Java Level (Self-Assessment): ${javaLevel}
Python Level (Self-Assessment): ${pythonLevel}

`;

  if (isUncertain) {
    prompt += `NOTE: This student is UNSURE about what they want to learn (they said things like "I don't know" or "diko alam"). Do NOT say their interest is "awesome" or treat uncertainty as a valid interest. Instead, acknowledge that it's okay to be unsure and focus on helping them explore.

`;
  }

  if (javaQuestions?.score) {
    const score = javaQuestions.score;
    prompt += `Java Assessment Results:
- Overall Score: ${score.total}/10 (${score.percentage}%)
- Easy Questions: ${score.easy}/3 correct
- Medium Questions: ${score.medium}/4 correct
- Hard Questions: ${score.hard}/3 correct

`;
  }

  if (pythonQuestions?.score) {
    const score = pythonQuestions.score;
    prompt += `Python Assessment Results:
- Overall Score: ${score.total}/10 (${score.percentage}%)
- Easy Questions: ${score.easy}/3 correct
- Medium Questions: ${score.medium}/4 correct
- Hard Questions: ${score.hard}/3 correct

`;
  }

  prompt += `MANDATORY REQUIREMENT: Your message MUST start with exactly:
"Hi ${fullName},

Welcome to SkillVerse!"

This greeting is required as the very first lines. After the greeting, continue with ONE SHORT PARAGRAPH.

Write a friendly, conversational message about their programming skills. Keep it to ONE paragraph only (3-5 sentences maximum).

FORMAT (must follow exactly):
1. FIRST: Start with "Hi ${fullName},\n\nWelcome to SkillVerse!"
2. Then write ONE paragraph covering:
   - Their current skill level in simple terms
   - What they want to learn
   - One thing they're doing well
   - One thing to focus on improving
   - Brief encouragement

CRITICAL RULES:
- Write like talking to a friend, not a formal report
- ONE paragraph only after the greeting (3-5 sentences)
- Use simple, everyday words
- NO markdown formatting (no **, no ##, no ###)
- Write in plain text only

WORDS YOU MUST NEVER USE:
❌ delve, beneficial, fundamental, frameworks, concepts, proficiency
❌ enhance, leverage, comprehensive, intricate, facilitate
❌ subsequent, endeavor, optimal, utilize, expertise
❌ competency, demonstrate, evaluate, implement, methodology

WORDS YOU SHOULD USE:
✓ learn, practice, good, need, know, understand, work on
✓ build, make, create, help, use, get better at
✓ basic, simple, important, great, awesome

Example format:
"Hi ${fullName},\n\nWelcome to SkillVerse! Based on your answers, you're at a beginner level in Java and want to learn Web Development. That's great! You know the basic syntax which is super important for building web apps. Keep practicing object-oriented programming to make better web systems. You're on the right track!"

Example for UNCERTAIN student:
"Hi ${fullName},\n\nWelcome to SkillVerse! No worries if you're still figuring out what you want to learn - that's completely normal! You're at a beginner level in Java right now. We'll help you explore different areas through fun projects, and you'll discover what interests you as you practice. Let's get started!"

Now write the analysis. REMEMBER: Start with "Hi ${fullName},\n\nWelcome to SkillVerse!" then ONE short paragraph:`;

  return prompt;
};

export const checkOllamaConnection = async () => {
  try {
    await ollama.list();
    return { connected: true, model: MODEL_NAME };
  } catch (error) {
    console.error('Ollama connection failed:', error.message);
    return { connected: false, error: error.message };
  }
};
