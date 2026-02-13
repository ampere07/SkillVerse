import { generateWithRetry } from './ollamaService.js';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';
import Survey from '../models/User.js';

console.log(`Project Generation Service using shared AI service`);
console.log(`Model: ${OLLAMA_CONFIG.model}`);

export const generateWeeklyProjects = async (userId) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user || !user.primaryLanguage) {
      throw new Error(`No user or primaryLanguage found for user ${userId}`);
    }

    const projects = await generateProjectsForLanguage(userId, user.primaryLanguage);

    if (!projects || projects.length === 0) {
      throw new Error('AI failed to generate projects');
    }

    return projects;
  } catch (error) {
    console.error('[GenerateWeeklyProjects] Error:', error);
    throw error;
  }
};

export const generateProjectsForBothLanguages = async (userId) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(`No user found for user ${userId}`);
    }

    console.log(`[ProjectGen] ========== GENERATING PROJECTS FOR BOTH LANGUAGES ==========`);
    console.log(`[ProjectGen] User ID: ${userId}`);

    console.log(`[ProjectGen] Calling generateProjectsForLanguage for JAVA...`);
    const javaProjects = await generateProjectsForLanguage(userId, 'java');
    console.log(`[ProjectGen] Java projects generated:`, javaProjects.length);
    if (javaProjects.length > 0) {
      console.log(`[ProjectGen] Sample Java project:`, { title: javaProjects[0].title, language: javaProjects[0].language });
    }

    console.log(`[ProjectGen] Calling generateProjectsForLanguage for PYTHON...`);
    const pythonProjects = await generateProjectsForLanguage(userId, 'python');
    console.log(`[ProjectGen] Python projects generated:`, pythonProjects.length);
    if (pythonProjects.length > 0) {
      console.log(`[ProjectGen] Sample Python project:`, { title: pythonProjects[0].title, language: pythonProjects[0].language });
    }

    const allProjects = [...javaProjects, ...pythonProjects];
    console.log(`[ProjectGen] Generated ${javaProjects.length} Java + ${pythonProjects.length} Python = ${allProjects.length} total projects`);
    console.log(`[ProjectGen] ================================================================`);

    return allProjects;
  } catch (error) {
    console.error('[GenerateProjectsForBothLanguages] Error:', error);
    throw error;
  }
};

