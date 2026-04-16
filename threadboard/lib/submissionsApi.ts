import { Submission } from './types';

export async function fetchSubmissions(groupId: string, date: string): Promise<Submission[]> {
  try {
    const res = await fetch(
      `/api/submissions?groupId=${encodeURIComponent(groupId)}&date=${encodeURIComponent(date)}`
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function pushSubmission(groupId: string, submission: Submission): Promise<void> {
  try {
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, submission }),
    });
  } catch {
    // Fire and forget — local state already updated optimistically
  }
}

export async function clearSubmissions(groupId: string, date: string): Promise<void> {
  try {
    await fetch(
      `/api/submissions?groupId=${encodeURIComponent(groupId)}&date=${encodeURIComponent(date)}`,
      { method: 'DELETE' }
    );
  } catch {
    // ignore
  }
}
