import { Board, Group, Submission, Score, Title } from './types';
import { generateTitles } from './titles';

export function numericScore(score: Score): number | null {
  if (score === 'X' || score === 'DNP') return null;
  return parseInt(score, 10);
}

export function scoreDisplay(score: Score): string {
  if (score === 'X') return 'X/6';
  if (score === 'DNP') return 'DNP';
  return `${score}/6`;
}

export function scoreEmoji(score: Score): string {
  switch (score) {
    case '2': return '👑';
    case '3': return '🔥';
    case '4': return '😎';
    case '5': return '😅';
    case '6': return '🧱';
    case 'X': return '💀';
    case 'DNP': return '👻';
  }
}

export function sortSubmissions(submissions: Submission[]): Submission[] {
  return [...submissions].sort((a, b) => {
    const na = numericScore(a.score);
    const nb = numericScore(b.score);
    // Numeric scores first (ascending = best)
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    // X before DNP
    if (a.score === 'X' && b.score === 'DNP') return -1;
    if (a.score === 'DNP' && b.score === 'X') return 1;
    return 0;
  });
}

export function groupAverage(submissions: Submission[]): number | null {
  const nums = submissions
    .map(s => numericScore(s.score))
    .filter((n): n is number => n !== null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Generates the complete Board object including plain-text shareable recap.
 * Called once all players have submitted.
 */
export function generateBoard(group: Group, submissions: Submission[], date: string): Board {
  const { players } = group;
  const allSubmitted = players.every(p => submissions.some(s => s.playerId === p.id));
  const completed = allSubmitted;

  const titles = generateTitles(submissions, players);
  const sorted = sortSubmissions(submissions);
  const avg = groupAverage(submissions);

  // Format date for display e.g. "April 6, 2026"
  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Plain-text shareable recap
  const lines: string[] = [
    `🧠 THREADBOARD — ${displayDate}`,
    '',
    ...sorted.map(s => {
      const player = players.find(p => p.id === s.playerId)!;
      return `${player.name} — ${scoreDisplay(s.score)} ${scoreEmoji(s.score)}`;
    }),
    '',
    ...titles.map(t => {
      const player = players.find(p => p.id === t.playerId)!;
      return `${t.emoji} ${t.label}: ${player.name}`;
    }),
  ];

  if (avg !== null) {
    lines.push(`📊 Group Avg: ${avg.toFixed(2)}`);
  }

  lines.push('', '— threadboard.app');

  const generatedText = lines.filter(l => l !== undefined).join('\n');

  return {
    date,
    groupId: group.id,
    submissions,
    completed,
    generatedText,
    generatedTitles: titles,
  };
}

export type { Title };
