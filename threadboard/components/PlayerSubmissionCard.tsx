'use client';

import { useState } from 'react';
import { Score, Player, Submission } from '@/lib/types';
import { scoreDisplay, scoreEmoji } from '@/lib/board';
import ScoreHistoryDots from './ScoreHistoryDots';

const MAIN_SCORES: Score[] = ['2', '3', '4', '5', '6'];
const ALT_SCORES: Score[] = ['X', 'DNP'];

const SCORE_LABELS: Record<Score, string> = {
  '2': 'Brilliant',
  '3': 'Great',
  '4': 'Solid',
  '5': 'Tough',
  '6': 'Survived',
  'X': 'Failed',
  'DNP': 'Sat out',
};

const SCORE_BUTTON_COLORS: Record<Score, string> = {
  '2': 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white',
  '3': 'bg-green-500 hover:bg-green-400 active:bg-green-600 text-white',
  '4': 'bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-zinc-900',
  '5': 'bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white',
  '6': 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
  'X': 'bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white',
  'DNP': 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300',
};

const SUBMITTED_COLORS: Record<Score, string> = {
  '2': 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  '3': 'border-green-500/50 bg-green-500/10 text-green-400',
  '4': 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  '5': 'border-orange-500/50 bg-orange-500/10 text-orange-400',
  '6': 'border-red-600/50 bg-red-600/10 text-red-400',
  'X': 'border-zinc-600/50 bg-zinc-800/50 text-zinc-400',
  'DNP': 'border-zinc-700/50 bg-zinc-900/50 text-zinc-500',
};

const CARD_ACCENT: Record<Score, string> = {
  '2': 'border-l-emerald-500',
  '3': 'border-l-green-500',
  '4': 'border-l-yellow-500',
  '5': 'border-l-orange-500',
  '6': 'border-l-red-600',
  'X': 'border-l-zinc-600',
  'DNP': 'border-l-zinc-700',
};

const ORDER_LABELS: Record<number, string> = { 1: '1st in ⚡', 2: '2nd in', 3: '3rd in', 4: '4th in' };

interface PlayerSubmissionCardProps {
  player: Player;
  submission: Submission | null;
  onSubmit: (score: Score) => void;
  boardComplete: boolean;
  history?: Array<{ date: string; score: Score | null }>;
  submissionOrder?: number;
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

  const streakDisplay = player.streak >= 7
    ? `🔥🔥 ${player.streak}`
    : player.streak >= 3
    ? `🔥 ${player.streak}`
    : player.streak > 0
    ? `${player.streak}`
    : null;

  const cardBorder = submission
    ? `border-zinc-700/60 bg-zinc-900/80 border-l-4 ${CARD_ACCENT[submission.score]}`
    : 'border-indigo-500/20 bg-zinc-900 shadow-lg shadow-black/40 ring-1 ring-inset ring-indigo-500/10';

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${cardBorder}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{player.avatarEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-lg leading-tight">{player.name}</span>
            {streakDisplay && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                player.streak >= 7 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
                {streakDisplay}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 truncate">{player.archetype}</div>
          {history && <ScoreHistoryDots history={history} />}
        </div>
        {submission && (
          <div className="text-2xl">{scoreEmoji(submission.score)}</div>
        )}
      </div>

      {submission && !editing ? (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${SUBMITTED_COLORS[submission.score]}`}>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums">{scoreDisplay(submission.score)}</span>
              <span className="text-sm font-semibold opacity-80">{SCORE_LABELS[submission.score]}</span>
            </div>
            <div className="text-xs opacity-50 mt-0.5 flex items-center gap-1.5">
              <span>
                {submission.score === 'DNP'
                  ? 'Not playing today'
                  : submission.score === 'X'
                  ? 'Under review 👀'
                  : 'Logged ✓'}
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
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline ml-4 shrink-0"
            >
              change
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">
              Select your score
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
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2">
              {MAIN_SCORES.map(score => (
                <button
                  key={score}
                  onClick={() => handleSubmit(score)}
                  className={`
                    rounded-xl py-3 flex flex-col items-center gap-0.5
                    transition-all duration-150 active:scale-95 touch-manipulation select-none
                    ${SCORE_BUTTON_COLORS[score]}
                  `}
                >
                  <span className="text-base font-black leading-none">{score}</span>
                  <span className="text-[10px] font-medium opacity-70 leading-none">{SCORE_LABELS[score]}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALT_SCORES.map(score => (
                <button
                  key={score}
                  onClick={() => handleSubmit(score)}
                  className={`
                    rounded-xl py-2.5 flex items-center justify-center gap-2
                    transition-all duration-150 active:scale-95 touch-manipulation select-none
                    ${SCORE_BUTTON_COLORS[score]}
                  `}
                >
                  <span className="text-sm font-black">{score}</span>
                  <span className="text-xs font-medium opacity-70">{SCORE_LABELS[score]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
