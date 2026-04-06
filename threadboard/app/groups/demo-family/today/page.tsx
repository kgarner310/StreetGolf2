'use client';

import { useMemo } from 'react';
import Header from '@/components/Header';
import PlayerSubmissionCard from '@/components/PlayerSubmissionCard';
import ProgressStatus from '@/components/ProgressStatus';
import WaitingOnBanner from '@/components/WaitingOnBanner';
import BoardCard from '@/components/BoardCard';
import ResetButton from '@/components/ResetButton';
import { useStore } from '@/context/StoreContext';
import { Score } from '@/lib/types';
import { generateBoard } from '@/lib/board';

export default function TodayPage() {
  const { state, submitScore, getTodaySubmissions, hydrated } = useStore();
  const todaySubmissions = getTodaySubmissions();
  const { group } = state;

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const allSubmitted = group.players.every(p =>
    todaySubmissions.some(s => s.playerId === p.id)
  );

  const waitingPlayers = group.players.filter(
    p => !todaySubmissions.some(s => s.playerId === p.id)
  );

  const board = useMemo(() => {
    if (todaySubmissions.length === 0) return null;
    return generateBoard(group, todaySubmissions, today);
  }, [group, todaySubmissions, today]);

  const displayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleSubmit = (playerId: string, score: Score) => {
    submitScore(playerId, score);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header
        showBack
        backHref="/groups/demo-family"
        backLabel="The Family"
        title={displayDate}
      />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Progress bar */}
        <ProgressStatus submitted={todaySubmissions.length} total={group.players.length} />

        {/* Waiting on banner (only if incomplete and at least 1 submitted) */}
        {!allSubmitted && todaySubmissions.length > 0 && (
          <WaitingOnBanner waitingPlayers={waitingPlayers} />
        )}

        {/* Board (shown when complete) */}
        {allSubmitted && board && (
          <BoardCard board={board} group={group} />
        )}

        {/* Player cards — always show, board complete locks in the submitted state */}
        {(!allSubmitted || todaySubmissions.length === 0) && (
          <div className="space-y-3">
            {group.players.map(player => {
              const submission = todaySubmissions.find(s => s.playerId === player.id) ?? null;
              // Use the updated player streak from state (reflects today's submission)
              const playerWithStreak = state.group.players.find(p => p.id === player.id) ?? player;
              return (
                <PlayerSubmissionCard
                  key={player.id}
                  player={playerWithStreak}
                  submission={submission}
                  onSubmit={(score) => handleSubmit(player.id, score)}
                  boardComplete={allSubmitted}
                />
              );
            })}
          </div>
        )}

        {/* If complete, also show compact submitted cards below the board */}
        {allSubmitted && board && (
          <div className="space-y-2">
            <div className="text-xs text-zinc-600 font-semibold uppercase tracking-wider px-1">Submitted scores</div>
            {group.players.map(player => {
              const submission = todaySubmissions.find(s => s.playerId === player.id) ?? null;
              const playerWithStreak = state.group.players.find(p => p.id === player.id) ?? player;
              return (
                <PlayerSubmissionCard
                  key={player.id}
                  player={playerWithStreak}
                  submission={submission}
                  onSubmit={() => {}}
                  boardComplete
                />
              );
            })}
          </div>
        )}

        {/* Reset link at bottom */}
        <div className="text-center pt-4">
          <ResetButton />
        </div>
      </main>
    </div>
  );
}
