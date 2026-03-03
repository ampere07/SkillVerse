import { generateWithRetry } from './ollamaService.js';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';

console.log(`Activity Feedback Service using centralized Ollama service`);

export const generateActivityFeedback = async (activityDetails, submittedCode) => {
  try {
    console.log(`[Activity Feedback] Analyzing activity: ${activityDetails.title}`);
    console.log(`[Activity Feedback] Code length: ${submittedCode.length} characters`);
    console.log(`[Activity Feedback] Model: ${OLLAMA_CONFIG.model}`);

    const prompt = constructFeedbackPrompt(activityDetails, submittedCode);

    console.log('[Activity Feedback] Sending code analysis request to AI...');

    const response = await generateWithRetry(prompt, {
      temperature: 0.5,
      num_predict: 1500
    });

    console.log('[Activity Feedback] AI analysis completed');
    const feedbackText = response.message.content;
    console.log('[Activity Feedback] AI Response length:', feedbackText.length);

    const result = parseFeedbackResponse(feedbackText);

    console.log(`[Activity Feedback] Feedback generated successfully`);

    return result;
  } catch (error) {
    console.error('[Activity Feedback] Error occurred:', error.message);
    throw error;
  }
};

const constructFeedbackPrompt = (activityDetails, code) => {
  return `You are a supportive programming instructor providing feedback on a student's activity submission.

ACTIVITY DETAILS:
Title: ${activityDetails.title}
Description: ${activityDetails.description}

INSTRUCTIONS:
${activityDetails.instructions}

STUDENT'S SUBMITTED CODE:
${code}

YOUR TASK:
Provide encouraging, constructive feedback on the student's code. Focus on:
1. What they did well (be specific)
2. Areas where they can improve
3. Suggestions for learning and growth
4. Overall encouragement

RESPONSE FORMAT (plain text only, no markdown):

Feedback:

Great job on completing this activity! [one encouraging sentence]

What you did well:
- [specific strength #1 from their code]
- [specific strength #2 from their code]
- [specific strength #3 from their code]

Areas for improvement:
- [constructive suggestion #1]
- [constructive suggestion #2]
- [constructive suggestion #3]

Next steps:
[2-3 sentences with actionable advice for their continued learning]

IMPORTANT:
- Be encouraging and supportive - this is about learning, not grading
- Focus on specific aspects of their code
- Provide actionable suggestions
- Use clear, simple language
- No markdown formatting (no **, no ##, no ###)
- Plain text only

Provide your feedback now:`;
};

const parseFeedbackResponse = (text) => {
  try {
    console.log('[Activity Feedback] Parsing AI response...');

    const feedbackMatch = text.match(/Feedback:([\s\S]*)/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : text;

    const introMatch = feedback.match(/Great job[^!.]*[!.][^\n]*/i);
    const intro = introMatch ? introMatch[0].trim() : 'Great job on completing this activity!';

    const strengthsMatch = feedback.match(/What you did well:([\s\S]*?)(?=Areas for improvement:|Next steps:|$)/i);
    const strengths = strengthsMatch ? strengthsMatch[1].trim() : '- You successfully completed the activity\n- Your code demonstrates understanding of the concepts';

    const improvementsMatch = feedback.match(/Areas for improvement:([\s\S]*?)(?=Next steps:|$)/i);
    const improvements = improvementsMatch ? improvementsMatch[1].trim() : '- Continue practicing to enhance your skills\n- Explore more advanced concepts';

    const nextStepsMatch = feedback.match(/Next steps:([\s\S]*?)$/i);
    const nextSteps = nextStepsMatch ? nextStepsMatch[1].trim() : 'Keep practicing and exploring new programming concepts. You are making great progress!';

    const formattedFeedback = `${intro}\n\n**What You Did Well:**\n${strengths}\n\n**Areas for Improvement:**\n${improvements}\n\n**Next Steps:**\n${nextSteps}`;

    return {
      feedback: formattedFeedback,
      intro,
      strengths,
      improvements,
      nextSteps
    };
  } catch (error) {
    console.error('[Activity Feedback] Error parsing AI response:', error);
    console.error('[Activity Feedback] Response text:', text);

    return {
      feedback: 'Great work completing this activity! You demonstrated understanding of the concepts. Keep practicing and exploring new programming challenges to continue improving your skills.',
      intro: 'Great work completing this activity!',
      strengths: 'You successfully completed the activity',
      improvements: 'Continue practicing to enhance your skills',
      nextSteps: 'Keep learning and challenging yourself with new projects'
    };
  }
};
