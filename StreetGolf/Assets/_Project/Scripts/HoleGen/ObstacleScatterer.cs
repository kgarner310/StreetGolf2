using System.Collections.Generic;
using UnityEngine;
using StreetGolf.Data;
using StreetGolf.Config;

namespace StreetGolf.HoleGen
{
    /// <summary>
    /// Scatters buildings, water, and sand hazards on non-path cells.
    /// Creates risk/reward shortcuts by placing hazards that force interesting routing.
    /// </summary>
    public static class ObstacleScatterer
    {
        /// <summary>
        /// Place all obstacles on the grid. Call after RoutePlanner and TerrainPainter.
        /// </summary>
        public static void ScatterObstacles(
            TerrainType[,] grid, int width, int height,
            List<Vector2Int> fairPath,
            DifficultyConfigSO config, SeededRandom rng)
        {
            // Build a set of "protected" cells (on or near the fair path) that we won't fully block
            var protectedCells = BuildProtectedSet(grid, width, height, fairPath, config.FairPathWidth);

            // Place building clusters
            int buildingBudget = Mathf.RoundToInt(width * height * config.BuildingDensity);
            PlaceBuildingClusters(grid, width, height, protectedCells, config, rng, buildingBudget);

            // Place water hazards
            int waterBudget = Mathf.RoundToInt(width * height * config.WaterDensity);
            PlaceWaterHazards(grid, width, height, protectedCells, rng, config, waterBudget);

            // Place sand traps (these CAN go near the path — they're not blockers)
            int sandBudget = Mathf.RoundToInt(width * height * config.SandDensity);
            PlaceSandTraps(grid, width, height, fairPath, rng, config, sandBudget);
        }

        private static HashSet<Vector2Int> BuildProtectedSet(
            TerrainType[,] grid, int width, int height,
            List<Vector2Int> fairPath, int pathWidth)
        {
            var protectedSet = new HashSet<Vector2Int>();
            int protect = pathWidth + 1; // extra margin beyond path width

            foreach (var point in fairPath)
            {
                for (int ox = -protect; ox <= protect; ox++)
                {
                    for (int oy = -protect; oy <= protect; oy++)
                    {
                        int x = point.x + ox;
                        int y = point.y + oy;
                        if (x >= 0 && x < width && y >= 0 && y < height)
                            protectedSet.Add(new Vector2Int(x, y));
                    }
                }
            }

            // Also protect Tee and Green areas
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (grid[x, y] == TerrainType.Tee || grid[x, y] == TerrainType.Green)
                        protectedSet.Add(new Vector2Int(x, y));
                }
            }

