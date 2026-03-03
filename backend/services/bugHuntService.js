import { generateWithRetry } from './ollamaService.js';

/**
 * Utility to parse AI-generated JSON more robustly.
 * Handles unescaped newlines and common AI formatting quirks.
 */
const safeJsonParse = (str) => {
    try {
        // Clean up common AI markdown junk first
        const cleanStr = str.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanStr);
    } catch (e) {
        // Attempt to fix common AI JSON issues: unescaped newlines in strings
        try {
            let fixed = str.replace(/```json\n?|```/g, '').trim();
            // This regex locks onto key: "value" and escapes newlines in the value part
            fixed = fixed.replace(/:[\s]*"([\s\S]*?)"([\s]*[,}\]])/g, (match, p1, p2) => {
                const escaped = p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                return ': "' + escaped + '"' + p2;
            });
            return JSON.parse(fixed);
        } catch (e2) {
            console.error('[BugHunt] JSON Parsing failed even after fix attempt.');
            throw e; // Throw original error
        }
    }
};

/**
 * Service to generate "Bug Hunt" challenges.
 */
export const generateBugHuntChallenge = async (language, level = 'Beginner', attempt = 1) => {
    try {
        const prompt = `Create a "Bug Hunt" challenge for a student at ${level} level in ${language.toUpperCase()}.
A Bug Hunt challenge consists of a small piece of code that has exactly 2-3 intentional bugs.

IMPORTANT: 
- The code must be in "buggyCode" and "correctCode" fields.
- Use ONLY standard escaped newlines (\\n) for line breaks inside JSON strings. 
- Do NOT use actual line breaks inside the "buggyCode" or "correctCode" values.
- Escape all double quotes inside the code with a backslash (\\").

RESPONSE FORMAT (JSON ONLY):
{
  "title": "Short catchy title",
  "description": "What the code is supposed to do",
  "buggyCode": "The full code with bugs",
  "correctCode": "The full code after fixing bugs",
  "hints": ["Hint 1", "Hint 2"],
  "difficulty": "${level}",
  "language": "${language}"
}

Return ONLY the JSON.`;

        console.log(`[BugHunt] Generation attempt ${attempt}/3 for ${language}`);
        const response = await generateWithRetry(prompt, {
            temperature: 0.8 + (attempt * 0.05),
            num_predict: 1000
        });

        const content = response.message.content;

        // Find the JSON block
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1) {
            throw new Error('No JSON object found in AI response');
        }

        const jsonStr = content.substring(startIndex, endIndex + 1);
        const challenge = safeJsonParse(jsonStr);

        // EXTRA ROBUSTNESS: Ensure code fields are strings
        const ensureString = (val) => {
            if (val === null || val === undefined) return "";
            if (typeof val === 'string') return val;
            if (typeof val === 'object') {
                if (val.code) return String(val.code);
                if (val.text) return String(val.text);
                if (val.content) return String(val.content);
                return JSON.stringify(val, null, 2);
            }
            return String(val);
        };

        challenge.buggyCode = ensureString(challenge.buggyCode);
        challenge.correctCode = ensureString(challenge.correctCode);

        // Final check: if the code is too short, retry
        if (challenge.buggyCode.length < 20 && attempt < 3) {
            return await generateBugHuntChallenge(language, level, attempt + 1);
        }

        console.log(`[BugHunt] Generated: ${challenge.title} (Length: ${challenge.buggyCode.length})`);
        return challenge;
    } catch (error) {
        console.error(`[BugHunt] Attempt ${attempt} failed:`, error.message);
        if (attempt < 3) {
            return await generateBugHuntChallenge(language, level, attempt + 1);
        }
        throw error;
    }
};

/**
 * Validate a student's fix for a Bug Hunt challenge.
 */
export const validateBugHuntFix = async (challengeTitle, description, fixedCode, language) => {
    try {
        const prompt = `You are a strict code evaluator. A student is participating in a "Bug Hunt" game where they must fix bugs in a piece of code.

CHALLENGE: ${challengeTitle}
EXPECTED BEHAVIOR: ${description}
STUDENT'S FIXED CODE (${language}):
\`\`\`${language}
${fixedCode}
\`\`\`

YOUR TASK:
Determine if the student has successfully fixed the code so it works as intended without bugs.

RESPONSE FORMAT (JSON ONLY):
{
  "fixed": true/false,
  "feedback": "Short encouraging message if fixed, or a small hint if not (1 sentence)",
  "scoreMultiplier": 1.0 (if fixed, 0.0 otherwise)
}

Return ONLY the JSON.`;

        const response = await generateWithRetry(prompt, { temperature: 0.1 });
        const content = response.message.content;
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');
        const jsonStr = content.substring(startIndex, endIndex + 1);
        return safeJsonParse(jsonStr);
    } catch (error) {
        console.error('[BugHunt] Validation error:', error);
        return { fixed: false, feedback: "Evaluation circuit busy. Try patching again.", scoreMultiplier: 0 };
    }
};

/**
 * Generate a subtle hint for a Bug Hunt challenge without giving away the answer.
 */
export const generateSubtleHint = async (challengeTitle, description, buggyCode, currentCode, language) => {
    try {
        const prompt = `You are a cryptic but helpful coding mentor in a game called "Bug Hunt".
The student is trying to fix bugs in a piece of code, but they are stuck.

CHALLENGE: ${challengeTitle}
GOAL: ${description}
ORIGINAL BUGGY CODE:
\`\`\`${language}
${buggyCode}
\`\`\`

STUDENT'S CURRENT PROGRESS:
\`\`\`${language}
${currentCode}
\`\`\`

YOUR TASK:
Give a SUBTLE, MYSTERIOUS, and SLIGHTLY CRYPTIC hint that points them toward the mistake WITHOUT naming the line number or the exact fix. 
Focus on the logic or the "smell" of the code (e.g., "The loop seems to be running one step too far," or "A variable name feels misplaced").

RESPONSE FORMAT:
One short sentence only. No other text.

HINT:`;

        const response = await generateWithRetry(prompt, {
            temperature: 0.9,
            num_predict: 50
        });

        return response.message.content.trim();
    } catch (error) {
        console.error('[BugHunt] Hint generation error:', error);
        return "The bugs are clever, but your logic must be cleverer. Look deeper.";
    }
};
