using System;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Tracks stroke count for the current hole.
    /// Pure C# — no MonoBehaviour.
    /// </summary>
    public class StrokeCounter
    {
        /// <summary>Current total strokes (shots + penalties).</summary>
        public int Count { get; private set; }

        /// <summary>Fires whenever the count changes.</summary>
        public event Action<int> OnCountChanged;

        public StrokeCounter()
        {
            Count = 0;
        }

        /// <summary>Add one stroke (called on each shot).</summary>
        public void AddStroke()
        {
            Count++;
            OnCountChanged?.Invoke(Count);
        }

        /// <summary>Add penalty strokes (water, OOB).</summary>
        public void AddPenalty(int penaltyStrokes)
        {
            Count += penaltyStrokes;
            OnCountChanged?.Invoke(Count);
        }

        /// <summary>Reset to zero for a new hole.</summary>
        public void Reset()
        {
            Count = 0;
            OnCountChanged?.Invoke(Count);
        }
    }
}
