import { Group, Submission } from './types';

export const DEMO_GROUP: Group = {
  id: 'demo-family',
  name: 'The Family',
  slug: 'demo-family',
  players: [
    {
      id: 'dad',
      name: 'Jim',
      archetype: 'Steady Hand',
      avatarEmoji: '👨',
      streak: 5,
    },
    {
      id: 'mom',
      name: 'Brenda',
      archetype: 'Quiet Assassin',
      avatarEmoji: '👩',
      streak: 7,
    },
    {
      id: 'ted',
      name: 'Ted',
      archetype: 'Edge Walker',
      avatarEmoji: '🧒',
      streak: 2,
    },
    {
      id: 'nancy',
      name: 'Nancy',
      archetype: 'Cold-Blooded',
      avatarEmoji: '👧',
      streak: 12,
    },
  ],
};

// No pre-seeded submissions for today — fresh demo start
export const SEED_SUBMISSIONS: Submission[] = [];
