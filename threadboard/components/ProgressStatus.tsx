'use client';

interface ProgressStatusProps {
  submitted: number;
  total: number;
}

export default function ProgressStatus({ submitted, total }: ProgressStatusProps) {
  const pct = total === 0 ? 0 : (submitted / total) * 100;
  const complete = submitted === total;

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${
      complete
        ? 'border-emerald-700/60 bg-emerald-900/10'
        : 'border-zinc-700/60 bg-zinc-900'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className={`text-sm font-bold ${complete ? 'text-emerald-400' : 'text-zinc-200'}`}>
            {complete ? 'All scores in' : 'Waiting on scores'}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {complete
              ? 'Board is ready'
              : `${total - submitted} player${total - submitted === 1 ? '' : 's'} remaining`}
          </div>
        </div>
        <div className={`text-2xl font-black tabular-nums ${complete ? 'text-emerald-400' : 'text-zinc-400'}`}>
          {submitted}<span className="text-zinc-600 font-normal text-base">/{total}</span>
        </div>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            complete ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
