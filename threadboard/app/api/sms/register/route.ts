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

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return digits;
}

export async function POST(request: NextRequest) {
  const { groupId, phone } = await request.json();
  if (!groupId || !phone) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const normalized = normalizePhone(phone);
  if (normalized.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
  }

  const r = await redis();
  if (!r) return NextResponse.json({ ok: true });

  const key = `sms:${groupId}`;
  const raw = await r.get(key);
  const subs: { phone: string }[] = raw ? JSON.parse(raw) : [];

  if (!subs.some(s => s.phone === normalized)) {
    subs.push({ phone: normalized });
    await r.set(key, JSON.stringify(subs), 'EX', 30 * 24 * 60 * 60);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { groupId, phone } = await request.json();
  if (!groupId || !phone) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const normalized = normalizePhone(phone);
  const r = await redis();
  if (!r) return NextResponse.json({ ok: true });

  const key = `sms:${groupId}`;
  const raw = await r.get(key);
  if (!raw) return NextResponse.json({ ok: true });

  const subs: { phone: string }[] = JSON.parse(raw);
  const fresh = subs.filter(s => s.phone !== normalized);
  await r.set(key, JSON.stringify(fresh), 'EX', 30 * 24 * 60 * 60);

  return NextResponse.json({ ok: true });
}
