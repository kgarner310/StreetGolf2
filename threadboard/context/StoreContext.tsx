'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, Group, Submission, Score } from '@/lib/types';
import { DEMO_GROUP, SEED_SUBMISSIONS } from '@/lib/seed';

const STORAGE_KEY = 'threadboard_v1';

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getInitialState(): AppState {
  return {
    group: DEMO_GROUP,
    submissions: SEED_SUBMISSIONS,
  };
}

interface StoreContextValue {
  state: AppState;
  hydrated: boolean;
  submitScore: (playerId: string, score: Score) => void;
  resetDemo: () => void;
  getTodaySubmissions: () => Submission[];
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        // Merge stored submissions with current group def (keep archetype/emoji fresh)
        setState({
          group: { ...DEMO_GROUP, players: DEMO_GROUP.players.map(basePlayer => {
            const stored = parsed.group?.players?.find(p => p.id === basePlayer.id);
            return stored ? { ...basePlayer, streak: stored.streak } : basePlayer;
          })},
          submissions: parsed.submissions ?? [],
        });
      }
    } catch {
      // Corrupt storage — start fresh
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever state changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota exceeded or unavailable — ignore
    }
  }, [state, hydrated]);

  const submitScore = useCallback((playerId: string, score: Score) => {
    const date = getTodayDate();
    setState(prev => {
      // Remove any existing submission for this player today
      const filtered = prev.submissions.filter(
        s => !(s.playerId === playerId && s.date === date)
      );

      // Update streak: DNP resets, valid score increments
      const updatedPlayers = prev.group.players.map(p => {
        if (p.id !== playerId) return p;
        const newStreak = score === 'DNP' ? 0 : p.streak + 1;
        return { ...p, streak: newStreak };
      });

      return {
        group: { ...prev.group, players: updatedPlayers },
        submissions: [
          ...filtered,
          { playerId, date, score, submittedAt: new Date().toISOString() },
        ],
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = getInitialState();
    setState(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const getTodaySubmissions = useCallback((): Submission[] => {
    const today = getTodayDate();
    return state.submissions.filter(s => s.date === today);
  }, [state.submissions]);

  return (
    <StoreContext.Provider value={{ state, hydrated, submitScore, resetDemo, getTodaySubmissions }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
