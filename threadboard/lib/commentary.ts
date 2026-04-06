import { Submission, Player } from './types';
import { groupAverage } from './board';

// Deterministic pick — same date always gives same line
function pick<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return arr[hash % arr.length];
}

const GREAT_DAY = [
  "Clean sweep. The algorithm is scared.",
  "Group avg under 4? Someone's been practicing.",
  "This board goes in the family hall of fame.",
  "Wordle didn't stand a chance today.",
  "Not a single wasted guess between them.",
  "Whatever they're eating for breakfast — keep eating it.",
];

const ROUGH_DAY = [
  "Rough one. The word fought back.",
  "The word had other plans today.",
  "Building character. That's what this is.",
  "Five letters. Infinite pain.",
  "Some days Wordle wins. Today was that day.",
  "The word said: not today.",
];

const MIXED_DAY = [
  "Wide spread. Someone's having a very different morning.",
  "Heroes and casualties on the same board.",
  "The range on this group is something else.",
  "Gap between first and last? Significant.",
  "Two different games were played here today.",
  "Mixed bag. The debrief will be heated.",
];

const SOMEONE_FAILED = [
  "Not everyone made it home today.",
  "Letters were harmed in the making of this board.",
  "We don't talk about what happened in that grid.",
  "The mortuary report has been filed.",
  "A moment of silence for the fallen.",
  "Some grids cannot be won. Only survived.",
];

const DNP_SHAMING = [
  "One ghost on the board. You know who you are.",
  "Someone's alarm didn't go off. Or did it.",
  "Participation optional, apparently.",
  "DNP. No further comment.",
  "The board has a hole in it. Shaped like a person.",
];

const SWEEP = [
  "Everyone in. Nobody cooked. Respect.",
  "Full roster. Full commitment.",
  "All four showed up. That's something.",
  "Complete board. The group chat will be active.",
];

export function generateCommentary(
  submissions: Submission[],
  players: Player[],
  date: string
): string {
  const hasCasualty = submissions.some(s => s.score === 'X');
  const hasGhost = submissions.some(s => s.score === 'DNP');
  const avg = groupAverage(submissions);
  const allNumeric = submissions.every(s => s.score !== 'X' && s.score !== 'DNP');

  const seed = date + players.map(p => p.id).join('');

  if (hasGhost && !hasCasualty) return pick(DNP_SHAMING, seed);
  if (hasCasualty) return pick(SOMEONE_FAILED, seed);
  if (allNumeric && avg !== null && avg <= 3.0) return pick(GREAT_DAY, seed);
  if (allNumeric && avg !== null && avg >= 5.0) return pick(ROUGH_DAY, seed);
  if (allNumeric && submissions.length === players.length) {
    const scores = submissions.map(s => parseInt(s.score as string, 10));
    const spread = Math.max(...scores) - Math.min(...scores);
    if (spread <= 1) return pick(SWEEP, seed);
    if (spread >= 3) return pick(MIXED_DAY, seed);
  }
  return pick(MIXED_DAY, seed);
}
