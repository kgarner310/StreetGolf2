import { NextRequest, NextResponse } from 'next/server';
import { Submission } from '@/lib/types';

// In-memory store keyed by "groupId:date"
// Works well for small groups playing in the same daily window.
// Upgrade path: replace `store` with Vercel KV, Upstash Redis, or any database.
// `npm install @vercel/kv` then swap store.get/set with kv.get/set.
const store = new Map<string, Submission[]>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const date = searchParams.get('date');
  if (!groupId || !date) {
    return NextResponse.json([], { status: 400 });
  }
  const submissions = store.get(`${groupId}:${date}`) ?? [];
  return NextResponse.json(submissions);
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { groupId: string; submission: Submission };
  const { groupId, submission } = body;
  if (!groupId || !submission?.playerId || !submission?.score) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const key = `${groupId}:${submission.date}`;
  const current = store.get(key) ?? [];
  // Upsert — one submission per player per day
  store.set(key, [
    ...current.filter(s => s.playerId !== submission.playerId),
    submission,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const date = searchParams.get('date');
  if (!groupId || !date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  store.delete(`${groupId}:${date}`);
  return NextResponse.json({ ok: true });
}
