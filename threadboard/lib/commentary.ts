import { Submission, Player } from './types';
import { groupAverage } from './board';

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
  "This board goes in the hall of fame.",
  "Not a single wasted guess between them.",
  "Whatever they had for breakfast — keep eating it.",
  "Elite performance. The word never stood a chance.",
  "The group arrived. The word did not survive.",
  "Three or better all around. Save the screenshot.",
  "This is what peak form looks like.",
  "Nobody needed more than they used.",
  "The spread is tight. The scores are low. Good morning.",
  "Zero stumbles. Zero regrets.",
  "If there's a word for this level of competence, they already solved it.",
  "Low scores, high morale. Today was a good day.",
  "The word put up a fight. The group did not notice.",
  "Every player brought their best. The board shows it.",
  "Efficiency across the board. Nobody wasted a guess.",
  "The kind of morning that makes the rest of the day feel easy.",
];

const ROUGH_DAY = [
  "Rough one. The word fought back.",
  "The word had other plans today.",
  "Building character. That's what this is.",
  "Five letters. Infinite pain.",
  "Some days the puzzle wins. Today was that day.",
  "The word said: not today.",
  "The group gave it everything. The word gave nothing.",
  "A rough morning. The scores reflect it honestly.",
  "No shame in a hard day. Plenty of shame in quitting.",
  "High numbers across the board. It happens to everyone.",
  "The collective average alone tells the story.",
  "Tough word. Honest group. Hard board.",
  "Everyone tried. Nobody thrived. Tomorrow is open.",
  "The puzzle was not kind. The group was not prepared.",
  "Five letters stood between them and dignity. They won.",
  "Shared suffering. That's what groups are for.",
  "The word was patient. The solvers were not.",
  "A humbling morning. The group will recover.",
];

const MIXED_DAY = [
  "Wide spread. Someone's having a very different morning.",
  "Heroes and casualties on the same board.",
  "The range on this group is something else.",
  "Gap between first and last? Significant.",
  "Two different games were played here today.",
  "Mixed bag. The debrief will be heated.",
  "Divergent outcomes. Shared group chat.",
  "The scores tell a story. It has at least two acts.",
  "One person's easy morning is another's full ordeal.",
  "Not everyone saw the same word, apparently.",
  "The high and low score should compare notes.",
  "A board with range. Drama guaranteed.",
  "Today proved the group is full of individuals.",
  "Spread like that makes the conversation interesting.",
  "Consistency: not today's theme.",
  "The gap speaks for itself.",
  "No single mood captures this board. It's complicated.",
  "Close at the top. Not so close everywhere else.",
];

const SOMEONE_FAILED = [
  "Not everyone made it home today.",
  "Letters were harmed in the making of this board.",
  "We don't talk about what happened in that grid.",
  "A moment of silence for the fallen.",
  "Some grids cannot be won. Only survived.",
  "The board records everything. Including this.",
  "Out of guesses, not out of character.",
  "Row six was the last row. It didn't help.",
  "A miss is a miss. The board is honest.",
  "It's in the record now. Nothing to be done.",
  "The grid has logged this and moved on. So should you.",
  "Even the best players have this day eventually.",
  "Filed under: lessons learned the hard way.",
  "The score column says X. The heart says never again.",
  "There are no do-overs. Only tomorrow.",
  "The word was patient. The solver was not.",
  "Six rows. Zero solutions. One very long morning.",
  "Happens to the best. Ask anyone who's been there.",
];

const DNP_SHAMING = [
  "One ghost on the board. You know who you are.",
  "Someone's alarm didn't go off. Or did it.",
  "Participation optional, apparently.",
  "DNP. No further comment.",
  "The board has a hole in it. Shaped like a person.",
  "A missing score is a missing chapter.",
  "The puzzle existed. Not everyone agreed to participate.",
  "The board waited. Briefly. It's done waiting.",
  "Absent from the board. Present in our thoughts.",
  "There's a slot with no number. Someone owns that.",
  "DNP: Did Not Play. Or possibly: Did Not Plan.",
  "History is written by those who submit their scores.",
  "Ghosts don't contribute to the average. They're remembered anyway.",
  "One fewer score than expected. One more conversation at dinner.",
  "The group played. The group — mostly — showed up.",
  "Someone decided today wasn't their day. The board noted it.",
  "No score on record. The streak, however, is very much on record.",
  "A blank where a number should be. Ominous.",
];

const SWEEP = [
  "Everyone in. Close all around. Respect.",
  "Full roster. Full commitment.",
  "All in — tight scores, clean board.",
  "Complete board. The group chat will be active.",
  "Tight spread. Everyone brought the same energy.",
  "Within striking distance of each other. This group is consistent.",
  "Full participation and close scores. Rare combination.",
  "The group came in formation today.",
  "Everyone played. Everyone performed.",
  "Close enough to frame. Wide enough to have a winner.",
  "No outliers today. Just a very consistent group.",
  "The range is minimal. The effort was not.",
  "They came. They solved. They compared scores immediately.",
  "No stragglers, no blowouts. Just a clean, competitive board.",
  "Consistency is the brand today.",
  "A full board, tight numbers, and one clear winner.",
  "Everyone showed up and showed out.",
  "Razor thin margins. The clock may have decided it.",
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
