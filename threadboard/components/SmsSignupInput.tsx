'use client';

import { useState, useEffect } from 'react';

interface SmsSignupInputProps {
  groupId: string;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return digits;
}

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function storageKey(groupId: string) {
  return `tb_phone_${groupId}`;
}

export default function SmsSignupInput({ groupId }: SmsSignupInputProps) {
  const [phone, setPhone] = useState('');
  const [registered, setRegistered] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey(groupId));
    if (saved) setRegistered(saved);
  }, [groupId]);

  const register = async () => {
    if (loading || !isValidPhone(phone)) return;
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const res = await fetch('/api/sms/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, phone: normalized }),
      });
      if (res.ok) {
        localStorage.setItem(storageKey(groupId), normalized);
        setRegistered(normalized);
        setPhone('');
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (loading || !registered) return;
    setLoading(true);
    try {
      await fetch('/api/sms/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, phone: registered }),
      });
      localStorage.removeItem(storageKey(groupId));
      setRegistered(null);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
        <span>📲 Texts on for this group</span>
        <button
          onClick={remove}
          disabled={loading}
          className="text-zinc-600 hover:text-zinc-400 underline transition-colors"
        >
          Remove me
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 pt-1">
      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && register()}
        placeholder="Your phone number"
        className="flex-1 bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        onClick={register}
        disabled={loading || !isValidPhone(phone)}
        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
      >
        {loading ? '…' : '📲 Text me'}
      </button>
    </div>
  );
}
