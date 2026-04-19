import { NextRequest, NextResponse } from 'next/server';
import { Submission } from '@/lib/types';

const memStore = new Map<string, Submission[]>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redis: any = null;
async function redis() {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) {
    const { default: Redis } = await import('ioredis');
    _redis = new Redis(process.env.REDIS_URL);
  }
  return _redis;
}

async function getStore(key: string): Promise<Submission[]> {
  const r = await redis();
  if (r) {
    const val = await r.get(key);
    return val ? JSON.parse(val) : [];
  }
  return memStore.get(key) ?? [];
}

async function setStore(key: string, subs: Submission[]): Promise<void> {
  const r = await redis();
  if (r) {
    await r.set(key, JSON.stringify(subs), 'EX', 7 * 24 * 60 * 60);
    return;
  }
  memStore.set(key, subs);
}

async function delStore(key: string): Promise<void> {
  const r = await redis();
  if (r) {
    await r.del(key);
    return;
  }
  memStore.delete(key);
}

function storeKey(groupId: string, date: string) {
  return `subs:${groupId}:${date}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const date = searchParams.get('date');
  if (!groupId || !date) return NextResponse.json([]);
  const subs = await getStore(storeKey(groupId, date));
  return NextResponse.json(subs);
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { groupId: string; submission: Submission };
  const { groupId, submission } = body;
  if (!groupId || !submission?.playerId || !submission?.score) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const key = storeKey(groupId, submission.date);
  const current = await getStore(key);
  await setStore(key, [
    ...current.filter(s => s.playerId !== submission.playerId),
    submission,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const date = searchParams.get('date');
  if (!groupId || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  await delStore(storeKey(groupId, date));
  return NextResponse.json({ ok: true });
}
