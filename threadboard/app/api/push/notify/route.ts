import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const REDIS_URL = process.env.REDIS_URL || process.env.STORAGE_URL;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:hello@threadboard.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

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
  '{name}\'s score is in.',
  '{name} showed up today.',
  'Score logged for {name}.',
  '{name} entered the chat. 🧠',
  '{name} came to play.',
  'New score from {name}. Go check it.',
  '{name} didn\'t ghost you today.',
  'The board just heard from {name}.',
  '{name}: done. Your move.',
];

const TRASH_TALK_LINES = [
  '{name} submitted. Are you still staring at row four?',
  '{name} is in. The board is judging you.',
  '{name} beat you to it. Again.',
  'Bold of you to still be thinking. {name} already submitted.',
  '{name}\'s score is logged. Yours isn\'t. Just saying.',
  '{name} didn\'t need six tries. Just so you know.',
  'Tick tock. {name} is already done.',
  '{name} submitted while you were procrastinating.',
  '{name} is on the board. The clock is ticking.',
  'First place isn\'t going to win itself. {name} is already in.',
];

const BOARD_COMPLETE_LINES = [
  'All scores are in. Check the board.',
  'Full board. Go see who won.',
  'Everyone\'s in. The results are ready.',
  'Board complete. Time to settle the score.',
  'All players have submitted. Check your ranking.',
];

function buildMessage(name: string, isLast: boolean, seed: string): { title: string; body: string } {
  if (isLast) {
    return {
      title: '🏆 Board Complete',
      body: pick(BOARD_COMPLETE_LINES, seed),
    };
  }
  const useTrash = (seed.charCodeAt(0) + seed.charCodeAt(1)) % 3 === 0;
  const lines = useTrash ? TRASH_TALK_LINES : SUBMITTED_LINES;
  return {
    title: '🧠 Threadboard',
    body: pick(lines, seed).replace('{name}', name),
  };
}

export async function POST(request: NextRequest) {
  const { groupId, playerName, playerId, date, boardUrl, isLast, submitterEndpoint } = await request.json();
  if (!groupId || !playerName) return NextResponse.json({ ok: true });

  if (!process.env.VAPID_PUBLIC_KEY) return NextResponse.json({ ok: true }); // not configured

  const r = await redis();
  if (!r) return NextResponse.json({ ok: true });

  const raw = await r.get(`push:${groupId}`);
  if (!raw) return NextResponse.json({ ok: true });

  const subs: any[] = JSON.parse(raw);
  const seed = `${playerId}:${date}`;
  const { title, body } = buildMessage(playerName, isLast, seed);
  const payload = JSON.stringify({ title, body, url: boardUrl ?? '/' });

  const stale: string[] = [];
  await Promise.all(
    subs
      .filter(s => s.endpoint !== submitterEndpoint)
      .map(async sub => {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.endpoint);
        }
      })
  );

  // Prune expired subscriptions
  if (stale.length > 0) {
    const fresh = subs.filter(s => !stale.includes(s.endpoint));
    await r.set(`push:${groupId}`, JSON.stringify(fresh), 'EX', 30 * 24 * 60 * 60);
  }

  return NextResponse.json({ ok: true });
}
