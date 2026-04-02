using System.Collections.Generic;
using UnityEngine;
using StreetGolf.Data;
using StreetGolf.Config;

namespace StreetGolf.HoleGen
{
    /// <summary>
    /// Top-level hole generation orchestrator.
    /// Takes a seed and config, returns a complete HoleData.
    /// Fully deterministic — same seed always produces the same hole.
    /// </summary>
    public static class HoleGenerator
    {
        /// <summary>
        /// Generate a complete hole from a seed.
        /// </summary>
        public static HoleData Generate(uint seed, DifficultyConfigSO config)
        {
            var rng = new SeededRandom(seed);

            // Determine par based on random roll (weighted toward par 3 for MVP)
            bool isPar4 = rng.Chance(0.35f);
            int width = isPar4 ? config.GridWidthPar4 : config.GridWidthPar3;
            int height = isPar4 ? config.GridHeightPar4 : config.GridHeightPar3;

            // Allocate grid and fill with default terrain (Rough)
            var grid = new TerrainType[width, height];
            TerrainPainter.FillWithRough(grid, width, height);

            // Plan the route: tee, waypoints, hole
            List<Vector2Int> route = RoutePlanner.PlanRoute(
                width, height, config, rng,
                out Vector2Int teePos, out Vector2Int holePos);

            // Carve Road along the fair path
            RoutePlanner.CarvePathOnGrid(grid, width, height, route, config.FairPathWidth);

            // Paint Green around hole, Tee at start
            TerrainPainter.PaintBaseTerrain(grid, width, height, teePos, holePos, config);

            // Scatter obstacles (buildings, water, sand)
            ObstacleScatterer.ScatterObstacles(grid, width, height, route, config, rng);

            // Validate: ensure a path exists from tee to hole
            // If validation fails, regenerate obstacles with a new attempt
            int validationAttempts = 0;
            while (!ValidatePath(grid, width, height, teePos, holePos) && validationAttempts < 5)
            {
                validationAttempts++;
                // Reset non-path terrain and re-scatter
                ResetObstacles(grid, width, height);
                RoutePlanner.CarvePathOnGrid(grid, width, height, route, config.FairPathWidth);
                TerrainPainter.PaintBaseTerrain(grid, width, height, teePos, holePos, config);
                ObstacleScatterer.ScatterObstacles(grid, width, height, route, config, rng);
            }

            // Calculate par from actual distance
            float distance = Vector2Int.Distance(teePos, holePos);
            int par = distance <= config.Par3MaxDistance ? 3 : 4;

            return new HoleData
            {
                Seed = seed,
                Width = width,
                Height = height,
                Grid = grid,
                TeePos = teePos,
                HolePos = holePos,
                Par = par
            };
        }

        /// <summary>
        /// BFS validation: can a ball reach the hole from the tee
        /// walking only on non-Building, non-Water cells?
        /// </summary>
        private static bool ValidatePath(
            TerrainType[,] grid, int width, int height,
            Vector2Int start, Vector2Int end)
        {
            var visited = new bool[width, height];
            var queue = new Queue<Vector2Int>();
            queue.Enqueue(start);
            visited[start.x, start.y] = true;

            int[] dx = { 0, 0, 1, -1 };
            int[] dy = { 1, -1, 0, 0 };

            while (queue.Count > 0)
            {
                var pos = queue.Dequeue();
                if (pos == end) return true;

                for (int i = 0; i < 4; i++)
                {
                    int nx = pos.x + dx[i];
                    int ny = pos.y + dy[i];

                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    if (visited[nx, ny]) continue;

                    var terrain = grid[nx, ny];
                    if (terrain == TerrainType.Building) continue;
                    // Water is traversable for validation (ball just gets a penalty)
                    // but let's ensure there's a non-water path too
                    if (terrain == TerrainType.Water) continue;

                    visited[nx, ny] = true;
                    queue.Enqueue(new Vector2Int(nx, ny));
                }
            }

            return false;
        }

        /// <summary>
        /// Reset all Building, Water, Sand cells back to Rough for re-generation.
        /// </summary>
        private static void ResetObstacles(TerrainType[,] grid, int width, int height)
        {
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    var t = grid[x, y];
                    if (t == TerrainType.Building || t == TerrainType.Water || t == TerrainType.Sand)
                    {
                        grid[x, y] = TerrainType.Rough;
                    }
                }
            }
        }
    }
}
