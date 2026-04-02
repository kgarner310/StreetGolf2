using System;
using UnityEngine;
using StreetGolf.Data;
using StreetGolf.Config;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Bridges aim input to ball simulation.
    /// On aim complete: runs the simulation, creates a ShotData record,
    /// and tells BallController to animate the trajectory.
    /// </summary>
    public class ShotExecutor : MonoBehaviour
    {
        /// <summary>Fires when a shot simulation is complete and animation has started.</summary>
        public event Action<ShotData, BallSimulation.SimResult> OnShotFired;

        /// <summary>Fires when the ball animation finishes (ball has stopped).</summary>
        public event Action<ShotData, BallSimulation.SimResult> OnShotResolved;

        private AimController _aim;
        private BallController _ball;
        private HoleData _hole;
        private TerrainConfigSO _terrainConfig;
        private BallConfigSO _ballConfig;
        private ShotData _currentShot;

        public void Initialize(
            AimController aim,
            BallController ball,
            HoleData hole,
            TerrainConfigSO terrainConfig,
            BallConfigSO ballConfig)
        {
            _aim = aim;
            _ball = ball;
            _hole = hole;
            _terrainConfig = terrainConfig;
            _ballConfig = ballConfig;

            _aim.OnAimComplete += HandleAimComplete;
            _ball.OnShotAnimationComplete += HandleAnimationComplete;
        }

        private void HandleAimComplete(float angle, float power)
        {
            Vector2 startPos = _ball.Position;

            // Build ShotData
            _currentShot = new ShotData
            {
                Angle = angle,
                Power = power,
                StartPos = startPos
            };

            // Compute velocity
            Vector2 velocity = _currentShot.GetVelocity(_ballConfig.MaxPower);

            // Run deterministic simulation
            var simResult = BallSimulation.Simulate(
                startPos, velocity, _hole, _terrainConfig, _ballConfig);

            // Record the end position
            _currentShot.EndPos = simResult.FinalPosition;
            _currentShot.WasPenalty = simResult.HitWater || simResult.WentOOB;

            // Fire event and start animation
            OnShotFired?.Invoke(_currentShot, simResult);

            // Animate the ball along the trajectory
            _ball.PlayTrajectory(simResult);
        }

        private void HandleAnimationComplete(BallSimulation.SimResult simResult)
        {
            // If there was a penalty, reset ball to the safe position
            if (simResult.HitWater || simResult.WentOOB)
            {
                _ball.SetPosition(simResult.ResetPosition);
            }

            OnShotResolved?.Invoke(_currentShot, simResult);
        }

        private void OnDestroy()
        {
            if (_aim != null)
                _aim.OnAimComplete -= HandleAimComplete;
            if (_ball != null)
                _ball.OnShotAnimationComplete -= HandleAnimationComplete;
        }
    }
}
