namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Checks if a shot resulted in the ball sinking into the hole.
    /// Thin wrapper — the actual detection logic is in BallSimulation.
    /// </summary>
    public static class HoleDetector
    {
        /// <summary>
        /// Returns true if the simulation result indicates the ball is in the hole.
        /// </summary>
        public static bool IsBallInHole(BallSimulation.SimResult simResult)
        {
            return simResult.Sunk;
        }
    }
}
