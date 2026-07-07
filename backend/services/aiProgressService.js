import { generateWithRetry } from './ollamaService.js';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import Survey from '../models/Survey.js';

console.log(`AI Progress Service using shared AI service`);
console.log(`Model: ${OLLAMA_CONFIG.model}`);

/**
 * Generate AI-powered progress insights for a student
 */
export const generateProgressInsights = async (userId, classroomId) => {
  try {
    // Get user's progress data
    const progress = await Progress.findOne({ student: userId, classroom: classroomId })
      .populate('student', 'name email')
      .populate('classroom', 'name code');

    if (!progress) {
      throw new Error(`No progress found for user ${userId} in classroom ${classroomId}`);
    }

    // Get user's survey data for learning roadmap
    const user = await User.findById(userId);
    const survey = await Survey.findOne({ userId }).sort({ createdAt: -1 });

    // Prepare data for AI analysis
    const progressData = prepareProgressData(progress, survey);

    // Generate AI insights
    const insights = await generateAIInsights(progressData);

    // Update progress with AI insights
    progress.aiInsights = {
      ...insights,
      generatedAt: new Date(),
      dataVersion: progressData.version
    };
    await progress.save();

    return insights;
  } catch (error) {
    console.error('[GenerateProgressInsights] Error:', error);
    throw error;
  }
};

/**
 * Generate personalized learning recommendations
 */
export const generateLearningRecommendations = async (userId, classroomId) => {
  try {
    const progress = await Progress.findOne({ student: userId, classroom: classroomId });
    const survey = await Survey.findOne({ userId }).sort({ createdAt: -1 });

    if (!progress || !survey) {
      throw new Error('Missing progress or survey data');
    }

    const progressData = prepareProgressData(progress, survey);
    const recommendations = await generateAIRecommendations(progressData);

    // Update progress with recommendations
    progress.aiRecommendations = {
      items: recommendations,
      generatedAt: new Date(),
      applied: []
    };
    await progress.save();

    return recommendations;
  } catch (error) {
    console.error('[GenerateLearningRecommendations] Error:', error);
    throw error;
  }
};

/**
 * Analyze skill gaps and generate targeted practice suggestions
 */
export const analyzeSkillGaps = async (userId, classroomId) => {
  try {
    const progress = await Progress.findOne({ student: userId, classroom: classroomId });
    const survey = await Survey.findOne({ userId }).sort({ createdAt: -1 });

    if (!progress || !survey) {
      throw new Error('Missing progress or survey data');
    }

    const progressData = prepareProgressData(progress, survey);
    const skillAnalysis = await generateAISkillGapAnalysis(progressData);

    // Update progress with skill gap analysis
    progress.skillGapAnalysis = {
      ...skillAnalysis,
      analyzedAt: new Date()
    };
    await progress.save();

    return skillAnalysis;
  } catch (error) {
    console.error('[AnalyzeSkillGaps] Error:', error);
    throw error;
  }
};

/**
 * Prepare progress data for AI analysis
 */
