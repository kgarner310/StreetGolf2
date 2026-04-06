'use client';

import { useState, useEffect, useCallback } from 'react';
import { Group, Submission, Score } from '@/lib/types';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

interface GroupBoardState {
  submitScore: (playerId: string, score: Score) => void;
  getTodaySubmissions: () => Submission[];
  resetBoard: () => void;
  hydrated: boolean;
}

export function useGroupBoard(group: Group): GroupBoardState {
  const key = `tb_${group.id}`;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setSubmissions(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(submissions));
    } catch { /* ignore */ }
  }, [submissions, hydrated, key]);

  const submitScore = useCallback((playerId: string, score: Score) => {
    const date = getTodayDate();
    setSubmissions(prev => {
      const filtered = prev.filter(s => !(s.playerId === playerId && s.date === date));
      return [...filtered, { playerId, date, score, submittedAt: new Date().toISOString() }];
    });
  }, []);

  const getTodaySubmissions = useCallback((): Submission[] => {
    const today = getTodayDate();
    return submissions.filter(s => s.date === today);
  }, [submissions]);

  const resetBoard = useCallback(() => {
    setSubmissions([]);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }, [key]);

  return { submitScore, getTodaySubmissions, resetBoard, hydrated };
}
