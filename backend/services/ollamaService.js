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
    
    const prompt = constructPrompt(surveyData, fullName);
    
    const response = await ollama.chat({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: 0.7,
        top_p: 0.95,
        num_predict: 1500
      }
    });

    const analysis = response.message.content;
    
    if (!analysis || analysis.trim().length === 0) {
      throw new Error('Empty analysis received from Ollama');
    }

    console.log('AI analysis completed successfully');
    
    const roadmap = parseRoadmap(analysis);
    
    return {
      success: true,
      analysis: analysis.trim(),
      roadmap: roadmap
    };
  } catch (error) {
    console.error('Ollama API Error:', error.message);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message,
      analysis: null,
      roadmap: null
    };
  }
};

const parseRoadmap = (analysisText) => {
  const roadmap = {
    phase1: [],
    phase2: [],
    phase3: []
  };
  
  const phase1Match = analysisText.match(/Phase 1[:\s-]*(.+?)(?=Phase 2|$)/is);
  const phase2Match = analysisText.match(/Phase 2[:\s-]*(.+?)(?=Phase 3|$)/is);
  const phase3Match = analysisText.match(/Phase 3[:\s-]*(.+?)(?=$)/is);
  
  if (phase1Match) {
    const items = phase1Match[1].match(/[-•]\s*(.+?)(?=\n|$)/g);
    if (items) roadmap.phase1 = items.map(item => item.replace(/^[-•]\s*/, '').trim());
  }
  
  if (phase2Match) {
    const items = phase2Match[1].match(/[-•]\s*(.+?)(?=\n|$)/g);
    if (items) roadmap.phase2 = items.map(item => item.replace(/^[-•]\s*/, '').trim());
  }
  
  if (phase3Match) {
    const items = phase3Match[1].match(/[-•]\s*(.+?)(?=\n|$)/g);
    if (items) roadmap.phase3 = items.map(item => item.replace(/^[-•]\s*/, '').trim());
  }
  
  return roadmap;
};

