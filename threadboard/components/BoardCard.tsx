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

const SCORE_LABELS: Record<string, string> = {
  '2': 'Brilliant',
  '3': 'Great',
  '4': 'Solid',
  '5': 'Tough',
  '6': 'Survived',
  'X': 'Failed',
  'DNP': 'Sat out',
};

export default function BoardCard({ board, group }: BoardCardProps) {
  const [celebrate, setCelebrate] = useState(false);

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
      <div className={`rounded-2xl border p-5 text-center transition-all duration-500 ${
        celebrate
          ? 'border-emerald-500 bg-emerald-900/30 scale-[1.02]'
          : 'border-emerald-800/60 bg-emerald-900/10 scale-100'
      }`}>
        <div className={`text-5xl mb-2 transition-all duration-300 ${celebrate ? 'scale-125' : 'scale-100'}`}>
          🏆
        </div>
        <div className="text-emerald-400 font-black text-2xl tracking-tight">Board Complete</div>
        <div className="text-zinc-500 text-sm mt-0.5">{displayDate}</div>
        {winnerPlayer && (
          <div className="mt-3 text-sm text-zinc-300">
            Today&apos;s winner:{' '}
            <span className="text-white font-bold text-base">{winnerPlayer.name}</span>{' '}
            {scoreEmoji(winner.score)}
          </div>
        )}
        <div className="mt-4 text-zinc-500 text-sm italic border-t border-zinc-800/60 pt-3 leading-relaxed">
          &ldquo;{commentary}&rdquo;
        </div>
      </div>

      {/* Rankings */}
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800/80">
          <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
            Daily Rankings
          </div>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {sorted.map((sub, i) => {
            const player = group.players.find(p => p.id === sub.playerId)!;
            const isWinner = i === 0;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            const rankNum = i + 1;
            const nextSub = sorted[i + 1];
            const isTiebroken = nextSub &&
              numericScore(sub.score) !== null &&
              numericScore(sub.score) === numericScore(nextSub.score);
            const order = submissionOrder.get(sub.playerId);
            return (
              <div
                key={sub.playerId}
                className={`flex items-center gap-3 px-5 py-3.5 ${isWinner ? 'bg-amber-900/15' : ''}`}
              >
                <div className="w-7 flex items-center justify-center shrink-0">
                  {medal
                    ? <span className="text-lg">{medal}</span>
                    : <span className="text-xs font-bold text-zinc-500 w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center">{rankNum}</span>
                  }
                </div>
                <span className="text-2xl shrink-0">{player.avatarEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm leading-tight">{player.name}</div>
                  <div className="text-xs text-zinc-500 leading-tight mt-0.5">{player.archetype}</div>
                  {isTiebroken && (
                    <div className="text-xs text-yellow-400 font-semibold mt-0.5">⚡ tiebreak by time</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-xl tabular-nums text-white leading-tight">
                    {scoreDisplay(sub.score)}
                  </div>
                  <div className="text-xs text-zinc-500 leading-tight">
                    {SCORE_LABELS[sub.score]}
                    {order === 1 && sub.score !== 'DNP' && (
                      <span className="text-yellow-400 font-semibold ml-1">· 1st ⚡</span>
                    )}
                  </div>
                  {player.streak >= 3 && (
                    <div className="text-xs text-orange-400 mt-0.5">
                      {player.streak >= 7 ? '🔥🔥' : '🔥'} {player.streak}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {avg !== null && (
          <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/40 flex justify-between items-center">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Group Average</span>
            <span className="text-sm text-zinc-200 font-black tabular-nums">{avg.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Titles */}
      {board.generatedTitles.length > 0 && (
        <div>
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2 px-1">
            Today&apos;s Titles
          </div>
          <TitlesList titles={board.generatedTitles} players={group.players} />
        </div>
      )}

      {/* Share actions */}
      <div className="space-y-2 pt-1">
        <CopyBoardButton text={board.generatedText} />
        <ShareBoardButton text={board.generatedText} />
      </div>
    </div>
  );
}
