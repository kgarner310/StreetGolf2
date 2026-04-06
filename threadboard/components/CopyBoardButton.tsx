'use client';

import { useState } from 'react';

interface CopyBoardButtonProps {
  text: string;
}

export default function CopyBoardButton({ text }: CopyBoardButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers / permission denied
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        w-full rounded-2xl py-4 font-bold text-base transition-all duration-200
        active:scale-95 touch-manipulation select-none
        ${copied
          ? 'bg-emerald-600 text-white'
          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }
      `}
    >
      {copied ? '✅ Copied! Paste into group chat' : '📋 Copy Board Text'}
    </button>
  );
}
