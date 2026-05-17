'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import GroupSummaryCard from '@/components/GroupSummaryCard';
import ResetButton from '@/components/ResetButton';
import { useStore } from '@/context/StoreContext';

export default function GroupPage() {
  const { state, getTodaySubmissions, hydrated } = useStore();
  const todaySubmissions = getTodaySubmissions();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 text-sm">Loading…</div>
      </div>
    );
  }

  const { group } = state;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header showBack backHref="/" backLabel="Home" title="The Family" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Group summary + today's CTA */}
        <GroupSummaryCard group={group} todaySubmissions={todaySubmissions} />

        {/* Players roster */}
        <div>
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3 px-1">Roster</div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
            {group.players.map(player => {
              const todaySub = todaySubmissions.find(s => s.playerId === player.id);
              return (
                <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-2xl">{player.avatarEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{player.name}</span>
                      {player.streak >= 3 && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                          🔥 {player.streak}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">{player.archetype}</div>
                  </div>
                  <div className="text-right">
                    {todaySub ? (
                      <div className="text-sm font-bold text-emerald-400">✓ In</div>
                    ) : (
                      <div className="text-sm text-zinc-600">—</div>
                    )}
                    {player.streak > 0 && (
                      <div className="text-xs text-zinc-600">{player.streak}d streak</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick submit CTA */}
        <Link
          href="/groups/demo-family/today"
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl py-4 text-lg transition-colors active:scale-95 touch-manipulation"
        >
          Go to Today&apos;s Board →
        </Link>

        {/* Reset */}
        <div className="text-center pt-2">
          <ResetButton />
        </div>
      </main>
    </div>
  );
}