const prepareProgressData = (progress, survey) => {
  const data = {
    // Basic info
    studentName: progress.student?.name || 'Student',
    classroomName: progress.classroom?.name || 'Class',
    currentLevel: calculateLevel(progress.totalXp || 0),
    totalXp: progress.totalXp || 0,

    // Skills data
    skills: {
      java: {
        exercises: progress.skills.java.exercisesCompleted,
        projects: progress.skills.java.projectsCompleted,
        averageScore: progress.skills.java.averageScore,
        concepts: progress.skills.java.concepts.map(c => ({
          name: c.name,
          mastered: c.mastered,
          practiceCount: c.practiceCount
        }))
      },
      python: {
        exercises: progress.skills.python.exercisesCompleted,
        projects: progress.skills.python.projectsCompleted,
        averageScore: progress.skills.python.averageScore,
        concepts: progress.skills.python.concepts.map(c => ({
          name: c.name,
          mastered: c.mastered,
          practiceCount: c.practiceCount
        }))
      }
    },

    // Activity data
    activities: {
      codeExecutions: {
        total: progress.activities.codeExecutions.total,
        java: progress.activities.codeExecutions.java,
        python: progress.activities.codeExecutions.python
      },
      assignments: {
        submitted: progress.activities.assignments.totalSubmitted,
        onTime: progress.activities.assignments.onTime,
        averageScore: progress.activities.assignments.averageScore
      },
      miniProjects: {
        completed: progress.activities.miniProjects.completed,
        averageScore: progress.activities.miniProjects.averageScore
      },
      bugHunt: {
        participated: progress.activities.bugHunt.participated,
        bugsFound: progress.activities.bugHunt.bugsFound
      }
    },

    // Streaks and time
    streaks: {
      current: progress.streaks.currentStreak,
      longest: progress.streaks.longestStreak,
      totalDays: progress.streaks.totalActiveDays
    },
    timeSpent: {
      totalMinutes: progress.timeSpent.totalMinutes,
      thisWeek: progress.timeSpent.thisWeek,
      averagePerDay: progress.timeSpent.averagePerDay
    },

    // Job readiness metrics
    jobReadiness: progress.jobReadiness,

    // AI interactions
    aiInteractions: progress.aiInteractions,

    // Survey/roadmap data if available
    learningRoadmap: survey?.learningRoadmap || null,
    expertise: {
      java: survey?.javaExpertise,
      python: survey?.pythonExpertise
    },

    // Version for tracking updates
    version: Date.now()
  };

  return data;
};

/**
 * Generate AI insights based on progress data
 */
const generateAIInsights = async (progressData) => {
  const prompt = constructInsightsPrompt(progressData);

  const response = await generateWithRetry(prompt, {
    temperature: 0.7,
    num_predict: 1200,
    num_ctx: 4096,
    num_thread: 8
  });

  return parseInsightsResponse(response.message.content);
};

/**
 * Generate AI recommendations
 */
const generateAIRecommendations = async (progressData) => {
  const prompt = constructRecommendationsPrompt(progressData);

  const response = await generateWithRetry(prompt, {
    temperature: 0.8,
    num_predict: 1500,
    num_ctx: 4096,
    num_thread: 8
  });

  return parseRecommendationsResponse(response.message.content);
};

/**
 * Generate AI skill gap analysis
 */
const generateAISkillGapAnalysis = async (progressData) => {
  const prompt = constructSkillGapPrompt(progressData);

  const response = await generateWithRetry(prompt, {
    temperature: 0.6,
    num_predict: 1000,
    num_ctx: 4096,
    num_thread: 8
  });

  return parseSkillGapResponse(response.message.content);
};

/**
 * Construct prompt for AI insights
 */
