'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { decodeGroup } from '@/lib/groupConfig';
import { useGroupBoard } from '@/hooks/useGroupBoard';
import { generateBoard, getSubmissionOrder } from '@/lib/board';
import { Group, Score } from '@/lib/types';
import Header from '@/components/Header';
import PlayerSubmissionCard from '@/components/PlayerSubmissionCard';
import ProgressStatus from '@/components/ProgressStatus';
import WaitingOnBanner from '@/components/WaitingOnBanner';
import BoardCard from '@/components/BoardCard';

// Split into two components so hooks aren't called conditionally
export default function GroupBoardPage() {
  const params = useParams();
  const config = params.config as string;
  const group = useMemo(() => decodeGroup(config), [config]);

  if (!group) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">🤔</div>
          <div className="text-white font-bold text-xl">Invalid group link</div>
          <p className="text-zinc-500 text-sm">This link might be broken or expired.</p>
          <Link href="/" className="block text-indigo-400 underline text-sm">
            Create a new group
          </Link>
        </div>
      </div>
    );
  }

  return <GroupBoard group={group} />;
}

function GroupBoard({ group }: { group: Group }) {
  const { submitScore, getTodaySubmissions, getPlayerHistory, resetBoard, hydrated } = useGroupBoard(group);
  const [linkCopied, setLinkCopied] = useState(false);

  const todaySubmissions = getTodaySubmissions();
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

  const submissionOrder = useMemo(() => getSubmissionOrder(todaySubmissions), [todaySubmissions]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch { /* ignore */ }
  };

  const displayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header showBack backHref="/" backLabel="Home" title={group.name} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Share link banner */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 space-y-2">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            📎 Share with your group
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 truncate font-mono">
              {typeof window !== 'undefined' ? window.location.href : ''}
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                linkCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {linkCopied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          <div className="text-xs text-zinc-600">
            Anyone with this link can submit their score today.
          </div>
        </div>

        {/* Date + progress */}
        <div className="text-center text-zinc-500 text-sm">{displayDate}</div>
        <ProgressStatus submitted={todaySubmissions.length} total={group.players.length} />

        {/* Waiting banner */}
        {!allSubmitted && todaySubmissions.length > 0 && (
          <WaitingOnBanner waitingPlayers={waitingPlayers} />
        )}

        {/* Completed board */}
        {allSubmitted && board && (
          <BoardCard board={board} group={group} />
        )}

        {/* Player cards */}
        <div className="space-y-3">
          {group.players.map(player => {
            const submission = todaySubmissions.find(s => s.playerId === player.id) ?? null;
            const history = getPlayerHistory(player.id, 7);
            return (
              <PlayerSubmissionCard
                key={player.id}
                player={player}
                submission={submission}
                onSubmit={(score: Score) => submitScore(player.id, score)}
                boardComplete={allSubmitted}
                history={history}
                submissionOrder={submissionOrder.get(player.id)}
              />
            );
          })}
        </div>

        <div className="text-center pt-4 pb-8">
          <button
            onClick={resetBoard}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline"
          >
            Reset today&apos;s scores
          </button>
        </div>
      </main>
    </div>
  );
}
