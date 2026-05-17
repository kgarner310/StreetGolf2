'use client';

import { Title, Player } from '@/lib/types';

interface TitlesListProps {
  titles: Title[];
  players: Player[];
}

export default function TitlesList({ titles, players }: TitlesListProps) {
  if (titles.length === 0) return null;

  return (
    <div className="space-y-2">
      {titles.map((title, i) => {
        const player = players.find(p => p.id === title.playerId);
        if (!player) return null;
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-4 py-2.5"
          >
            <span className="text-xl w-7 text-center">{title.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-zinc-400 text-sm">{title.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{player.avatarEmoji}</span>
              <span className="text-white font-semibold text-sm">{player.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
