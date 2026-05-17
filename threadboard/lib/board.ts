import { Board, Group, Submission, Score, Title } from './types';
import { generateTitles } from './titles';
import { generateCommentary } from './commentary';

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

// Emoji squares for share text — like Wordle grid style
export function scoreSquare(score: Score): string {
  switch (score) {
    case '2': return '🟩';
    case '3': return '🟩';
    case '4': return '🟨';
    case '5': return '🟧';
    case '6': return '🟥';
    case 'X': return '⬛';
    case 'DNP': return '⬜';
  }
}

function submittedAt(s: Submission): number {
  return s.submittedAt ? new Date(s.submittedAt).getTime() : 0;
}

/** Returns a map of playerId → submission position (1 = first to submit). */
export function getSubmissionOrder(submissions: Submission[]): Map<string, number> {
  const order = new Map<string, number>();
  [...submissions]
    .sort((a, b) => submittedAt(a) - submittedAt(b))
    .forEach((s, i) => order.set(s.playerId, i + 1));
  return order;
}

export function sortSubmissions(submissions: Submission[]): Submission[] {
  return [...submissions].sort((a, b) => {
    const na = numericScore(a.score);
    const nb = numericScore(b.score);
    if (na !== null && nb !== null) {
      if (na !== nb) return na - nb;
      // Tiebreaker: earliest submission wins
      return submittedAt(a) - submittedAt(b);
    }
    if (na !== null) return -1;
    if (nb !== null) return 1;
    if (a.score === 'X' && b.score === 'DNP') return -1;
    if (a.score === 'DNP' && b.score === 'X') return 1;
    // X vs X or DNP vs DNP — tiebreak by time
    return submittedAt(a) - submittedAt(b);
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

  const titles = generateTitles(submissions, players);
  const sorted = sortSubmissions(submissions);
  const avg = groupAverage(submissions);
  const commentary = generateCommentary(submissions, players, date);

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Plain-text shareable recap — punchy, emoji-rich, Reddit-friendly
  const lines: string[] = [
    `🧠 THREADBOARD — ${group.name}`,
    displayDate,
    '',
    ...sorted.map(s => {
      const player = players.find(p => p.id === s.playerId)!;
      const streakStr = player.streak >= 3 ? ` 🔥${player.streak}` : '';
      return `${scoreSquare(s.score)} ${player.name} — ${scoreDisplay(s.score)}${streakStr}`;
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

  lines.push('', `"${commentary}"`);
  lines.push('', 'threadboard.vercel.app');

  const generatedText = lines.join('\n');

  return {
    date,
    groupId: group.id,
    submissions,
    completed: allSubmitted,
    generatedText,
    generatedTitles: titles,
  };
}

export type { Title };
