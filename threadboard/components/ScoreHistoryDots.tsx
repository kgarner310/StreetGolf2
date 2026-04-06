'use client';

import { Score } from '@/lib/types';

interface DayResult {
  date: string;
  score: Score | null;
}

interface ScoreHistoryDotsProps {
  history: DayResult[]; // oldest → newest
}

const DOT_COLORS: Record<Score, string> = {
  '2': 'bg-emerald-400',
  '3': 'bg-green-500',
  '4': 'bg-yellow-400',
  '5': 'bg-orange-400',
  '6': 'bg-red-500',
  'X': 'bg-zinc-500',
  'DNP': 'bg-zinc-700',
};

const DOT_LABELS: Record<Score, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', 'X': 'X', 'DNP': '-',
};

export default function ScoreHistoryDots({ history }: ScoreHistoryDotsProps) {
  // Only show if there's at least one past day with data (exclude today = last item)
  const pastDays = history.slice(0, -1);
  const hasAnyHistory = pastDays.some(d => d.score !== null);
  if (!hasAnyHistory) return null;

  return (
    <div className="flex gap-1 mt-2">
      {history.map((day, i) => {
        const isToday = i === history.length - 1;
        if (day.score === null) {
          return (
            <div
              key={day.date}
              className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold ${
                isToday ? 'bg-zinc-800 border border-zinc-600' : 'bg-zinc-900'
              }`}
              title={isToday ? 'Today' : day.date}
            >
              <span className="text-zinc-700 text-xs">·</span>
            </div>
          );
        }
        return (
          <div
            key={day.date}
            className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold ${DOT_COLORS[day.score]} ${
              isToday ? 'ring-1 ring-white/30' : ''
            }`}
            title={`${day.date}: ${day.score}`}
          >
            <span className="text-black/70 text-xs leading-none">{DOT_LABELS[day.score]}</span>
          </div>
        );
      })}
    </div>
  );
}
