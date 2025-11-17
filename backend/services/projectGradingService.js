import { HfInference } from '@huggingface/inference';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_NAME = 'Qwen/Qwen2.5-Coder-7B-Instruct';

const hf = HUGGINGFACE_API_KEY ? new HfInference(HUGGINGFACE_API_KEY) : null;

export const gradeProject = async (projectDetails, submittedCode) => {
  try {
    if (!HUGGINGFACE_API_KEY || !hf) {
      console.error('[Grading] Hugging Face API key is not configured');
      throw new Error('Hugging Face API key is not configured');
    }

    console.log(`[Grading] Evaluating project: ${projectDetails.title}`);
    console.log(`[Grading] Code length: ${submittedCode.length} characters`);
    console.log(`[Grading] Language: ${projectDetails.language}`);
    console.log(`[Grading] Model: ${MODEL_NAME}`);
    
    const prompt = constructGradingPrompt(projectDetails, submittedCode);
    
    console.log('[Grading] Sending code analysis request to AI...');
    
    const response = await hf.chatCompletion({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    });

    console.log('[Grading] AI analysis completed');
    const gradingText = response.choices[0].message.content;
    console.log('[Grading] AI Response length:', gradingText.length);
    console.log('[Grading] AI Response preview:', gradingText.substring(0, 200) + '...');
    
    const result = parseGradingResponse(gradingText);

    console.log(`[Grading] Final Score: ${result.score}/100`);
    console.log(`[Grading] Passed: ${result.passed}`);
    
    return result;
  } catch (error) {
    console.error('[Grading] Error occurred:', error.message);
    throw error;
  }
};


const constructGradingPrompt = (projectDetails, code) => {
  return `You are an expert programming instructor evaluating a student's project submission.

PROJECT DETAILS:
Title: ${projectDetails.title}
Language: ${projectDetails.language}

REQUIREMENTS:
${projectDetails.requirements}

STUDENT'S SUBMITTED CODE:
${code}

GRADING INSTRUCTIONS:
1. READ the code carefully
2. CHECK each requirement listed above
3. GRADE based ONLY on how well the code meets the requirements
4. Be fair and objective

GRADING CRITERIA (Total: 100 points):
- Requirements Met (70 points): Award points for each requirement completed
- Code Quality (20 points): Structure, readability, proper syntax
- Functionality (10 points): Does the code work correctly

RESPONSE FORMAT (plain text only, no markdown):

Score: [number]/100

Feedback:

Congratulations! [one sentence about their submission]

What you did well:
- [specific thing #1 from their code]
- [specific thing #2 from their code]
- [specific thing #3 from their code]

What needs improvement:
- [specific thing #1 based on requirements]
- [specific thing #2 based on requirements]
- [specific thing #3 based on requirements]

Status: ["You passed!" if score >= 70, "Keep practicing!" if score < 70]

IMPORTANT:
- Focus on the REQUIREMENTS listed above
- Be specific about what they did or did not implement
- Use clear, simple language
- No markdown formatting (no **, no ##, no ###)
- Plain text only

Analyze the code now:`;
};

const parseGradingResponse = (text) => {
  try {
    console.log('[Grading] Parsing AI response...');
    
    // Extract score
    const scoreMatch = text.match(/Score:\s*(\d+)\/100/i) || text.match(/Grade:\s*(\d+)\/100/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const passed = score >= 70;
    
    console.log(`[Grading] Extracted score: ${score}`);
    
    // Extract feedback section
    const feedbackMatch = text.match(/Feedback:([\s\S]*?)(?:$)/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : text;
    
    // Extract congratulations
    const congratsMatch = feedback.match(/(Congratulations[^!.]*[!.])/i);
    const congratsMessage = congratsMatch ? congratsMatch[0].trim() : 'Congratulations on completing your project!';
    
    // Extract strengths
    const strengthsMatch = feedback.match(/What you did well:([\s\S]*?)(?=What needs improvement:|Status:|$)/i);
    const strengths = strengthsMatch ? strengthsMatch[1].trim() : 'You completed the project successfully.';
    
    // Extract improvements
    const improvementsMatch = feedback.match(/What needs improvement:([\s\S]*?)(?=Status:|$)/i);
    const improvements = improvementsMatch ? improvementsMatch[1].trim() : 'Continue practicing to improve your skills.';
    
    // Clean feedback text
    const cleanFeedback = `${congratsMessage}\n\n${strengths}\n\n${improvements}\n\nGrade: ${score}/100 - ${passed ? 'You passed!' : 'Keep practicing!'}`;
    
    return {
      score,
      passed,
      feedback: cleanFeedback,
      congratsMessage,
      strengths,
      improvements
    };
  } catch (error) {
    console.error('[Grading] Error parsing AI response:', error);
    console.error('[Grading] Response text:', text);
    throw new Error('Failed to parse AI grading response');
  }
};
