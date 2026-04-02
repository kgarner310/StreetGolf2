using System.Collections.Generic;
using StreetGolf.Data;

namespace StreetGolf.Ghost
{
    /// <summary>
    /// Records each shot during gameplay to produce a GhostRun.
    /// Used to build the challenge payload for sharing.
    /// </summary>
    public class GhostRecorder
    {
        private readonly List<ShotData> _shots = new List<ShotData>();

        /// <summary>Record a shot.</summary>
        public void RecordShot(ShotData shot)
        {
            _shots.Add(shot);
        }

        /// <summary>Get the recorded ghost run.</summary>
        public GhostRun GetGhostRun()
        {
            return new GhostRun(new List<ShotData>(_shots));
        }

        /// <summary>Reset for a new hole.</summary>
        public void Reset()
        {
            _shots.Clear();
        }
    }
}
