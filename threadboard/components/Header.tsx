'use client';

import Link from 'next/link';

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export default function Header({ showBack, backHref = '/', backLabel = 'Home', title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href={backHref}
              className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              ← {backLabel}
            </Link>
          )}
          {!showBack && (
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <span className="font-bold text-white tracking-tight text-lg">Threadboard</span>
            </Link>
          )}
        </div>
        {title && (
          <span className="text-zinc-300 text-sm font-medium">{title}</span>
        )}
      </div>
    </header>
  );
}
