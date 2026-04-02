using StreetGolf.Data;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Determines penalty outcomes from shot simulation results.
    /// Pure logic — no MonoBehaviour.
    /// </summary>
    public static class HazardHandler
    {
        /// <summary>
        /// Result of evaluating a shot for hazard penalties.
        /// </summary>
        public struct HazardResult
        {
            public bool IsPenalty;
            public int PenaltyStrokes;
            public string PenaltyMessage; // e.g., "Water Hazard!" for UI display
        }

        /// <summary>
        /// Evaluate the simulation result for any penalties.
        /// </summary>
        public static HazardResult Evaluate(BallSimulation.SimResult simResult)
        {
            if (simResult.HitWater)
            {
                return new HazardResult
                {
                    IsPenalty = true,
                    PenaltyStrokes = 1,
                    PenaltyMessage = "Water Hazard!"
                };
            }

            if (simResult.WentOOB)
            {
                return new HazardResult
                {
                    IsPenalty = true,
                    PenaltyStrokes = 1,
                    PenaltyMessage = "Out of Bounds!"
                };
            }

            return new HazardResult
            {
                IsPenalty = false,
                PenaltyStrokes = 0,
                PenaltyMessage = null
            };
        }
    }
}
