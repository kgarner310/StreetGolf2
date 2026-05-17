'use client';

import { Player } from '@/lib/types';

interface WaitingOnBannerProps {
  waitingPlayers: Player[];
}

const HOLDOUT_QUIPS = [
  'still finishing their coffee',
  'last seen on row four',
  'reportedly still thinking',
  'under quiet investigation',
  'missing from the board',
  'somewhere between row three and row six',
  'in the witness protection program',
  'taking the scenic route',
  'consulting outside sources',
  'staring at row five',
  'workshopping their vowels',
  'making it everyone else\'s problem',
  'locked in — allegedly',
  'in deliberations',
  'running late, as usual',
  'yet to be heard from',
];

function getQuip(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % HOLDOUT_QUIPS.length;
  }
  return HOLDOUT_QUIPS[hash];
}

export default function WaitingOnBanner({ waitingPlayers }: WaitingOnBannerProps) {
  if (waitingPlayers.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-800/40 bg-amber-900/8 p-4">
      <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">
        Still waiting
      </div>
      <div className="space-y-3">
        {waitingPlayers.map(player => (
          <div key={player.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">{player.avatarEmoji}</span>
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm leading-tight">{player.name}</div>
                <div className="text-xs text-zinc-500 truncate">{getQuip(player.name)}</div>
              </div>
            </div>
            {player.streak > 0 && (
              <div className="text-right shrink-0">
                <div className="text-xs text-orange-400 font-semibold">🔥 {player.streak}</div>
                <div className="text-xs text-red-500/70">streak at risk</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
