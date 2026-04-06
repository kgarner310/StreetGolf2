'use client';

import Link from 'next/link';
import { Group, Submission } from '@/lib/types';

interface GroupSummaryCardProps {
  group: Group;
  todaySubmissions: Submission[];
}

export default function GroupSummaryCard({ group, todaySubmissions }: GroupSummaryCardProps) {
  const submitted = todaySubmissions.length;
  const total = group.players.length;
  const complete = submitted === total;

  const displayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Today's Board</div>
          <div className="text-white font-bold text-xl">{group.name}</div>
          <div className="text-zinc-500 text-sm">{displayDate}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
          complete
            ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
            : 'bg-amber-900/30 text-amber-400 border border-amber-800/50'
        }`}>
          {complete ? '✅ Complete' : `${submitted}/${total} in`}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {group.players.map(player => {
          const sub = todaySubmissions.find(s => s.playerId === player.id);
          return (
            <div
              key={player.id}
              className={`flex-1 rounded-xl border py-2 text-center transition-colors ${
                sub
                  ? 'border-emerald-700/50 bg-emerald-900/20'
                  : 'border-zinc-700 bg-zinc-800/50'
              }`}
              title={sub ? `${player.name}: ${sub.score}` : `${player.name}: not submitted`}
            >
              <div className="text-xl">{player.avatarEmoji}</div>
              <div className="text-xs text-zinc-400 mt-0.5 font-medium">{player.name}</div>
              {sub && <div className="text-xs text-emerald-400 mt-0.5">✓</div>}
            </div>
          );
        })}
      </div>

      <Link
        href="/groups/demo-family/today"
        className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-3 transition-colors active:scale-95 touch-manipulation"
      >
        {complete ? 'View Board →' : 'Submit Scores →'}
      </Link>
    </div>
  );
}
