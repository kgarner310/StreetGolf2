using System.Collections.Generic;

namespace StreetGolf.Data
{
    /// <summary>
    /// Serializable challenge payload — everything needed to replay
    /// an opponent's run on the same hole.
    /// </summary>
    [System.Serializable]
    public class ChallengeData
    {
        public uint Seed;
        public int Par;
        public int Strokes;
        public List<ShotData> Shots;

        public ChallengeData()
        {
            Shots = new List<ShotData>();
        }

        public ChallengeData(uint seed, int par, int strokes, List<ShotData> shots)
        {
            Seed = seed;
            Par = par;
            Strokes = strokes;
            Shots = shots ?? new List<ShotData>();
        }
    }
}