            return protectedSet;
        }

        private static void PlaceBuildingClusters(
            TerrainType[,] grid, int width, int height,
            HashSet<Vector2Int> protectedCells,
            DifficultyConfigSO config, SeededRandom rng, int budget)
        {
            int placed = 0;
            int attempts = 0;
            int maxAttempts = budget * 10;

            while (placed < budget && attempts < maxAttempts)
            {
                attempts++;
                int cx = rng.Range(2, width - 2);
                int cy = rng.Range(2, height - 2);
                var origin = new Vector2Int(cx, cy);

                if (protectedCells.Contains(origin)) continue;
                if (grid[cx, cy] != TerrainType.Rough) continue;

                // Grow a cluster from this seed point
                int clusterSize = rng.Range(config.BuildingClusterMin, config.BuildingClusterMax + 1);
                var cluster = GrowCluster(cx, cy, clusterSize, width, height, protectedCells, grid, rng);

                foreach (var cell in cluster)
                {
                    grid[cell.x, cell.y] = TerrainType.Building;
                    placed++;
                }
            }
        }

        private static List<Vector2Int> GrowCluster(
            int startX, int startY, int size,
            int gridWidth, int gridHeight,
            HashSet<Vector2Int> protectedCells,
            TerrainType[,] grid, SeededRandom rng)
        {
            var cluster = new List<Vector2Int>();
            var candidates = new List<Vector2Int> { new Vector2Int(startX, startY) };

            while (cluster.Count < size && candidates.Count > 0)
            {
                int idx = rng.Range(0, candidates.Count);
                var cell = candidates[idx];
                candidates.RemoveAt(idx);

                if (protectedCells.Contains(cell)) continue;
                if (cell.x < 1 || cell.x >= gridWidth - 1 || cell.y < 1 || cell.y >= gridHeight - 1) continue;
                if (grid[cell.x, cell.y] != TerrainType.Rough) continue;

                cluster.Add(cell);

                // Add neighbors as candidates
                candidates.Add(new Vector2Int(cell.x + 1, cell.y));
                candidates.Add(new Vector2Int(cell.x - 1, cell.y));
                candidates.Add(new Vector2Int(cell.x, cell.y + 1));
                candidates.Add(new Vector2Int(cell.x, cell.y - 1));
            }

            return cluster;
        }

        private static void PlaceWaterHazards(
            TerrainType[,] grid, int width, int height,
            HashSet<Vector2Int> protectedCells,
            SeededRandom rng, DifficultyConfigSO config, int budget)
        {
            int placed = 0;
            int attempts = 0;
            int maxAttempts = budget * 10;

            while (placed < budget && attempts < maxAttempts)
            {
                attempts++;
                int cx = rng.Range(2, width - 2);
                int cy = rng.Range(2, height - 2);

                if (protectedCells.Contains(new Vector2Int(cx, cy))) continue;
                if (grid[cx, cy] != TerrainType.Rough) continue;

                // Water hazards are elongated (wider than tall, or vice versa)
                int hazardSize = rng.Range(config.WaterHazardMin, config.WaterHazardMax + 1);
                bool horizontal = rng.Chance(0.5f);
                int w = horizontal ? rng.Range(2, 5) : rng.Range(1, 3);
                int h = horizontal ? rng.Range(1, 3) : rng.Range(2, 5);

                int cellsPlaced = 0;
                for (int ox = 0; ox < w && cellsPlaced < hazardSize; ox++)
                {
                    for (int oy = 0; oy < h && cellsPlaced < hazardSize; oy++)
                    {
                        int x = cx + ox;
                        int y = cy + oy;
                        if (x >= width || y >= height) continue;
                        if (protectedCells.Contains(new Vector2Int(x, y))) continue;
                        if (grid[x, y] != TerrainType.Rough) continue;

                        grid[x, y] = TerrainType.Water;
                        cellsPlaced++;
                        placed++;
                    }
                }
            }
        }

        private static void PlaceSandTraps(
            TerrainType[,] grid, int width, int height,
            List<Vector2Int> fairPath,
            SeededRandom rng, DifficultyConfigSO config, int budget)
        {
            int placed = 0;
            int attempts = 0;
            int maxAttempts = budget * 10;

            while (placed < budget && attempts < maxAttempts)
            {
                attempts++;

                // Sand traps go near the fair path to create risk
                var pathPoint = fairPath[rng.Range(0, fairPath.Count)];
                int offsetX = rng.Range(-6, 7);
                int offsetY = rng.Range(-3, 4);
                int x = pathPoint.x + offsetX;
                int y = pathPoint.y + offsetY;

                if (x < 0 || x >= width || y < 0 || y >= height) continue;
                if (grid[x, y] != TerrainType.Rough && grid[x, y] != TerrainType.Road) continue;

                // Don't place sand on Tee, Green, Building, or Water
                if (grid[x, y] == TerrainType.Tee || grid[x, y] == TerrainType.Green) continue;

                // Small sand cluster
                int sandSize = rng.Range(2, 4);
                for (int s = 0; s < sandSize && placed < budget; s++)
                {
                    int sx = x + rng.Range(-1, 2);
                    int sy = y + rng.Range(-1, 2);
                    if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
                    var terrain = grid[sx, sy];
                    if (terrain == TerrainType.Rough || terrain == TerrainType.Road)
                    {
                        grid[sx, sy] = TerrainType.Sand;
                        placed++;
                    }
                }
            }
        }
    }
}
