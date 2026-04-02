using UnityEngine;
using UnityEngine.Tilemaps;
using StreetGolf.Data;

namespace StreetGolf.Config
{
    /// <summary>
    /// Physics and rendering properties for each terrain type.
    /// Create one asset instance: Assets/_Project/Config/TerrainConfig.asset
    /// </summary>
    [CreateAssetMenu(fileName = "TerrainConfig", menuName = "StreetGolf/Terrain Config")]
    public class TerrainConfigSO : ScriptableObject
    {
        [System.Serializable]
        public struct TerrainProperties
        {
            public TerrainType Type;

            [Tooltip("Velocity multiplier per sim step. Lower = more friction. Road=0.98, Rough=0.93")]
            [Range(0.5f, 1.0f)]
            public float FrictionMultiplier;

            [Tooltip("Velocity multiplier on bounce (buildings). 0 = no bounce.")]
            [Range(0f, 1f)]
            public float BounceRestitution;

            [Tooltip("True if ball cannot pass through (buildings).")]
            public bool BlocksMovement;

            [Tooltip("True if entering this terrain causes a stroke penalty.")]
            public bool IsPenalty;

            [Tooltip("Number of penalty strokes added.")]
            public int PenaltyStrokes;

            [Tooltip("Tile used to render this terrain in the Tilemap.")]
            public TileBase Tile;

            [Tooltip("Color for this terrain (used as tile tint or for procedural tiles).")]
            public Color DisplayColor;
        }

        [Header("Terrain Definitions")]
        public TerrainProperties[] Terrains = new TerrainProperties[]
        {
            new TerrainProperties { Type = TerrainType.Tee,      FrictionMultiplier = 0.97f, BounceRestitution = 0f, BlocksMovement = false, IsPenalty = false, PenaltyStrokes = 0, DisplayColor = new Color(0.6f, 0.85f, 0.5f) },
            new TerrainProperties { Type = TerrainType.Road,     FrictionMultiplier = 0.98f, BounceRestitution = 0f, BlocksMovement = false, IsPenalty = false, PenaltyStrokes = 0, DisplayColor = new Color(0.75f, 0.75f, 0.72f) },
            new TerrainProperties { Type = TerrainType.Rough,    FrictionMultiplier = 0.93f, BounceRestitution = 0f, BlocksMovement = false, IsPenalty = false, PenaltyStrokes = 0, DisplayColor = new Color(0.45f, 0.65f, 0.35f) },
            new TerrainProperties { Type = TerrainType.Sand,     FrictionMultiplier = 0.85f, BounceRestitution = 0f, BlocksMovement = false, IsPenalty = false, PenaltyStrokes = 0, DisplayColor = new Color(0.9f, 0.85f, 0.6f) },
            new TerrainProperties { Type = TerrainType.Water,    FrictionMultiplier = 0.90f, BounceRestitution = 0f, BlocksMovement = false, IsPenalty = true,  PenaltyStrokes = 1, DisplayColor = new Color(0.3f, 0.55f, 0.85f) },
            new TerrainProperties { Type = TerrainType.Building, FrictionMultiplier = 1.00f, BounceRestitution = 0.6f, BlocksMovement = true, IsPenalty = false, PenaltyStrokes = 0, DisplayColor = new Color(0.55f, 0.45f, 0.4f) },
            new TerrainProperties { Type = TerrainType.Green,    FrictionMultiplier = 0.985f, BounceRestitution = 0f, BlocksMovement = false, IsPenalty = false, PenaltyStrokes = 0, DisplayColor = new Color(0.35f, 0.8f, 0.4f) },
        };

        /// <summary>
        /// Look up properties for a terrain type. Returns Road properties as fallback.
        /// </summary>
        public TerrainProperties GetProperties(TerrainType type)
        {
            for (int i = 0; i < Terrains.Length; i++)
            {
                if (Terrains[i].Type == type)
                    return Terrains[i];
            }
            // Fallback to Road
            return Terrains.Length > 1 ? Terrains[1] : default;
        }
    }
}
