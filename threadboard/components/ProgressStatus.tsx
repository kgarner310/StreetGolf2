'use client';

interface ProgressStatusProps {
  submitted: number;
  total: number;
}

export default function ProgressStatus({ submitted, total }: ProgressStatusProps) {
  const pct = total === 0 ? 0 : (submitted / total) * 100;
  const complete = submitted === total;

  return (
    <div className={`rounded-xl border p-3 ${complete ? 'border-emerald-700 bg-emerald-900/20' : 'border-zinc-700 bg-zinc-900'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-300">
          {complete ? '✅ All in — Board ready' : `${submitted} of ${total} players reported`}
        </span>
        <span className={`text-xs font-bold ${complete ? 'text-emerald-400' : 'text-zinc-500'}`}>
          {submitted}/{total}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${complete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
