using UnityEngine;
using StreetGolf.Data;
using StreetGolf.Config;
using StreetGolf.Gameplay;

namespace StreetGolf.Ghost
{
    /// <summary>
    /// Replays ghost shots alongside the live player.
    /// After each player shot, the ghost plays its corresponding shot.
    /// </summary>
    public class GhostPlayer
    {
        private readonly GhostRun _ghostRun;
        private readonly BallController _ghostBall;
        private readonly HoleData _hole;
        private readonly TerrainConfigSO _terrainConfig;
        private readonly BallConfigSO _ballConfig;
        private int _currentShotIndex;

        public GhostPlayer(
            GhostRun ghostRun,
            BallController ghostBall,
            HoleData hole,
            TerrainConfigSO terrainConfig,
            BallConfigSO ballConfig)
        {
            _ghostRun = ghostRun;
            _ghostBall = ghostBall;
            _hole = hole;
            _terrainConfig = terrainConfig;
            _ballConfig = ballConfig;
            _currentShotIndex = 0;

            // Position ghost ball at tee
            if (_ghostRun.ShotCount > 0)
            {
                _ghostBall.SetPosition(_ghostRun.Shots[0].StartPos);
            }
        }

        /// <summary>
        /// Play the next ghost shot. Called after each player shot resolves.
        /// </summary>
        public void PlayNextShot()
        {
            if (_currentShotIndex >= _ghostRun.ShotCount) return;

            ShotData shot = _ghostRun.GetShot(_currentShotIndex);
            Vector2 velocity = shot.GetVelocity(_ballConfig.MaxPower);

            var simResult = BallSimulation.Simulate(
                shot.StartPos, velocity, _hole, _terrainConfig, _ballConfig);

            _ghostBall.PlayTrajectory(simResult);
            _currentShotIndex++;
        }

        /// <summary>Has the ghost finished all its shots?</summary>
        public bool IsComplete => _currentShotIndex >= _ghostRun.ShotCount;
    }
}
