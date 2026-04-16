'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Group, Submission, Score } from '@/lib/types';
import { fetchSubmissions, pushSubmission, clearSubmissions } from '@/lib/submissionsApi';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function localHistoryKey(groupId: string) {
  return `tb_hist_${groupId}`;
}

interface GroupBoardState {
  submitScore: (playerId: string, score: Score) => void;
  getTodaySubmissions: () => Submission[];
  getPlayerHistory: (playerId: string, days: number) => Array<{ date: string; score: Score | null }>;
  resetBoard: () => void;
  hydrated: boolean;
}

export function useGroupBoard(group: Group): GroupBoardState {
  // Today's submissions come from the server (shared across all devices)
  const [todaySubs, setTodaySubs] = useState<Submission[]>([]);
  // History (past days) stays in localStorage per device
  const [historySubs, setHistorySubs] = useState<Submission[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localHistoryKey(group.id));
      if (raw) setHistorySubs(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [group.id]);

  // Fetch today's submissions from server
  const syncFromServer = useCallback(async () => {
    const subs = await fetchSubmissions(group.id, getTodayDate());
    setTodaySubs(subs);
  }, [group.id]);

  // Initial fetch + mark hydrated
  useEffect(() => {
    syncFromServer().finally(() => setHydrated(true));
  }, [syncFromServer]);

  // Poll every 8s so everyone sees each other's scores in near real-time
  useEffect(() => {
    pollRef.current = setInterval(syncFromServer, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [syncFromServer]);

  const submitScore = useCallback(async (playerId: string, score: Score) => {
    const date = getTodayDate();
    const sub: Submission = { playerId, date, score, submittedAt: new Date().toISOString() };

    // Optimistic local update so UI feels instant
    setTodaySubs(prev => [...prev.filter(s => s.playerId !== playerId), sub]);

    // Push to server so other players see it
    await pushSubmission(group.id, sub);

    // Save to local history for the 7-day dots
    setHistorySubs(prev => {
      const updated = [...prev.filter(s => !(s.playerId === playerId && s.date === date)), sub];
      try { localStorage.setItem(localHistoryKey(group.id), JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [group.id]);

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
          : historySubs.find(s => s.playerId === playerId && s.date === date);
        result.push({ date, score: sub?.score ?? null });
      }
      return result;
    },
    [todaySubs, historySubs]
  );

  const resetBoard = useCallback(async () => {
    const date = getTodayDate();
    setTodaySubs([]);
    await clearSubmissions(group.id, date);
    // Clear local history too
    try {
      localStorage.removeItem(localHistoryKey(group.id));
      setHistorySubs([]);
    } catch { /* ignore */ }
  }, [group.id]);

  return { submitScore, getTodaySubmissions, getPlayerHistory, resetBoard, hydrated };
}
