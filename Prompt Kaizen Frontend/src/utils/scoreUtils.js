export const PARAMETER_KEYS = [
  { key: 'clarity', label: 'Clarity', max: 10 },
  { key: 'context', label: 'Context', max: 15 },
  { key: 'roleAssignment', label: 'Role', max: 10 },
  { key: 'taskDefinition', label: 'Task', max: 15 },
  { key: 'inputParameters', label: 'Input Details', max: 15 },
  { key: 'outputFormat', label: 'Output Format', max: 10 },
  { key: 'constraints', label: 'Constraints', max: 10 },
  { key: 'tone', label: 'Tone', max: 5 },
  { key: 'relevance', label: 'Relevance', max: 5 },
  { key: 'grammarStructure', label: 'Grammar', max: 5 },
];

export function ratingFromScore(score) {
  if (score >= 90) return 'Excellent Prompt';
  if (score >= 75) return 'Good Prompt';
  if (score >= 60) return 'Average Prompt';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor Prompt';
}

/**
 * Heatmap palette — keeps the two-color rule:
 *  - High (≥ 8): solid peach, dark text. Visually dominant ("strong").
 *  - Mid (5–7): soft cream, dark text. Quieter ("okay").
 *  - Low (< 5): dark warm brown, peach text. Inverted ("needs attention").
 */
export function heatmapClass(scaledScore) {
  if (scaledScore >= 8) return 'bg-flame-500 text-white ring-1 ring-flame-600 shadow-[0_8px_24px_-12px_rgba(241,93,35,0.55)]';
  if (scaledScore >= 5) return 'bg-cream-200 text-flame-900 ring-1 ring-cream-400';
  return 'bg-flame-900 text-cream-200 ring-1 ring-flame-700';
}

export function normalizeToTen(score, max) {
  if (!max) return 0;
  return Math.round((score / max) * 10 * 10) / 10;
}

/**
 * Rating badge — small chip near the overall score.
 */
export function ratingBadgeClass(rating) {
  switch (rating) {
    case 'Excellent Prompt':
      return 'bg-flame-900 text-cream-300';
    case 'Good Prompt':
      return 'bg-cream-300 text-flame-900';
    case 'Average Prompt':
      return 'bg-cream-100 text-flame-800 border border-cream-200';
    case 'Needs Improvement':
      return 'bg-white text-flame-900 border border-flame-200';
    default: // Poor
      return 'bg-flame-900 text-cream-200 border border-flame-700';
  }
}

/**
 * For a fractional progress (0..1), pick a bar color.
 */
export function progressBarClass(ratio) {
  if (ratio >= 0.75) return 'bg-flame-500';
  if (ratio >= 0.5)  return 'bg-flame-500/85';
  if (ratio >= 0.25) return 'bg-flame-500/65';
  return 'bg-flame-500/45';
}
