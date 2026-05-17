'use client';

import { useState } from 'react';

interface ShareBoardButtonProps {
  text: string;
  title?: string;
}

export default function ShareBoardButton({ text, title = 'Threadboard — Daily Board' }: ShareBoardButtonProps) {
  const [shared, setShared] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ title, text });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch (err) {
        // User dismissed the share sheet — not an error
        if ((err as DOMException)?.name !== 'AbortError') {
          console.warn('Share failed:', err);
        }
      }
    }
  };

  if (!canShare) return null;

  return (
    <button
      onClick={handleShare}
      className={`
        w-full rounded-2xl py-4 font-bold text-base transition-all duration-200
        active:scale-95 touch-manipulation select-none
        ${shared
          ? 'bg-emerald-700 text-white'
          : 'bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600'
        }
      `}
    >
      {shared ? '✅ Shared!' : '↑ Share Board'}
    </button>
  );
}