const constructInsightsPrompt = (data) => {
  return `Analyze this student's programming learning progress and provide personalized insights.

STUDENT DATA:
Name: ${data.studentName}
Level: ${data.currentLevel}
Total XP: ${data.totalXp}
Current Streak: ${data.streaks.current} days

LANGUAGE SKILLS:
Java:
- Exercises: ${data.skills.java.exercises}
- Projects: ${data.skills.java.projects}
- Average Score: ${data.skills.java.averageScore}%
- Concepts: ${data.skills.java.concepts.length} total, ${data.skills.java.concepts.filter(c => c.mastered).length} mastered

Python:
- Exercises: ${data.skills.python.exercises}
- Projects: ${data.skills.python.projects}
- Average Score: ${data.skills.python.averageScore}%
- Concepts: ${data.skills.python.concepts.length} total, ${data.skills.python.concepts.filter(c => c.mastered).length} mastered}

ACTIVITY SUMMARY:
- Code Executions: ${data.activities.codeExecutions.total} (Java: ${data.activities.codeExecutions.java}, Python: ${data.activities.codeExecutions.python})
- Assignments: ${data.activities.assignments.submitted} submitted, ${data.activities.assignments.onTime} on time
- Mini Projects: ${data.activities.miniProjects.completed} completed
- Bug Hunt: ${data.activities.bugHunt.participated} participated, ${data.activities.bugHunt.bugsFound} bugs found

JOB READINESS SCORES:
- Overall: ${data.jobReadiness.overallScore}%
- Problem Solving: ${data.jobReadiness.problemSolving}%
- Code Quality: ${data.jobReadiness.codeQuality}%
- Efficiency: ${data.jobReadiness.efficiency}%
- Collaboration: ${data.jobReadiness.collaboration}%
- Consistency: ${data.jobReadiness.consistency}%

AI USAGE:
- Hints Requested: ${data.aiInteractions.hintsRequested}
- Feedback Received: ${data.aiInteractions.feedbackReceived}

${data.learningRoadmap ? `
LEARNING ROADMAP:
Phase 1: ${data.learningRoadmap.phase1.join(', ')}
Phase 2: ${data.learningRoadmap.phase2.join(', ')}
Phase 3: ${data.learningRoadmap.phase3.join(', ')}
` : ''}

TASK:
Provide 4-5 concise, actionable insights about this student's learning journey. Focus on:
1. Strengths and achievements
2. Areas needing improvement
3. Learning patterns and habits
4. Progress velocity and consistency
5. Recommendations for next steps

FORMAT:
INSIGHT 1: [Your insight here]
INSIGHT 2: [Your insight here]
INSIGHT 3: [Your insight here]
INSIGHT 4: [Your insight here]
INSIGHT 5: [Your insight here]

Keep insights encouraging but honest. Be specific about their actual performance.`;
};

/**
 * Construct prompt for recommendations
 */
const constructRecommendationsPrompt = (data) => {
  return `Generate personalized learning recommendations for this student.

STUDENT PROFILE:
${constructInsightsPrompt(data).split('TASK:')[0]}

TASK:
Generate 5 specific, actionable recommendations to help this student improve. Each recommendation should:
1. Address a specific weakness or opportunity
2. Be concrete and implementable
3. Include estimated time/difficulty
4. Suggest specific activities or projects

FORMAT:
RECOMMENDATION 1:
Title: [Brief title]
Description: [What to do and why]
Difficulty: [Beginner|Intermediate|Advanced]
Time: [e.g., 2-3 hours]
Type: [Exercise|Project|Practice|Review]

RECOMMENDATION 2:
[Same format]

Generate exactly 5 recommendations tailored to this student's current level and needs.`;
};

/**
 * Construct prompt for skill gap analysis
 */
const constructSkillGapPrompt = (data) => {
  return `Analyze skill gaps for this programming student.

${constructInsightsPrompt(data).split('TASK:')[0]}

TASK:
Identify and analyze skill gaps in Java and Python. For each language:
1. List missing or weak concepts
2. Priority level (High/Medium/Low)
3. Practice suggestions
4. Estimated mastery time

FORMAT:
JAVA GAPS:
Gap 1: [Concept name] - Priority: [High/Medium/Low] - Practice: [Suggestion] - Time: [Estimate]
Gap 2: [Concept name] - Priority: [High/Medium/Low] - Practice: [Suggestion] - Time: [Estimate]

PYTHON GAPS:
Gap 1: [Concept name] - Priority: [High/Medium/Low] - Practice: [Suggestion] - Time: [Estimate]
Gap 2: [Concept name] - Priority: [High/Medium/Low] - Practice: [Suggestion] - Time: [Estimate]

Focus on foundational gaps that would most impact their learning progress.`;
};

/**
 * Parse AI insights response
 */
const parseInsightsResponse = (text) => {
  const insights = [];
  const matches = text.match(/INSIGHT\s+\d+:\s*([\s\S]*?)(?=INSIGHT\s+\d+:|$)/gi);

  if (matches) {
    matches.forEach(match => {
      const insight = match.replace(/INSIGHT\s+\d+:\s*/i, '').trim();
      if (insight) {
        insights.push(insight);
      }
    });
  }

  return {
    insights: insights.slice(0, 5), // Limit to 5 insights
    generatedAt: new Date()
  };
};

