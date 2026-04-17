'use client';

import { useState } from 'react';
import { Score, Player, Submission } from '@/lib/types';
import { scoreDisplay, scoreEmoji } from '@/lib/board';
import ScoreHistoryDots from './ScoreHistoryDots';

const SCORES: Score[] = ['2', '3', '4', '5', '6', 'X', 'DNP'];

const SCORE_COLORS: Record<Score, string> = {
  '2': 'bg-emerald-500 hover:bg-emerald-400 text-white',
  '3': 'bg-green-500 hover:bg-green-400 text-white',
  '4': 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900',
  '5': 'bg-orange-500 hover:bg-orange-400 text-white',
  '6': 'bg-red-600 hover:bg-red-500 text-white',
  'X': 'bg-zinc-700 hover:bg-zinc-600 text-white',
  'DNP': 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
};

const SUBMITTED_COLORS: Record<Score, string> = {
  '2': 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  '3': 'border-green-500 bg-green-500/10 text-green-400',
  '4': 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  '5': 'border-orange-500 bg-orange-500/10 text-orange-400',
  '6': 'border-red-600 bg-red-600/10 text-red-400',
  'X': 'border-zinc-600 bg-zinc-800/50 text-zinc-400',
  'DNP': 'border-zinc-700 bg-zinc-900/50 text-zinc-500',
};

const ORDER_LABELS: Record<number, string> = { 1: '1st in ⚡', 2: '2nd in', 3: '3rd in', 4: '4th in' };

interface PlayerSubmissionCardProps {
  player: Player;
  submission: Submission | null;
  onSubmit: (score: Score) => void;
  boardComplete: boolean;
  history?: Array<{ date: string; score: Score | null }>;
  submissionOrder?: number; // 1 = submitted first today
}

export default function PlayerSubmissionCard({
  player,
  submission,
  onSubmit,
  boardComplete,
  history,
  submissionOrder,
}: PlayerSubmissionCardProps) {
  const [editing, setEditing] = useState(false);

  const handleSubmit = (score: Score) => {
    onSubmit(score);
    setEditing(false);
  };

  // Streak flame intensity
  const streakDisplay = player.streak >= 7
    ? `🔥🔥 ${player.streak}`
    : player.streak >= 3
    ? `🔥 ${player.streak}`
    : player.streak > 0
    ? `${player.streak}`
    : null;

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${
      submission
        ? 'border-zinc-700 bg-zinc-900/80'
        : 'border-zinc-700 bg-zinc-900 shadow-lg shadow-black/30'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{player.avatarEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-lg leading-tight">{player.name}</span>
            {streakDisplay && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                player.streak >= 7
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}>
                {streakDisplay}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 truncate">{player.archetype}</div>
          {history && <ScoreHistoryDots history={history} />}
        </div>
        {submission && (
          <div className="text-2xl font-black tabular-nums">
            {scoreEmoji(submission.score)}
          </div>
        )}
      </div>

      {submission && !editing ? (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${SUBMITTED_COLORS[submission.score]}`}>
          <div>
            <div className="text-xl font-black tabular-nums">
              {scoreDisplay(submission.score)}
            </div>
            <div className="text-xs opacity-60 mt-0.5 flex items-center gap-1.5">
              <span>
                {submission.score === 'DNP'
                  ? 'Ghost — not playing today'
                  : submission.score === 'X'
                  ? 'Under review 👀'
                  : 'Submitted ✓'}
              </span>
              {submissionOrder && submission.score !== 'DNP' && (
                <span className={`font-semibold ${submissionOrder === 1 ? 'text-yellow-400 opacity-100' : ''}`}>
                  · {ORDER_LABELS[submissionOrder] ?? `${submissionOrder}th in`}
                </span>
              )}
            </div>
          </div>
          {!boardComplete && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
            >
              change
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
              Tap your score
            </div>
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                cancel
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {SCORES.map(score => (
              <button
                key={score}
                onClick={() => handleSubmit(score)}
                className={`
                  rounded-xl py-3 text-sm font-black transition-all duration-150
                  active:scale-95 touch-manipulation select-none
                  ${SCORE_COLORS[score]}
                `}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
