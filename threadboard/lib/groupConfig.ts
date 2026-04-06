import { Group, Player } from './types';

const ARCHETYPES = [
  'Steady Hand',
  'Quiet Assassin',
  'Edge Walker',
  'Cold-Blooded',
  'Wild Card',
  'Dark Horse',
];

const AVATAR_EMOJIS = ['🧑', '👤', '🙋', '🧍', '🤷', '🙆'];

interface GroupConfigEncoded {
  n: string;   // group name
  p: string[]; // player names
}

export function encodeGroup(groupName: string, playerNames: string[]): string {
  const cfg: GroupConfigEncoded = { n: groupName, p: playerNames };
  // URL-safe base64
  return btoa(JSON.stringify(cfg))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function decodeGroup(encoded: string): Group | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const cfg: GroupConfigEncoded = JSON.parse(atob(b64));
    if (!cfg.n || !Array.isArray(cfg.p) || cfg.p.length < 2) return null;

    const players: Player[] = cfg.p.map((name, i) => ({
      id: `p${i}_${name.toLowerCase().replace(/\s+/g, '')}`,
      name: name.trim(),
      archetype: ARCHETYPES[i % ARCHETYPES.length],
      avatarEmoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
      streak: 0,
    }));

    return {
      id: `g_${encoded.slice(0, 16)}`,
      name: cfg.n,
      slug: encoded,
      players,
    };
  } catch {
    return null;
  }
}
