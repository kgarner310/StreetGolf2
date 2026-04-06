'use client';

import { Board, Group } from '@/lib/types';
import { scoreDisplay, scoreEmoji, sortSubmissions, groupAverage } from '@/lib/board';
import TitlesList from './TitlesList';
import CopyBoardButton from './CopyBoardButton';
import ShareBoardButton from './ShareBoardButton';

interface BoardCardProps {
  board: Board;
  group: Group;
}

export default function BoardCard({ board, group }: BoardCardProps) {
  const sorted = sortSubmissions(board.submissions);
  const avg = groupAverage(board.submissions);
  const winner = sorted[0];
  const winnerPlayer = winner ? group.players.find(p => p.id === winner.playerId) : null;

  const displayDate = new Date(board.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Board complete celebration banner */}
      <div className="rounded-2xl border border-emerald-700 bg-emerald-900/20 p-4 text-center">
        <div className="text-3xl mb-1">🏆</div>
        <div className="text-emerald-400 font-bold text-lg">Board Complete!</div>
        <div className="text-zinc-400 text-sm">{displayDate}</div>
        {winnerPlayer && (
          <div className="mt-2 text-sm text-zinc-300">
            Today's winner: <span className="text-white font-bold">{winnerPlayer.name}</span> {scoreEmoji(winner.score)}
          </div>
        )}
      </div>

      {/* Rankings */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">🧠 Daily Rankings</div>
        </div>
        <div className="divide-y divide-zinc-800">
          {sorted.map((sub, i) => {
            const player = group.players.find(p => p.id === sub.playerId)!;
            const isWinner = i === 0;
            return (
              <div
                key={sub.playerId}
                className={`flex items-center gap-3 px-4 py-3 ${isWinner ? 'bg-amber-900/10' : ''}`}
              >
                <div className="text-zinc-600 font-bold text-sm w-5 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </div>
                <span className="text-2xl">{player.avatarEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm">{player.name}</div>
                  <div className="text-xs text-zinc-500">{player.archetype}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg tabular-nums text-white">
                    {scoreDisplay(sub.score)} {scoreEmoji(sub.score)}
                  </div>
                  {player.streak > 0 && (
                    <div className="text-xs text-orange-400">🔥 {player.streak} day streak</div>
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
            Today's Titles
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
