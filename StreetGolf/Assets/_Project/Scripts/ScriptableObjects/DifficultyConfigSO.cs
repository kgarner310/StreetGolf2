using UnityEngine;

namespace StreetGolf.Config
{
    /// <summary>
    /// Hole generation tuning parameters.
    /// Create one asset instance: Assets/_Project/Config/DifficultyConfig.asset
    /// </summary>
    [CreateAssetMenu(fileName = "DifficultyConfig", menuName = "StreetGolf/Difficulty Config")]
    public class DifficultyConfigSO : ScriptableObject
    {
        [Header("Grid Size")]
        [Tooltip("Grid width in cells for a par-3 hole.")]
        public int GridWidthPar3 = 24;

        [Tooltip("Grid height in cells for a par-3 hole.")]
        public int GridHeightPar3 = 36;

        [Tooltip("Grid width in cells for a par-4 hole.")]
        public int GridWidthPar4 = 28;

        [Tooltip("Grid height in cells for a par-4 hole.")]
        public int GridHeightPar4 = 48;

        [Header("Route")]
        [Tooltip("Minimum width of the fair path (Road cells).")]
        [Range(2, 6)]
        public int FairPathWidth = 3;

        [Tooltip("Number of random waypoints between tee and hole.")]
        [Range(1, 5)]
        public int MinWaypoints = 2;

        [Tooltip("Maximum waypoints.")]
        [Range(2, 6)]
        public int MaxWaypoints = 4;

        [Tooltip("Maximum horizontal deviation of waypoints from center (in cells).")]
        public int WaypointSpreadX = 8;

        [Header("Hazards")]
        [Tooltip("Fraction of non-path cells that become building clusters.")]
        [Range(0f, 0.3f)]
        public float BuildingDensity = 0.08f;

        [Tooltip("Fraction of non-path cells that become water hazards.")]
        [Range(0f, 0.2f)]
        public float WaterDensity = 0.05f;

        [Tooltip("Fraction of near-path cells that become sand traps.")]
        [Range(0f, 0.15f)]
        public float SandDensity = 0.04f;

        [Tooltip("Min cells in a building cluster.")]
        public int BuildingClusterMin = 2;

        [Tooltip("Max cells in a building cluster.")]
        public int BuildingClusterMax = 6;

        [Tooltip("Min cells in a water hazard.")]
        public int WaterHazardMin = 3;

        [Tooltip("Max cells in a water hazard.")]
        public int WaterHazardMax = 8;

        [Header("Green")]
        [Tooltip("Radius of the putting green around the hole (cells).")]
        public int GreenRadius = 3;

        [Tooltip("Radius of the tee box (cells).")]
        public int TeeRadius = 2;

        [Header("Par")]
        [Tooltip("Straight-line distance threshold: below this = par 3, above = par 4.")]
        public float Par3MaxDistance = 25f;
    }
}
