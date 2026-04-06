'use client';

import { useStore } from '@/context/StoreContext';

export default function ResetButton() {
  const { resetDemo } = useStore();

  const handleReset = () => {
    if (confirm('Reset demo? This clears all submitted scores and streaks.')) {
      resetDemo();
    }
  };

  return (
    <button
      onClick={handleReset}
      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline"
    >
      Reset Demo
    </button>
  );
}