const constructPrompt = (surveyData, fullName = 'Student') => {
  const { primaryLanguage, javaExpertise, pythonExpertise, javaQuestions, pythonQuestions } = surveyData;
  
  const language = primaryLanguage;
  const currentLevel = primaryLanguage === 'java' ? (javaExpertise || 'not specified') : (pythonExpertise || 'not specified');

  let prompt = `Create a personalized learning roadmap for this student.

Student Profile:
Primary Language: ${language === 'java' ? 'Java' : 'Python'}
Self-Assessment Level: ${currentLevel}

`;

  let strengths = [];
  let weaknesses = [];

  if (primaryLanguage === 'java' && javaQuestions?.score) {
    const score = javaQuestions.score;
    
    if (score.easy >= 2) strengths.push('basic Java syntax and fundamentals');
    else weaknesses.push('basic Java syntax');
    
    if (score.medium >= 2) strengths.push('intermediate concepts like collections and OOP');
    else weaknesses.push('object-oriented programming concepts');
    
    if (score.hard >= 2) strengths.push('advanced Java features and algorithms');
    else weaknesses.push('advanced programming concepts');

    prompt += `Java Assessment Analysis:
Based on the assessment, the student shows understanding in: ${strengths.length > 0 ? strengths.join(', ') : 'foundational concepts'}
Areas that need improvement: ${weaknesses.length > 0 ? weaknesses.join(', ') : 'continue practicing'}

`;
  }

  if (primaryLanguage === 'python' && pythonQuestions?.score) {
    const score = pythonQuestions.score;
    
    if (score.easy >= 2) strengths.push('basic Python syntax and fundamentals');
    else weaknesses.push('basic Python syntax');
    
    if (score.medium >= 2) strengths.push('intermediate concepts like data structures');
    else weaknesses.push('data structures and algorithms');
    
    if (score.hard >= 2) strengths.push('advanced Python features');
    else weaknesses.push('advanced programming concepts');

    prompt += `Python Assessment Analysis:
Based on the assessment, the student shows understanding in: ${strengths.length > 0 ? strengths.join(', ') : 'foundational concepts'}
Areas that need improvement: ${weaknesses.length > 0 ? weaknesses.join(', ') : 'continue practicing'}

`;
  }

  prompt += `MANDATORY STRUCTURE: Your response MUST follow this EXACT format:

Hi ${fullName},

Welcome to SkillVerse!

[Write ONE paragraph about their current strengths - 2-3 sentences]

[Write ONE paragraph about what they will learn - 2-3 sentences]

Your Learning Roadmap:

Phase 1 - Foundation
- [Concept 1 to learn]
- [Concept 2 to learn]

Phase 2 - Building Skills
- [Concept 3 to learn]
- [Concept 4 to learn]

Phase 3 - Advanced Practice
- [Concept 5 to learn]
- [Concept 6 to learn]

CRITICAL REQUIREMENTS FOR ROADMAP:

1. PHASE 1 must include 2 concepts:
   - First concept: Something they already know (from strengths) to build confidence
   - Second concept: A new basic concept they need to learn

2. PHASE 2 must include 2 concepts:
   - Both should be intermediate concepts addressing their weaknesses
   - Build directly on Phase 1 concepts

3. PHASE 3 must include 2 concepts:
   - Advanced concepts that combine previous learning
   - Prepare them for real-world applications

4. Each phase item should be:
   - ONE clear concept or skill (not multiple things)
   - Specific and actionable (students know what to practice)
   - Progressive (each builds on previous)

CONCEPT SELECTION BASED ON ASSESSMENT:
${strengths.length > 0 ? `Student Strengths: ${strengths.join(', ')}` : ''}
${weaknesses.length > 0 ? `Student Weaknesses: ${weaknesses.join(', ')}` : ''}

For Phase 1, first item MUST be from their strengths to build confidence.
For Phase 2 and 3, focus on addressing their weaknesses progressively.

EXAMPLE FORMAT:

Hi ${fullName},

Welcome to SkillVerse!

You have a solid understanding of ${strengths.length > 0 ? strengths[0] : 'basic programming concepts'}. This foundation will help you tackle more complex topics. Your ability to work with these concepts shows you are ready to grow your skills.

We will guide you through a structured path from where you are now to more advanced topics. Each phase builds on the previous one, so you will learn step by step. By the end, you will have the skills to build real projects confidently.

Your Learning Roadmap:

Phase 1 - Foundation
- ${strengths.length > 0 ? strengths[0] : 'Basic syntax and variables'} (practice what you know)
- ${weaknesses.length > 0 ? weaknesses[0] : 'Control structures and loops'} (new skill)

Phase 2 - Building Skills
- ${weaknesses.length > 1 ? weaknesses[1] : 'Object-oriented programming basics'} (intermediate)
- Working with collections and data structures (intermediate)

Phase 3 - Advanced Practice
- ${weaknesses.length > 2 ? weaknesses[2] : 'Algorithm design and optimization'} (advanced)
- Building complete applications with multiple components (advanced)

WRITING STYLE:
- Write like talking to a friend, not a textbook
- Use simple, clear language
- NO markdown formatting (no **, no ##, no ###)
- Plain text only
- NEVER mention scores, percentages, or test results
- Focus on WHAT to learn, not how well they did on the test

WORDS TO AVOID:
❌ delve, beneficial, fundamental, frameworks, concepts, proficiency
❌ enhance, leverage, comprehensive, intricate, facilitate
❌ scored, points, percentage, assessment results

WORDS TO USE:
✓ learn, practice, understand, know, work on, build
✓ simple, clear, important, useful, practical
✓ improve, grow, develop, master

CRITICAL: The roadmap items will be used to generate mini projects, so each item must be:
- A specific programming concept
- Suitable for a single mini project
- Clear enough that AI can generate a project for it

Now create the analysis and roadmap for this ${currentLevel} level ${language} student:`;

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
