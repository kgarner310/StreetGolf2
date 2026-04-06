'use client';

import { Player } from '@/lib/types';

interface WaitingOnBannerProps {
  waitingPlayers: Player[];
}

const HOLDOUT_QUIPS = [
  'still finishing their coffee ☕',
  'last seen on row 4 👀',
  'under investigation 🔍',
  'missing from the board 📋',
  'reportedly still thinking 🤔',
  'in the witness protection program 🫣',
];

function getQuip(name: string): string {
  // Deterministic quip based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % HOLDOUT_QUIPS.length;
  }
  return HOLDOUT_QUIPS[hash];
}

export default function WaitingOnBanner({ waitingPlayers }: WaitingOnBannerProps) {
  if (waitingPlayers.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-700/60 bg-amber-900/10 p-4">
      <div className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
        ⏳ Waiting on…
      </div>
      <div className="space-y-2">
        {waitingPlayers.map(player => (
          <div key={player.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{player.avatarEmoji}</span>
              <div>
                <span className="text-white font-medium text-sm">{player.name}</span>
                <div className="text-xs text-zinc-500">{getQuip(player.name)}</div>
              </div>
            </div>
            {player.streak > 0 && (
              <div className="text-right">
                <div className="text-xs text-orange-400 font-medium">
                  🔥 {player.streak} streak
                </div>
                <div className="text-xs text-red-500">at risk!</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
