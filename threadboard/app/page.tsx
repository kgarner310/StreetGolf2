import Link from 'next/link';
import CreateGroupForm from '@/components/CreateGroupForm';

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

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="max-w-sm w-full space-y-8">

          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="text-5xl">🏆</div>
            <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
              Your group chat already has the game.
            </h1>
            <p className="text-lg text-indigo-400 font-semibold">
              We make the show.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Tap your Wordle score. See the rankings. Share the Board.
            </p>
          </div>

          {/* Create group — primary CTA */}
          <CreateGroupForm />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">or try the demo</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Demo group link */}
          <Link
            href="/groups/demo-family/today"
            className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-2xl py-4 text-sm transition-colors active:scale-95 touch-manipulation border border-zinc-700"
          >
            View Demo Group (Jim, Brenda, Ted, Nancy)
          </Link>

          {/* How it works */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              How it works
            </div>
            {[
              { emoji: '✏️', text: 'Enter your group name and player names' },
              { emoji: '🔗', text: 'Get a link — paste it into your group chat' },
              { emoji: '👆', text: 'Each person taps their score' },
              { emoji: '🏆', text: 'Board auto-generates when everyone is in' },
              { emoji: '📤', text: 'Copy & paste the result back into chat' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-7 text-center">{item.emoji}</span>
                <span className="text-zinc-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>

        </div>
      </main>

      <footer className="border-t border-zinc-800 py-4 text-center">
        <p className="text-zinc-600 text-xs">Threadboard — small ESPN for your Wordle group</p>
      </footer>
    </div>
  );
}
