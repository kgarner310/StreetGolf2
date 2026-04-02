using System.Collections.Generic;

namespace StreetGolf.Data
{
    /// <summary>
    /// A recorded sequence of shots for ghost overlay replay.
    /// </summary>
    [System.Serializable]
    public class GhostRun
    {
        public List<ShotData> Shots;

        public GhostRun()
        {
            Shots = new List<ShotData>();
        }

        public GhostRun(List<ShotData> shots)
        {
            Shots = shots ?? new List<ShotData>();
        }

        public int ShotCount => Shots.Count;

        public ShotData GetShot(int index)
        {
            if (index < 0 || index >= Shots.Count)
                return default;
            return Shots[index];
        }

        /// <summary>
        /// Create a GhostRun from a ChallengeData payload.
        /// </summary>
        public static GhostRun FromChallenge(ChallengeData challenge)
        {
            if (challenge == null) return null;
            return new GhostRun(new List<ShotData>(challenge.Shots));
        }
    }
}