export const generateProjectsForLanguage = async (userId, language) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(`No user found for user ${userId}`);
    }

    const Survey = (await import('../models/Survey.js')).default;
    const survey = await Survey.findOne({ userId, primaryLanguage: language }).sort({ createdAt: -1 });

    if (!survey) {
      throw new Error(`No survey found for user ${userId} and language ${language}`);
    }

    const hasLanguageData =
      (language.toLowerCase() === 'java' && survey.javaExpertise) ||
      (language.toLowerCase() === 'python' && survey.pythonExpertise);

    if (!hasLanguageData) {
      throw new Error(`Survey found but no ${language} data available`);
    }

    if (!survey.learningRoadmap || !survey.learningRoadmap.phase1 || survey.learningRoadmap.phase1.length < 3) {
      throw new Error(`Phase 1 must have at least 3 items for ${language}`);
    }

    const skillLevel = language.toLowerCase() === 'java'
      ? determineSkillLevel(survey.javaExpertise, null, survey.javaQuestions?.score, null)
      : determineSkillLevel(null, survey.pythonExpertise, null, survey.pythonQuestions?.score);

    console.log(`[ProjectGen] ========== GENERATING ROADMAP-BASED PROJECTS ==========`);
    console.log(`[ProjectGen] User ID: ${userId}`);
    console.log(`[ProjectGen] Language: ${language.toUpperCase()}`);
    console.log(`[ProjectGen] Skill Level: ${skillLevel}`);
    console.log(`[ProjectGen] Roadmap Phase 1: ${survey.learningRoadmap.phase1.join(', ')}`);
    console.log(`[ProjectGen] Roadmap Phase 2: ${survey.learningRoadmap.phase2.join(', ')}`);
    console.log(`[ProjectGen] Roadmap Phase 3: ${survey.learningRoadmap.phase3.join(', ')}`);
    console.log(`[ProjectGen] ===========================================`);

    const languageSpecificSurvey = {
      ...survey.toObject(),
      primaryLanguage: language
    };

    const prompt = constructRoadmapBasedPrompt(languageSpecificSurvey);

    console.log(`[ProjectGen] Prompt length: ${prompt.length} characters`);
    console.log(`[ProjectGen] Has AI Analysis: ${!!languageSpecificSurvey.aiAnalysis}`);
    if (languageSpecificSurvey.aiAnalysis) {
      console.log(`[ProjectGen] AI Analysis preview:`, languageSpecificSurvey.aiAnalysis.substring(0, 200));
    }

    console.log(`[ProjectGen] Calling AI API with retry logic...`);
    const startTime = Date.now();

    const response = await generateWithRetry(prompt, {
      temperature: 0.9,
      num_predict: 1500,
      num_ctx: 2048,
      num_thread: 10
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ProjectGen] AI Response received after ${duration} seconds`);

    const projectsText = response.message.content;
    console.log(`[ProjectGen] AI Response length: ${projectsText.length} characters`);
    console.log(`[ProjectGen] AI Response preview (first 500 chars):`, projectsText.substring(0, 500));

    const projects = parseProjectsFromAI(projectsText);
    console.log(`[ProjectGen] Parsed ${projects.length} projects from AI response`);

    if (projects.length > 0) {
      console.log(`[ProjectGen] First parsed project:`, JSON.stringify(projects[0], null, 2));
    }

    const correctedProjects = projects.map(project => ({
      ...project,
      language: language
    }));

    if (correctedProjects.length < 3) {
      throw new Error(`Only generated ${correctedProjects.length} projects, expected at least 3.`);
    }

    console.log(`[ProjectGen] Successfully generated ${correctedProjects.length} roadmap-based projects in ${duration}s`);
    console.log(`[ProjectGen] All projects set to language: ${language}`);
    return correctedProjects;
  } catch (error) {
    console.error('[GenerateProjectsForLanguage] Error:', error);
    throw error;
  }
};

const constructRoadmapBasedPrompt = (survey) => {
  const { primaryLanguage, learningRoadmap, javaExpertise, pythonExpertise, javaQuestions, pythonQuestions, aiAnalysis } = survey;

  const language = primaryLanguage
    ? primaryLanguage.charAt(0).toUpperCase() + primaryLanguage.slice(1)
    : 'Java';

  const skillLevel = determineSkillLevel(javaExpertise, pythonExpertise, javaQuestions?.score, pythonQuestions?.score);

  const phase1Items = learningRoadmap.phase1 || [];

  if (phase1Items.length < 3) {
    throw new Error(`Phase 1 must have at least 3 items, found ${phase1Items.length}`);
  }

  const aiAnalysisSection = aiAnalysis
    ? `\n\nAI ANALYSIS:\n${aiAnalysis}\n\nUse this to tailor difficulty, explanations, focus. Address strengths/weaknesses.`
    : '';

  return `Create 3 unique mini projects based on personalized roadmap.

LANGUAGE: ${language} ONLY
All projects MUST be ${language}. Do not mix languages.

LEARNING ROADMAP:

Phase 1 - Foundation:
${learningRoadmap.phase1.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Phase 2 - Building Skills:
${learningRoadmap.phase2.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Phase 3 - Advanced Practice:
${learningRoadmap.phase3.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Language: ${language}
Level: ${skillLevel}${aiAnalysisSection}

GENERATION:
All 3 projects from Phase 1 only.
One project per Phase 1 item:
- Project 1: Based on Phase 1, Item 1 (${phase1Items[0]})
- Project 2: Based on Phase 1, Item 2 (${phase1Items[1]})
- Project 3: Based on Phase 1, Item 3 (${phase1Items[2]})

Each project MUST:
1. Teach the SPECIFIC roadmap concept
2. Single-file console program
3. Use Scanner/input() for interaction
4. Include 3-4 specific requirements

CONSTRAINTS:
- Single .java/.py file only
- Console I/O: Scanner/input()
- No web servers, databases, GUI
- No external libraries
- No file I/O - in-memory only
- All data via console

SKILL: ${skillLevel}
${getSkillLevelGuidance(skillLevel)}
All projects ${skillLevel} level

FORMAT EACH PROJECT:

IMPORTANT: Language field MUST be exactly: ${language}

PROJECT 1:
Title: [Concept] - [App Name]
Description: Teaches [CONCEPT]. [Why important]. [What to build].
Language: ${language}
Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]
- [Specific requirement 4]
Rubrics:
[4-5 criteria, 100 pts total]

Generate 3 projects, ONE for EACH of the first 3 Phase 1 roadmap items in order:`;
};

const determineSkillLevel = (javaExpertise, pythonExpertise, javaScore, pythonScore) => {
  const scores = [];

  if (javaScore?.percentage) scores.push(javaScore.percentage);
  if (pythonScore?.percentage) scores.push(pythonScore.percentage);

  console.log(`[SkillLevel] Java expertise: ${javaExpertise}, Python expertise: ${pythonExpertise}`);
  console.log(`[SkillLevel] Java score: ${javaScore?.percentage}%, Python score: ${pythonScore?.percentage}%`);

  if (scores.length === 0) {
    if (javaExpertise === 'expert' || pythonExpertise === 'expert') {
      console.log(`[SkillLevel] Determined: Advanced (based on self-assessment)`);
      return 'Advanced';
    }
    if (javaExpertise === 'intermediate' || pythonExpertise === 'intermediate') {
      console.log(`[SkillLevel] Determined: Intermediate (based on self-assessment)`);
      return 'Intermediate';
    }
    console.log(`[SkillLevel] Determined: Beginner (based on self-assessment)`);
    return 'Beginner';
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`[SkillLevel] Average quiz score: ${avgScore.toFixed(1)}%`);

  if (avgScore >= 70) {
    console.log(`[SkillLevel] Determined: Advanced (quiz score >= 70%)`);
    return 'Advanced';
  }
  if (avgScore >= 40) {
    console.log(`[SkillLevel] Determined: Intermediate (quiz score >= 40%)`);
    return 'Intermediate';
  }
  console.log(`[SkillLevel] Determined: Beginner (quiz score < 40%)`);
  return 'Beginner';
};

const getSkillLevelGuidance = (level) => {
  if (level === 'Beginner') {
    return `BEGINNER:
- Simple variables, basic I/O
- if-else, loops (for/while)
- Straightforward logic
- No complex algorithms
- Foundational concepts`;
  }

  if (level === 'Intermediate') {
    return `INTERMEDIATE:
- Inheritance, interfaces
- Collections (ArrayList, HashMap)
- Moderate algorithms
- Exception handling
- Practical OOP`;
  }

  return `ADVANCED:
- Design patterns
- Advanced data structures
- Complex algorithms
- Recursion, optimization
- Advanced OOP architecture`;
};

const parseProjectsFromAI = (text) => {
  const projects = [];

  let projectMatches = text.split(/###\s*Project\s*\d+:/i).filter(p => p.trim());

  if (projectMatches.length <= 1) {
    projectMatches = text.split(/PROJECT\s*\d+:/i).filter(p => p.trim());
  }

  console.log(`[ProjectGen-Parse] Found ${projectMatches.length} potential project blocks`);

  for (const projectText of projectMatches) {
    try {
      const titleMatch = projectText.match(/\*\*Title:\*\*\s*(.+?)(?=\n|$)/i);
      const descMatch = projectText.match(/\*\*Description:\*\*\s*(.+?)(?=\*\*Language)/is);
      const langMatch = projectText.match(/\*\*Language:\s*\*\*?\s*(.+?)(?=\n|$)/i) ||
        projectText.match(/Language:\s*(.+?)(?=\n|$)/i);
      const reqMatch = projectText.match(/\*\*Requirements:\*\*\s*([\s\S]+?)(?=\*\*Rubrics:|$)/i);
      const rubricsMatch = projectText.match(/\*\*Rubrics:\*\*\s*([\s\S]+?)(?=\n\n|###|PROJECT|$)/i);

      if (titleMatch && descMatch && langMatch) {
        let title = titleMatch[1].trim();
        title = title.replace(/^\*\*|\*\*$/g, '');
        title = title.replace(/^["']|["']$/g, '');
        title = title.trim();

        let language = langMatch[1].trim();
        language = language.replace(/^\*\*|\*\*$/g, '');
        language = language.trim();

        const requirements = reqMatch
          ? reqMatch[1].split('\n').filter(r => r.trim() && (r.trim().startsWith('-') || r.trim().match(/^\d+\./)))
            .map(r => r.trim()).join('\n')
          : '';

        const rubrics = rubricsMatch
          ? rubricsMatch[1].split('\n').filter(r => r.trim() && (r.trim().startsWith('-') || r.trim().match(/^\d+\./)))
            .map(r => r.trim()).join('\n')
          : '';

        console.log(`[ProjectGen-Parse] Project "${title}" fields: Req=${!!reqMatch}, Rubrics=${!!rubricsMatch}`);

        projects.push({
          title: title,
          description: descMatch[1].trim().replace(/\n/g, ' '),
          language: language,
          requirements: requirements.trim(),
          rubrics: rubrics
        });
        console.log(`[ProjectGen-Parse] Successfully parsed project: ${title}`);
      }
    } catch (error) {
      console.error('[ProjectGen-Parse] Error parsing project:', error.message);
    }
  }

  return projects;
};
