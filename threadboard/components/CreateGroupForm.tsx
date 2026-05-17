'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { encodeGroup } from '@/lib/groupConfig';

export default function CreateGroupForm() {
  const [groupName, setGroupName] = useState('');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const router = useRouter();

  const addPlayer = () => {
    if (playerNames.length < 6) setPlayerNames(prev => [...prev, '']);
  };

  const removePlayer = (i: number) => {
    if (playerNames.length > 2) setPlayerNames(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateName = (i: number, val: string) => {
    setPlayerNames(prev => prev.map((n, idx) => (idx === i ? val : n)));
  };

  const handleCreate = () => {
    const validPlayers = playerNames.map(n => n.trim()).filter(Boolean);
    const name = groupName.trim() || 'My Group';
    if (validPlayers.length < 2) return;
    const encoded = encodeGroup(name, validPlayers);
    router.push(`/g/${encoded}`);
  };

  const validCount = playerNames.filter(n => n.trim()).length;
  const canCreate = validCount >= 2;

  return (
    <div className="rounded-2xl border border-indigo-800/60 bg-indigo-950/30 p-5 space-y-4">
      <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
        Create Your Group
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Group name</label>
        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="The Family, Wordle Crew, Office Gang…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-400 block">Players (2–6)</label>
        {playerNames.map((name, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={name}
              onChange={e => updateName(i, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={`Player ${i + 1}`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {playerNames.length > 2 && (
              <button
                onClick={() => removePlayer(i)}
                className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors text-lg"
                aria-label="Remove player"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {playerNames.length < 6 && (
          <button
            onClick={addPlayer}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
          >
            + Add player
          </button>
        )}
      </div>

      <button
        onClick={handleCreate}
        disabled={!canCreate}
        className={`
          w-full rounded-2xl py-4 font-bold text-base transition-all
          touch-manipulation select-none
          ${canCreate
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }
        `}
      >
        {canCreate ? 'Create Group & Get Link →' : 'Add at least 2 players'}
      </button>
    </div>
  );
}
