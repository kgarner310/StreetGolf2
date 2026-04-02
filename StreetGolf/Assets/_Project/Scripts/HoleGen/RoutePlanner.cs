using System.Collections.Generic;
using UnityEngine;
using StreetGolf.Config;

namespace StreetGolf.HoleGen
{
    /// <summary>
    /// Places tee and hole positions, generates waypoints for the fair path.
    /// The fair path is the "intended" route through the hole — Road terrain
    /// is carved along this path to create the main fairway.
    /// </summary>
    public static class RoutePlanner
    {
        /// <summary>
        /// Plan a route from tee to hole through randomized waypoints.
        /// Returns a list of points: [teePos, waypoint1, waypoint2, ..., holePos]
        /// </summary>
        public static List<Vector2Int> PlanRoute(
            int gridWidth, int gridHeight,
            DifficultyConfigSO config, SeededRandom rng,
            out Vector2Int teePos, out Vector2Int holePos)
        {
            int margin = 3;
            int centerX = gridWidth / 2;

            // Tee: bottom area, slightly randomized around center
            teePos = new Vector2Int(
                rng.Range(centerX - 3, centerX + 4),
                rng.Range(margin, margin + 3)
            );

            // Hole: top area, slightly randomized
            holePos = new Vector2Int(
                rng.Range(centerX - 4, centerX + 5),
                rng.Range(gridHeight - margin - 3, gridHeight - margin)
            );

            // Generate waypoints between tee and hole
            int waypointCount = rng.Range(config.MinWaypoints, config.MaxWaypoints + 1);
            var route = new List<Vector2Int>(waypointCount + 2);
            route.Add(teePos);

            float yStep = (float)(holePos.y - teePos.y) / (waypointCount + 1);

            for (int i = 1; i <= waypointCount; i++)
            {
                int wpY = Mathf.RoundToInt(teePos.y + yStep * i);
                int spreadX = config.WaypointSpreadX;
                int wpX = rng.Range(
                    Mathf.Max(margin, centerX - spreadX),
                    Mathf.Min(gridWidth - margin, centerX + spreadX + 1)
                );

                // Clamp to grid bounds
                wpX = Mathf.Clamp(wpX, margin, gridWidth - margin - 1);
                wpY = Mathf.Clamp(wpY, margin, gridHeight - margin - 1);

                route.Add(new Vector2Int(wpX, wpY));
            }

            route.Add(holePos);
            return route;
        }

        /// <summary>
        /// Carve Road terrain along the route using widened Bresenham lines.
        /// </summary>
        public static void CarvePathOnGrid(
            Data.TerrainType[,] grid, int gridWidth, int gridHeight,
            List<Vector2Int> route, int pathWidth)
        {
            for (int seg = 0; seg < route.Count - 1; seg++)
            {
                Vector2Int from = route[seg];
                Vector2Int to = route[seg + 1];
                CarveLine(grid, gridWidth, gridHeight, from, to, pathWidth);
            }
        }

        /// <summary>
        /// Bresenham line with width — carves Road cells.
        /// </summary>
        private static void CarveLine(
            Data.TerrainType[,] grid, int gridWidth, int gridHeight,
            Vector2Int from, Vector2Int to, int width)
        {
            int halfW = width / 2;

            int x0 = from.x, y0 = from.y;
            int x1 = to.x, y1 = to.y;
            int dx = Mathf.Abs(x1 - x0);
            int dy = -Mathf.Abs(y1 - y0);
            int sx = x0 < x1 ? 1 : -1;
            int sy = y0 < y1 ? 1 : -1;
            int err = dx + dy;

            while (true)
            {
                // Fill a square of Road cells around the line point
                for (int ox = -halfW; ox <= halfW; ox++)
                {
                    for (int oy = -halfW; oy <= halfW; oy++)
                    {
                        int cx = x0 + ox;
                        int cy = y0 + oy;
                        if (cx >= 0 && cx < gridWidth && cy >= 0 && cy < gridHeight)
                        {
                            grid[cx, cy] = Data.TerrainType.Road;
                        }
                    }
                }

                if (x0 == x1 && y0 == y1) break;
                int e2 = 2 * err;
                if (e2 >= dy) { err += dy; x0 += sx; }
                if (e2 <= dx) { err += dx; y0 += sy; }
            }
        }
    }
}
