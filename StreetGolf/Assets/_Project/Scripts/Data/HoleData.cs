using UnityEngine;

namespace StreetGolf.Data
{
    /// <summary>
    /// Complete description of a generated hole.
    /// Produced by HoleGenerator, consumed by rendering and gameplay systems.
    /// </summary>
    public class HoleData
    {
        public uint Seed;
        public int Width;
        public int Height;
        public TerrainType[,] Grid; // [x, y] — column-major
        public Vector2Int TeePos;
        public Vector2Int HolePos;
        public int Par;

        /// <summary>
        /// Safe cell lookup — returns Road for out-of-bounds (treated as OOB by hazard handler).
        /// </summary>
        public TerrainType GetTerrain(int x, int y)
        {
            if (x < 0 || x >= Width || y < 0 || y >= Height)
                return TerrainType.Rough; // OOB treated as rough (penalty handled separately)
            return Grid[x, y];
        }

        /// <summary>
        /// Get terrain at a world position (cells are 1x1 units).
        /// </summary>
        public TerrainType GetTerrainAtWorld(Vector2 worldPos)
        {
            int x = Mathf.FloorToInt(worldPos.x);
            int y = Mathf.FloorToInt(worldPos.y);
            return GetTerrain(x, y);
        }

        /// <summary>
        /// Check if a world position is within the grid bounds.
        /// </summary>
        public bool IsInBounds(Vector2 worldPos)
        {
            int x = Mathf.FloorToInt(worldPos.x);
            int y = Mathf.FloorToInt(worldPos.y);
            return x >= 0 && x < Width && y >= 0 && y < Height;
        }
    }
}
