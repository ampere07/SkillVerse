import { HfInference } from '@huggingface/inference';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_NAME = 'Qwen/Qwen2.5-Coder-7B-Instruct';

console.log('HuggingFace Service Initialized');
console.log('API Key present:', HUGGINGFACE_API_KEY ? 'Yes' : 'No');
console.log('API Key length:', HUGGINGFACE_API_KEY?.length || 0);

const hf = HUGGINGFACE_API_KEY ? new HfInference(HUGGINGFACE_API_KEY) : null;

export const validateLearningInputs = async (courseInterest, learningGoals) => {
  try {
    if (!HUGGINGFACE_API_KEY || !hf) {
      return { valid: true };
    }

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

    const response = await hf.chatCompletion({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.3
    });

    const result = response.choices[0].message.content.trim();
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
    return { valid: true };
  }
};

export const analyzeStudentSkills = async (surveyData, fullName = 'Student') => {
  try {
    if (!HUGGINGFACE_API_KEY) {
      console.error('HUGGINGFACE_API_KEY is undefined or empty');
      console.error('Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HF_KEY_EXISTS: !!process.env.HUGGINGFACE_API_KEY
      });
      throw new Error('Hugging Face API key is not configured');
    }

    if (!hf) {
      throw new Error('Hugging Face client not initialized');
    }

    console.log('Starting AI analysis for student skills...');
    const prompt = constructPrompt(surveyData, fullName);
    
    const response = await hf.chatCompletion({
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.95
    });

    const analysis = response.choices[0].message.content;
    
    if (!analysis || analysis.trim().length === 0) {
      throw new Error('Empty analysis received from API');
    }

    console.log('AI analysis completed successfully');
    return {
      success: true,
      analysis: analysis.trim()
    };
  } catch (error) {
    console.error('Hugging Face API Error:', error.message);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
};

const constructPrompt = (surveyData, fullName = 'Student') => {
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

This greeting is required as the very first lines. After the greeting, continue with the analysis.

Write a brief message to the student about their skill level. Talk to them like a friend, not like a teacher.

STRUCTURE (must follow exactly):
1. FIRST: Start with "Hi ${fullName},\n\nWelcome to SkillVerse!"
2. Then write about their skill level and what they want to learn
3. Mention 1-2 things they are good at
4. Mention 1-2 things they need to practice
5. End with "Keep practicing!" or similar encouragement

CRITICAL LANGUAGE RULES:
- Write like you are talking to a 12 year old
- Use words a middle school student knows
- If you would not say it in casual conversation, do not write it
- Maximum 100 words total
- DO NOT use any markdown formatting (no **, no ##, no ###)
- Write in plain text only

WORDS YOU MUST NEVER USE:
❌ delve, beneficial, fundamental, frameworks, concepts, proficiency
❌ enhance, leverage, comprehensive, intricate, facilitate
❌ subsequent, endeavor, optimal, utilize, expertise
❌ competency, demonstrate, evaluate, implement, methodology

WORDS YOU SHOULD USE:
✓ learn, practice, good, need, know, understand, work on
✓ build, make, create, help, use, get better at
✓ basic, simple, hard, easy, important

BAD EXAMPLES (too complex):
❌ "delve deeper into object-oriented programming concepts"
❌ "your Java skills will be beneficial as you explore"
❌ "fundamental for creating web applications"
❌ "enhance your proficiency in frameworks like Spring Boot"

GOOD EXAMPLES (simple):
✓ "learn more about object-oriented programming"
✓ "your Java skills will help you a lot"
✓ "important for making web apps"
✓ "practice using tools like Spring Boot"

Write ONLY about:
- Current skill level
- Their interests and goals
- What they know well
- What they need to practice

Do NOT write about:
- Next steps or what to do next
- Suggestions or recommendations
- Building projects
- Asking for help

Example format: "Hi ${fullName},\n\nWelcome to SkillVerse! Based on your assessment, you are at a beginner level in Java. You want to learn Web Development and are still finding out what you want to do, which is great. Your Java knowledge will help you. You know basic syntax well, which is important for making web apps. You need to work on object-oriented programming to build better web systems. Keep practicing!"

Now write the analysis. REMEMBER: Start with "Hi ${fullName},\n\nWelcome to SkillVerse!" and use SIMPLE, EASY English:`;

  return prompt;
};
