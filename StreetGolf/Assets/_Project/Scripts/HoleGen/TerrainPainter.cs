using UnityEngine;
using StreetGolf.Data;
using StreetGolf.Config;

namespace StreetGolf.HoleGen
{
    /// <summary>
    /// Fills the hole grid with base terrain types.
    /// Called after RoutePlanner carves the fair path.
    /// Adds Green around hole, Tee at start.
    /// </summary>
    public static class TerrainPainter
    {
        /// <summary>
        /// Paint base terrain: Rough everywhere, then Green around hole, Tee at start.
        /// Road is already carved by RoutePlanner.
        /// </summary>
        public static void PaintBaseTerrain(
            TerrainType[,] grid, int width, int height,
            Vector2Int teePos, Vector2Int holePos,
            DifficultyConfigSO config)
        {
            // Paint Green circle around hole
            PaintCircle(grid, width, height, holePos, config.GreenRadius, TerrainType.Green);

            // Paint Tee circle at start
            PaintCircle(grid, width, height, teePos, config.TeeRadius, TerrainType.Tee);
        }

        /// <summary>
        /// Fill entire grid with Rough as the default terrain.
        /// </summary>
        public static void FillWithRough(TerrainType[,] grid, int width, int height)
        {
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    grid[x, y] = TerrainType.Rough;
                }
            }
        }

        /// <summary>
        /// Paint a filled circle of terrain at a position.
        /// </summary>
        private static void PaintCircle(
            TerrainType[,] grid, int gridWidth, int gridHeight,
            Vector2Int center, int radius, TerrainType terrain)
        {
            int rSq = radius * radius;
            for (int x = center.x - radius; x <= center.x + radius; x++)
            {
                for (int y = center.y - radius; y <= center.y + radius; y++)
                {
                    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
                    int dx = x - center.x;
                    int dy = y - center.y;
                    if (dx * dx + dy * dy <= rSq)
                    {
                        grid[x, y] = terrain;
                    }
                }
            }
        }
    }
}
