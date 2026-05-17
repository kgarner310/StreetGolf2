import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL = process.env.REDIS_URL || process.env.STORAGE_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redis: any = null;
async function redis() {
  if (!REDIS_URL) return null;
  if (!_redis) {
    const { default: Redis } = await import('ioredis');
    _redis = new Redis(REDIS_URL);
  }
  return _redis;
}

function pick<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[hash % arr.length];
}

const SUBMITTED_LINES = [
  '{name} just submitted. Board is filling up.',
  "{name}'s score is in.",
  '{name} showed up today.',
  'Score logged for {name}.',
  '{name} entered the chat. 🧠',
  '{name} came to play.',
  'New score from {name}. Go check it.',
  "{name} didn't ghost you today.",
  'The board just heard from {name}.',
  '{name}: done. Your move.',
];

const TRASH_TALK_LINES = [
  '{name} submitted. Are you still staring at row four?',
  '{name} is in. The board is judging you.',
  '{name} beat you to it. Again.',
  'Bold of you to still be thinking. {name} already submitted.',
  "{name}'s score is logged. Yours isn't. Just saying.",
  "{name} didn't need six tries. Just so you know.",
  'Tick tock. {name} is already done.',
  '{name} submitted while you were procrastinating.',
  '{name} is on the board. The clock is ticking.',
  "First place isn't going to win itself. {name} is already in.",
];

const BOARD_COMPLETE_LINES = [
  'All scores are in. Check the board.',
  'Full board. Go see who won.',
  "Everyone's in. The results are ready.",
  'Board complete. Time to settle the score.',
  'All players have submitted. Check your ranking.',
];

function buildBody(name: string, isLast: boolean, seed: string, boardUrl: string): string {
  if (isLast) {
    return `🏆 ${pick(BOARD_COMPLETE_LINES, seed)}\n${boardUrl}`;
  }
  const useTrash = (seed.charCodeAt(0) + seed.charCodeAt(1)) % 3 === 0;
  const lines = useTrash ? TRASH_TALK_LINES : SUBMITTED_LINES;
  return `🧠 ${pick(lines, seed).replace('{name}', name)}\n${boardUrl}`;
}

export async function POST(request: NextRequest) {
  const { groupId, playerName, playerId, date, boardUrl, isLast, submitterPhone } =
    await request.json();
  if (!groupId || !playerName) return NextResponse.json({ ok: true });
  if (!process.env.TWILIO_ACCOUNT_SID) return NextResponse.json({ ok: true });

  const r = await redis();
  if (!r) return NextResponse.json({ ok: true });

  const raw = await r.get(`sms:${groupId}`);
  if (!raw) return NextResponse.json({ ok: true });

  const subs: { phone: string }[] = JSON.parse(raw);
  const targets = subs.filter(s => s.phone !== submitterPhone);
  if (targets.length === 0) return NextResponse.json({ ok: true });

  const seed = `${playerId}:${date}`;
  const body = buildBody(playerName, isLast, seed, boardUrl ?? '/');

  const { default: twilio } = await import('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await Promise.all(
    targets.map(s =>
      client.messages
        .create({ body, from: process.env.TWILIO_FROM_NUMBER!, to: s.phone })
        .catch(() => {})
    )
  );

  return NextResponse.json({ ok: true });
}
