using StreetGolf.Data;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Manages hole lifecycle transitions based on persistence_score.
    ///
    /// Rules:
    ///   persistence_score &lt;  -2  →  Expired
    ///   persistence_score &gt;   3  →  Sticky
    ///   persistence_score &gt;   6  →  Recurring
    ///   otherwise             →  Active
    ///
    /// Higher thresholds take priority (Recurring beats Sticky).
    /// </summary>
    public static class HoleLifecycle
    {
        /// <summary>
        /// Recomputes and assigns hole.Status from hole.PersistenceScore.
        /// Call this after every vote.
        /// </summary>
        public static void UpdateHoleLifecycle(HoleData hole)
        {
            if (hole.PersistenceScore < -2)
                hole.Status = HoleLifecycleStatus.Expired;
            else if (hole.PersistenceScore > 6)
                hole.Status = HoleLifecycleStatus.Recurring;
            else if (hole.PersistenceScore > 3)
                hole.Status = HoleLifecycleStatus.Sticky;
            else
                hole.Status = HoleLifecycleStatus.Active;
        }

        /// <summary>
        /// Records a vote (delta = +1 upvote, -1 downvote) and updates the lifecycle status.
        /// </summary>
        public static void Vote(HoleData hole, int delta)
        {
            hole.PersistenceScore += delta;
            UpdateHoleLifecycle(hole);
        }
    }
}
