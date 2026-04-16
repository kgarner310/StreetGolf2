'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Submission, Score } from '@/lib/types';
import { DEMO_GROUP, SEED_SUBMISSIONS } from '@/lib/seed';
import { fetchSubmissions, pushSubmission, clearSubmissions } from '@/lib/submissionsApi';

const STORAGE_KEY = 'threadboard_v1';
const DEMO_GROUP_ID = DEMO_GROUP.id;

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getInitialState(): AppState {
  return { group: DEMO_GROUP, submissions: SEED_SUBMISSIONS };
}

interface StoreContextValue {
  state: AppState;
  hydrated: boolean;
  submitScore: (playerId: string, score: Score) => void;
  resetDemo: () => void;
  getTodaySubmissions: () => Submission[];
  getPlayerHistory: (playerId: string, days: number) => Array<{ date: string; score: Score | null }>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  // Today's submissions from server (shared across devices)
  const [todaySubs, setTodaySubs] = useState<Submission[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate streaks from localStorage, then fetch today's subs from server
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        setState({
          group: { ...DEMO_GROUP, players: DEMO_GROUP.players.map(base => {
            const stored = parsed.group?.players?.find(p => p.id === base.id);
            return stored ? { ...base, streak: stored.streak } : base;
          })},
          submissions: parsed.submissions ?? [],
        });
      }
    } catch { /* corrupt storage — start fresh */ }

    // Fetch today from server
    fetchSubmissions(DEMO_GROUP_ID, getTodayDate())
      .then(subs => setTodaySubs(subs))
      .finally(() => setHydrated(true));
  }, []);

  // Poll every 8s to pick up other players' scores
  const syncFromServer = useCallback(async () => {
    const subs = await fetchSubmissions(DEMO_GROUP_ID, getTodayDate());
    setTodaySubs(subs);
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(syncFromServer, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [syncFromServer]);

  // Persist streak/history to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state, hydrated]);

  const submitScore = useCallback(async (playerId: string, score: Score) => {
    const date = getTodayDate();
    const sub: Submission = { playerId, date, score, submittedAt: new Date().toISOString() };

    // Optimistic update + streak
    setTodaySubs(prev => [...prev.filter(s => s.playerId !== playerId), sub]);
    setState(prev => ({
      group: { ...prev.group, players: prev.group.players.map(p =>
        p.id !== playerId ? p : { ...p, streak: score === 'DNP' ? 0 : p.streak + 1 }
      )},
      submissions: [...prev.submissions.filter(s => !(s.playerId === playerId && s.date === date)), sub],
    }));

    // Push to server
    await pushSubmission(DEMO_GROUP_ID, sub);
  }, []);

  const resetDemo = useCallback(async () => {
    setState(getInitialState());
    setTodaySubs([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    await clearSubmissions(DEMO_GROUP_ID, getTodayDate());
  }, []);

  // Merge: server subs for today, localStorage for past days
  const getTodaySubmissions = useCallback(() => todaySubs, [todaySubs]);

  const getPlayerHistory = useCallback(
    (playerId: string, days: number): Array<{ date: string; score: Score | null }> => {
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().split('T')[0];
        const sub = i === 0
          ? todaySubs.find(s => s.playerId === playerId)
          : state.submissions.find(s => s.playerId === playerId && s.date === date);
        result.push({ date, score: sub?.score ?? null });
      }
      return result;
    },
    [todaySubs, state.submissions]
  );

  return (
    <StoreContext.Provider value={{ state, hydrated, submitScore, resetDemo, getTodaySubmissions, getPlayerHistory }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
