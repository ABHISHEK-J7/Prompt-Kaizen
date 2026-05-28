/**
 * Generates an improved version of the user's prompt using a deterministic
 * template, informed by the scenario, category, tone, audience and additional
 * requirements. Output format is whatever the user stated inside their own
 * prompt (no separate format field), so the template just asks for a clean,
 * well-structured response in whichever format the user requested.
 */

const ROLE_BY_CATEGORY = {
  'Academic Writing': 'expert academic writer and editor',
  'Email Writing': 'professional communication specialist',
  'Resume and LinkedIn': 'career coach and resume strategist',
  'Coding and Debugging': 'senior software engineer',
  'Data Analysis': 'experienced data analyst',
  'Business Communication': 'business communication consultant',
  'Interview Preparation': 'seasoned interview coach',
  'Research and Summarization': 'meticulous research analyst',
  'Content Creation': 'creative content strategist',
  'Social Media Post': 'social media marketing expert',
  'Image Generation Prompt': 'creative visual prompt engineer',
  Other: 'subject-matter expert',
};

const cleanScenario = (scenario = '') =>
  String(scenario).trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');

function generateImprovedPrompt(input = {}) {
  const {
    category = 'Other',
    scenario = '',
    tone = '',
    targetAudience = '',
    additionalRequirements = '',
  } = input;

  const role = ROLE_BY_CATEGORY[category] || ROLE_BY_CATEGORY.Other;
  const cleanedScenario = cleanScenario(scenario);
  const task = cleanedScenario
    ? cleanedScenario.charAt(0).toLowerCase() + cleanedScenario.slice(1)
    : 'complete the task described above';

  const toneText = tone ? `${tone.toLowerCase()}` : 'clear and professional';
  const audienceText = targetAudience
    ? targetAudience.trim()
    : 'a general audience appropriate for this task';

  const extras = additionalRequirements
    ? additionalRequirements.trim()
    : 'word limits, clear structure, examples where helpful, and any necessary constraints';

  const improved = [
    `Act as a ${role}.`,
    `Your task is to ${task}.`,
    `Use a ${toneText} tone.`,
    `The target audience is ${audienceText}.`,
    `Produce the output in the format the user has requested in their prompt (e.g., email, table, bullet points, code, report). If no format is specified, default to a clean, well-structured response.`,
    `Include the following important details: ${extras}.`,
    `Make the response clear, structured, and useful. If anything is ambiguous, state your assumptions before answering.`,
  ].join(' ');

  return improved;
}

module.exports = { generateImprovedPrompt, ROLE_BY_CATEGORY };
