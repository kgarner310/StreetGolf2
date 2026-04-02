using System.Collections.Generic;
using UnityEngine;
using StreetGolf.Data;
using StreetGolf.Config;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Pure C# ball physics simulation. No MonoBehaviour, no Rigidbody.
    /// Fully deterministic — given the same inputs, produces identical results.
    /// Uses fixed-step Euler integration with terrain-dependent friction.
    /// </summary>
    public static class BallSimulation
    {
        /// <summary>
        /// Result of simulating one shot to completion (ball stops or hits hazard).
        /// </summary>
        public class SimResult
        {
            public List<Vector2> Trajectory;
            public Vector2 FinalPosition;
            public float Duration;
            public bool Sunk;           // ball went in the hole
            public bool HitWater;       // ball landed in water
            public bool WentOOB;        // ball went out of bounds
            public Vector2 ResetPosition; // where to place ball after penalty
        }

        /// <summary>
        /// Simulate a shot from startPos with given velocity until the ball stops.
        /// Records trajectory points at each simulation step.
        /// </summary>
        public static SimResult Simulate(
            Vector2 startPos,
            Vector2 velocity,
            HoleData hole,
            TerrainConfigSO terrainConfig,
            BallConfigSO ballConfig)
        {
            var result = new SimResult
            {
                Trajectory = new List<Vector2>(256),
                ResetPosition = startPos
            };

            Vector2 pos = startPos;
            Vector2 vel = velocity;
            float dt = ballConfig.SimTimeStep;
            float stopThreshSq = ballConfig.StopThreshold * ballConfig.StopThreshold;
            Vector2 lastValidPos = startPos; // last position on non-penalty terrain
            int steps = 0;

            result.Trajectory.Add(pos);

            while (steps < ballConfig.MaxSimSteps)
            {
                steps++;

                // Check hole detection BEFORE moving
                Vector2 toHole = (Vector2)hole.HolePos + Vector2.one * 0.5f - pos;
                float distToHoleSq = toHole.sqrMagnitude;
                float holeRadSq = ballConfig.HoleRadius * ballConfig.HoleRadius;

                if (distToHoleSq < holeRadSq && vel.sqrMagnitude < ballConfig.HoleSinkSpeed * ballConfig.HoleSinkSpeed)
                {
                    // Ball sinks into hole
                    result.Sunk = true;
                    result.FinalPosition = (Vector2)hole.HolePos + Vector2.one * 0.5f;
                    result.Trajectory.Add(result.FinalPosition);
                    result.Duration = steps * dt;
                    return result;
                }

                // Move ball
                Vector2 newPos = pos + vel * dt;

                // Check bounds
                if (!hole.IsInBounds(newPos))
                {
                    result.WentOOB = true;
                    result.FinalPosition = lastValidPos;
                    result.ResetPosition = lastValidPos;
                    result.Trajectory.Add(pos);
                    result.Duration = steps * dt;
                    return result;
                }

                // Get terrain at new position
                TerrainType terrain = hole.GetTerrainAtWorld(newPos);
                var props = terrainConfig.GetProperties(terrain);

                // Building collision: bounce
                if (props.BlocksMovement)
                {
                    vel = ResolveBounce(pos, vel, newPos, hole, terrainConfig);
                    vel *= props.BounceRestitution;
                    // Don't move — stay at current pos, just reverse velocity
                    result.Trajectory.Add(pos);
                }
                else
                {
                    // Water hazard
                    if (props.IsPenalty && terrain == TerrainType.Water)
                    {
                        result.HitWater = true;
                        result.FinalPosition = lastValidPos;
                        result.ResetPosition = lastValidPos;
                        result.Trajectory.Add(newPos);
                        result.Duration = steps * dt;
                        return result;
                    }

                    // Normal movement
                    pos = newPos;
                    result.Trajectory.Add(pos);

                    // Track last valid (non-penalty) position
                    if (!props.IsPenalty)
                        lastValidPos = pos;

                    // Apply friction
                    float friction = ballConfig.BaseFriction * props.FrictionMultiplier;
                    vel *= friction;
                }

                // Check if ball stopped
                if (vel.sqrMagnitude < stopThreshSq)
                {
                    result.FinalPosition = pos;
                    result.Duration = steps * dt;
                    return result;
                }
            }

            // Safety: max steps reached
            result.FinalPosition = pos;
            result.Duration = steps * dt;
            return result;
        }

        /// <summary>
        /// Simple bounce resolution: determine which axis to reflect.
        /// </summary>
        private static Vector2 ResolveBounce(
            Vector2 currentPos, Vector2 velocity,
            Vector2 hitPos, HoleData hole, TerrainConfigSO terrainConfig)
        {
            // Check which direction is blocked
            int cx = Mathf.FloorToInt(currentPos.x);
            int cy = Mathf.FloorToInt(currentPos.y);
            int hx = Mathf.FloorToInt(hitPos.x);
            int hy = Mathf.FloorToInt(hitPos.y);

            bool blockedX = false;
            bool blockedY = false;

            // Check horizontal neighbor
            if (hx != cx)
            {
                var terrainX = hole.GetTerrain(hx, cy);
                blockedX = terrainConfig.GetProperties(terrainX).BlocksMovement;
            }

            // Check vertical neighbor
            if (hy != cy)
            {
                var terrainY = hole.GetTerrain(cx, hy);
                blockedY = terrainConfig.GetProperties(terrainY).BlocksMovement;
            }

            Vector2 newVel = velocity;
            if (blockedX) newVel.x = -newVel.x;
            if (blockedY) newVel.y = -newVel.y;
            if (!blockedX && !blockedY)
            {
                // Corner hit — reflect both
                newVel = -newVel;
            }

            return newVel;
        }
    }
}
