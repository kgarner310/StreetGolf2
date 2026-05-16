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

function subKey(groupId: string) {
  return `push:${groupId}`;
}

export async function POST(request: NextRequest) {
  const { groupId, subscription } = await request.json();
  if (!groupId || !subscription?.endpoint) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const r = await redis();
  if (!r) return NextResponse.json({ ok: true }); // no-op without Redis

  const raw = await r.get(subKey(groupId));
  const subs: object[] = raw ? JSON.parse(raw) : [];
  const filtered = subs.filter((s: any) => s.endpoint !== subscription.endpoint);
  filtered.push(subscription);
  await r.set(subKey(groupId), JSON.stringify(filtered), 'EX', 30 * 24 * 60 * 60);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const endpoint = searchParams.get('endpoint');
  if (!groupId || !endpoint) return NextResponse.json({ ok: true });

  const r = await redis();
  if (!r) return NextResponse.json({ ok: true });

  const raw = await r.get(subKey(groupId));
  if (!raw) return NextResponse.json({ ok: true });
  const subs: any[] = JSON.parse(raw);
  await r.set(subKey(groupId), JSON.stringify(subs.filter(s => s.endpoint !== endpoint)), 'EX', 30 * 24 * 60 * 60);
  return NextResponse.json({ ok: true });
}