/**
 * Parse AI recommendations response
 */
const parseRecommendationsResponse = (text) => {
  const recommendations = [];
  const recBlocks = text.split(/RECOMMENDATION\s+\d+:/i).filter(block => block.trim());

  recBlocks.forEach(block => {
    const rec = {
      title: '',
      description: '',
      difficulty: 'Beginner',
      time: '',
      type: 'Exercise'
    };

    const titleMatch = block.match(/Title:\s*(.+?)(?=\n|$)/i);
    if (titleMatch) rec.title = titleMatch[1].trim();

    const descMatch = block.match(/Description:\s*([\s\S]*?)(?=\nDifficulty:|$)/i);
    if (descMatch) rec.description = descMatch[1].trim();

    const diffMatch = block.match(/Difficulty:\s*(.+?)(?=\n|$)/i);
    if (diffMatch) rec.difficulty = diffMatch[1].trim();

    const timeMatch = block.match(/Time:\s*(.+?)(?=\n|$)/i);
    if (timeMatch) rec.time = timeMatch[1].trim();

    const typeMatch = block.match(/Type:\s*(.+?)(?=\n|$)/i);
    if (typeMatch) rec.type = typeMatch[1].trim();

    if (rec.title && rec.description) {
      recommendations.push(rec);
    }
  });

  return recommendations.slice(0, 5); // Limit to 5 recommendations
};

/**
 * Parse AI skill gap response
 */
const parseSkillGapResponse = (text) => {
  const analysis = {
    java: [],
    python: []
  };

  // Parse Java gaps
  const javaSection = text.match(/JAVA GAPS:\s*([\s\S]*?)(?=PYTHON GAPS:|$)/i);
  if (javaSection) {
    const javaGaps = javaSection[1].match(/Gap\s+\d+:\s*([^-\n]+)\s*-\s*Priority:\s*([^-\n]+)\s*-\s*Practice:\s*([^-\n]+)\s*-\s*Time:\s*([^\n]+)/gi);
    if (javaGaps) {
      javaGaps.forEach(gap => {
        const parts = gap.split(/\s*-\s*Priority:\s*|\s*-\s*Practice:\s*|\s*-\s*Time:\s*/);
        if (parts.length >= 4) {
          analysis.java.push({
            concept: parts[0].replace(/Gap\s+\d+:\s*/i, '').trim(),
            priority: parts[1].trim(),
            practice: parts[2].trim(),
            time: parts[3].trim()
          });
        }
      });
    }
  }

  // Parse Python gaps
  const pythonSection = text.match(/PYTHON GAPS:\s*([\s\S]*?)(?=$)/i);
  if (pythonSection) {
    const pythonGaps = pythonSection[1].match(/Gap\s+\d+:\s*([^-\n]+)\s*-\s*Priority:\s*([^-\n]+)\s*-\s*Practice:\s*([^-\n]+)\s*-\s*Time:\s*([^\n]+)/gi);
    if (pythonGaps) {
      pythonGaps.forEach(gap => {
        const parts = gap.split(/\s*-\s*Priority:\s*|\s*-\s*Practice:\s*|\s*-\s*Time:\s*/);
        if (parts.length >= 4) {
          analysis.python.push({
            concept: parts[0].replace(/Gap\s+\d+:\s*/i, '').trim(),
            priority: parts[1].trim(),
            practice: parts[2].trim(),
            time: parts[3].trim()
          });
        }
      });
    }
  }

  return analysis;
};

/**
 * Calculate level from XP
 */
const calculateLevel = (xp) => {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 1750) return 5;
  if (xp < 3000) return 6;
  if (xp < 5000) return 7;
  if (xp < 7500) return 8;
  if (xp < 10500) return 9;
  if (xp < 14000) return 10;
  if (xp < 18000) return 11;
  if (xp < 22500) return 12;
  return 13;
};
