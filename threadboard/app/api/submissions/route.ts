import { NextRequest, NextResponse } from 'next/server';
import { Submission } from '@/lib/types';

// --- Storage abstraction ---
// Uses Vercel KV in production (when KV_REST_API_URL is set).
// Falls back to in-memory Map for local dev — no setup needed.
// Upgrade: create a KV store in Vercel dashboard → Storage, link it to
// this project, then `vercel env pull` to get the env vars locally.

const memStore = new Map<string, Submission[]>();

async function getStore(key: string): Promise<Submission[]> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return (await kv.get<Submission[]>(key)) ?? [];
  }
  return memStore.get(key) ?? [];
}

async function setStore(key: string, subs: Submission[]): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    // 7-day TTL — old boards auto-expire
    await kv.set(key, subs, { ex: 7 * 24 * 60 * 60 });
    return;
  }
  memStore.set(key, subs);
}

async function delStore(key: string): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    await kv.del(key);
    return;
  }
  memStore.delete(key);
}

function storeKey(groupId: string, date: string) {
  return `subs:${groupId}:${date}`;
}

// --- Route handlers ---

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
