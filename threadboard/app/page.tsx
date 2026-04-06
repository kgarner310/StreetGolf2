import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-white text-xl tracking-tight">Threadboard</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
              Your group chat already has the game.
            </h1>
            <p className="text-xl text-indigo-400 font-semibold">
              We make the show.
            </p>
            <p className="text-zinc-400 text-base leading-relaxed">
              Tap your Wordle score. See where everyone landed.
              Get roasted (lightly). Share the Board.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href="/groups/demo-family"
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl py-4 text-center text-lg transition-colors active:scale-95 touch-manipulation"
            >
              View Demo Group →
            </Link>
            <Link
              href="/groups/demo-family/today"
              className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-2xl py-4 text-center text-base transition-colors active:scale-95 touch-manipulation border border-zinc-700"
            >
              Submit Today&apos;s Scores
            </Link>
          </div>

          {/* How it works */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">How it works</div>
            {[
              { emoji: '👆', text: 'Tap your score — takes 2 seconds' },
              { emoji: '⏳', text: 'Board fills in as others submit' },
              { emoji: '🏆', text: 'Auto-generated Board when all are in' },
              { emoji: '📤', text: 'Copy & paste back into group chat' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{item.emoji}</span>
                <span className="text-zinc-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Players preview */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">Demo Group: The Family</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { emoji: '👨', name: 'Dad', archetype: 'Steady Hand' },
                { emoji: '👩', name: 'Mom', archetype: 'Quiet Assassin' },
                { emoji: '🧒', name: 'Ted', archetype: 'Edge Walker' },
                { emoji: '👧', name: 'Nancy', archetype: 'Cold-Blooded' },
              ].map(p => (
                <div key={p.name} className="flex items-center gap-2 rounded-xl bg-zinc-800/60 px-3 py-2">
                  <span className="text-xl">{p.emoji}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{p.name}</div>
                    <div className="text-zinc-500 text-xs">{p.archetype}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-4 text-center">
        <p className="text-zinc-600 text-xs">Threadboard — small ESPN for family Wordle</p>
      </footer>
    </div>
  );
}
