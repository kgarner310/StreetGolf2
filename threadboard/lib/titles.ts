import { Score, Submission, Title, Player } from './types';

function numericScore(score: Score): number | null {
  if (score === 'X' || score === 'DNP') return null;
  return parseInt(score, 10);
}

/**
 * Deterministic title engine.
 * Assigns titles based on scores and streaks.
 * Avoids giving contradictory titles to the same player where possible.
 */
export function generateTitles(submissions: Submission[], players: Player[]): Title[] {
  const titles: Title[] = [];
  const assignedPlayerIds = new Set<string>();

  // Separate submissions by type
  const withNumeric = submissions
    .map(s => ({ ...s, numScore: numericScore(s.score) }))
    .filter((s): s is Submission & { numScore: number } => s.numScore !== null)
    .sort((a, b) => a.numScore - b.numScore); // ascending = best first

  // Sharpest Blade — best non-X score
  if (withNumeric.length > 0) {
    const winner = withNumeric[0];
    titles.push({ playerId: winner.playerId, label: 'Sharpest Blade', emoji: '🏆' });
    assignedPlayerIds.add(winner.playerId);
  }

  // Grinder — 5 or 6 score (worst numeric player, unassigned)
  const grinder = [...withNumeric]
    .reverse()
    .find(s => s.numScore >= 5 && !assignedPlayerIds.has(s.playerId));
  if (grinder) {
    titles.push({ playerId: grinder.playerId, label: 'Grinder', emoji: '🧱' });
    assignedPlayerIds.add(grinder.playerId);
  }

  // Survivor — specifically a 6, unassigned
  const survivor = withNumeric.find(
    s => s.numScore === 6 && !assignedPlayerIds.has(s.playerId)
  );
  if (survivor) {
    titles.push({ playerId: survivor.playerId, label: 'Survivor', emoji: '😤' });
    assignedPlayerIds.add(survivor.playerId);
  }

  // Casualty — failed (X)
  const casualties = submissions.filter(s => s.score === 'X');
  for (const c of casualties) {
    if (!assignedPlayerIds.has(c.playerId)) {
      titles.push({ playerId: c.playerId, label: 'Casualty', emoji: '💀' });
      assignedPlayerIds.add(c.playerId);
    }
  }

  // Ghost — DNP
  const ghosts = submissions.filter(s => s.score === 'DNP');
  for (const g of ghosts) {
    if (!assignedPlayerIds.has(g.playerId)) {
      titles.push({ playerId: g.playerId, label: 'Ghost', emoji: '👻' });
      assignedPlayerIds.add(g.playerId);
    }
  }

  // Heater — longest active streak (3+), unassigned
  const heaters = players
    .filter(p => p.streak >= 3 && !assignedPlayerIds.has(p.id))
    .sort((a, b) => b.streak - a.streak);
  if (heaters.length > 0) {
    titles.push({ playerId: heaters[0].id, label: 'Heater', emoji: '🔥' });
    assignedPlayerIds.add(heaters[0].id);
  }

  return titles;
}

/**
 * Generate holdout titles for players who haven't submitted yet.
 * Used in the incomplete board state.
 */
export function getHoldouts(allPlayerIds: string[], submittedPlayerIds: string[]): string[] {
  return allPlayerIds.filter(id => !submittedPlayerIds.includes(id));
}
