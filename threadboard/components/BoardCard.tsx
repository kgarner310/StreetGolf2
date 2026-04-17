'use client';

import { useEffect, useState } from 'react';
import { Board, Group } from '@/lib/types';
import { scoreDisplay, scoreEmoji, sortSubmissions, groupAverage, getSubmissionOrder, numericScore } from '@/lib/board';
import { generateCommentary } from '@/lib/commentary';
import TitlesList from './TitlesList';
import CopyBoardButton from './CopyBoardButton';
import ShareBoardButton from './ShareBoardButton';

interface BoardCardProps {
  board: Board;
  group: Group;
}

export default function BoardCard({ board, group }: BoardCardProps) {
  const [celebrate, setCelebrate] = useState(false);

  // Trigger celebration once on mount
  useEffect(() => {
    setCelebrate(true);
    const t = setTimeout(() => setCelebrate(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const sorted = sortSubmissions(board.submissions);
  const avg = groupAverage(board.submissions);
  const submissionOrder = getSubmissionOrder(board.submissions);
  const winner = sorted[0];
  const winnerPlayer = winner ? group.players.find(p => p.id === winner.playerId) : null;
  const commentary = generateCommentary(board.submissions, group.players, board.date);

  const displayDate = new Date(board.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Celebration banner */}
      <div className={`rounded-2xl border border-emerald-700 bg-emerald-900/20 p-4 text-center transition-all duration-500 ${
        celebrate ? 'scale-105 border-emerald-500 bg-emerald-900/40' : 'scale-100'
      }`}>
        <div className={`text-4xl mb-1 transition-all duration-300 ${celebrate ? 'scale-125' : 'scale-100'}`}>
          🏆
        </div>
        <div className="text-emerald-400 font-black text-xl">Board Complete!</div>
        <div className="text-zinc-400 text-sm">{displayDate}</div>
        {winnerPlayer && (
          <div className="mt-2 text-sm text-zinc-300">
            Today&apos;s winner:{' '}
            <span className="text-white font-bold">{winnerPlayer.name}</span>{' '}
            {scoreEmoji(winner.score)}
          </div>
        )}
        {/* Commentary */}
        <div className="mt-3 text-zinc-500 text-xs italic border-t border-zinc-800 pt-3">
          &ldquo;{commentary}&rdquo;
        </div>
      </div>

      {/* Rankings */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            🧠 Daily Rankings
          </div>
        </div>
        <div className="divide-y divide-zinc-800">
          {sorted.map((sub, i) => {
            const player = group.players.find(p => p.id === sub.playerId)!;
            const isWinner = i === 0;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
            // Tiebreaker: same score as the next player means time decided it
            const nextSub = sorted[i + 1];
            const isTiebroken = nextSub &&
              numericScore(sub.score) !== null &&
              numericScore(sub.score) === numericScore(nextSub.score);
            return (
              <div
                key={sub.playerId}
                className={`flex items-center gap-3 px-4 py-3 ${isWinner ? 'bg-amber-900/10' : ''}`}
              >
                <div className="text-sm w-6 text-center">{medal}</div>
                <span className="text-2xl">{player.avatarEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm">{player.name}</div>
                  <div className="text-xs text-zinc-500">{player.archetype}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg tabular-nums text-white">
                    {scoreDisplay(sub.score)} {scoreEmoji(sub.score)}
                  </div>
                  {isTiebroken && (
                    <div className="text-xs text-yellow-400 font-semibold">⚡ fastest fingers</div>
                  )}
                  {player.streak >= 3 && (
                    <div className="text-xs text-orange-400">
                      {player.streak >= 7 ? '🔥🔥' : '🔥'} {player.streak} day streak
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {avg !== null && (
          <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/50 flex justify-between">
            <span className="text-xs text-zinc-500 font-medium">📊 Group Avg</span>
            <span className="text-xs text-zinc-300 font-bold">{avg.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Titles */}
      {board.generatedTitles.length > 0 && (
        <div>
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 px-1">
            Today&apos;s Titles
          </div>
          <TitlesList titles={board.generatedTitles} players={group.players} />
        </div>
      )}

      {/* Share actions */}
      <div className="space-y-2 pt-2">
        <CopyBoardButton text={board.generatedText} />
        <ShareBoardButton text={board.generatedText} />
      </div>
    </div>
  );
}
