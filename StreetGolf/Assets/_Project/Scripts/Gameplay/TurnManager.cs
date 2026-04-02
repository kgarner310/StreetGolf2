using System;
using System.Collections.Generic;
using UnityEngine;
using StreetGolf.Core;
using StreetGolf.Data;
using StreetGolf.Config;
using StreetGolf.HoleGen;
using StreetGolf.Input;
using StreetGolf.Rendering;
using StreetGolf.Ghost;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Orchestrates the entire gameplay loop in GameScene.
    /// State machine: Aiming -> Shooting -> Resolving -> (Aiming or Complete)
    /// </summary>
    public class TurnManager : MonoBehaviour
    {
        public enum GameState
        {
            Initializing,
            Aiming,
            Shooting,
            Resolving,
            Complete
        }

        /// <summary>Current game state.</summary>
        public GameState State { get; private set; } = GameState.Initializing;

        /// <summary>Fires when the hole is completed.</summary>
        public event Action<HoleResult> OnHoleComplete;

        /// <summary>Fires on state change.</summary>
        public event Action<GameState> OnStateChanged;

        /// <summary>Fires when a penalty occurs (for UI display).</summary>
        public event Action<string> OnPenalty;

        [Header("References — assigned by GameScene setup")]
        [SerializeField] private BallController _ball;
        [SerializeField] private PlayerInputHandler _input;
        [SerializeField] private TilemapBuilder _tilemapBuilder;
        [SerializeField] private CameraController _cameraController;

        [Header("Config — assign in Inspector")]
        [SerializeField] private TerrainConfigSO _terrainConfig;
        [SerializeField] private BallConfigSO _ballConfig;
        [SerializeField] private DifficultyConfigSO _difficultyConfig;

        // Gameplay components (created at runtime)
        private AimController _aim;
        private ShotExecutor _shotExecutor;
        private StrokeCounter _strokeCounter;
        private GhostRecorder _ghostRecorder;
        private GhostPlayer _ghostPlayer;
        private HoleData _holeData;
        private List<ShotData> _playerShots;

        /// <summary>Stroke counter for UI binding.</summary>
        public StrokeCounter Strokes => _strokeCounter;

        /// <summary>Current hole data.</summary>
        public HoleData Hole => _holeData;

        private void Start()
        {
            InitializeGame();
        }

        private void InitializeGame()
        {
            var gm = GameManager.Instance;

            // Generate the hole
            _holeData = HoleGenerator.Generate(gm.CurrentSeed, _difficultyConfig);

            // Render the hole
            _tilemapBuilder.BuildTilemap(_holeData, _terrainConfig);

            // Initialize gameplay systems
            _strokeCounter = new StrokeCounter();
            _playerShots = new List<ShotData>();

            // Set up aim controller
            _aim = gameObject.AddComponent<AimController>();
            _aim.Initialize(_input, _ballConfig);

            // Set up shot executor
            _shotExecutor = gameObject.AddComponent<ShotExecutor>();
            _shotExecutor.Initialize(_aim, _ball, _holeData, _terrainConfig, _ballConfig);

            // Set up ghost systems
            _ghostRecorder = new GhostRecorder();
            if (gm.CurrentGhostRun != null && gm.CurrentGhostRun.ShotCount > 0)
            {
                // Create ghost player if we have ghost data
                var ghostBallGO = new GameObject("GhostBall");
                var ghostView = ghostBallGO.AddComponent<GhostBallView>();
                ghostView.Initialize();
                var ghostBallCtrl = ghostBallGO.AddComponent<BallController>();
                _ghostPlayer = new GhostPlayer(
                    gm.CurrentGhostRun, ghostBallCtrl, _holeData, _terrainConfig, _ballConfig);
            }

            // Position ball at tee
            Vector2 teeWorld = (Vector2)_holeData.TeePos + Vector2.one * 0.5f;
            _ball.SetPosition(teeWorld);

            // Set up camera
            _cameraController.SetHoleBounds(
                new Rect(0, 0, _holeData.Width, _holeData.Height));
            _cameraController.FrameHole();

            // Subscribe to events
            _shotExecutor.OnShotFired += HandleShotFired;
            _shotExecutor.OnShotResolved += HandleShotResolved;

            // Enter aiming state
            SetState(GameState.Aiming);
        }

        private void SetState(GameState newState)
        {
            State = newState;
            OnStateChanged?.Invoke(newState);

            switch (newState)
            {
                case GameState.Aiming:
                    _aim.SetAimEnabled(true);
                    _input.SetInputEnabled(true);
                    break;
                case GameState.Shooting:
                    _aim.SetAimEnabled(false);
                    _input.SetInputEnabled(false);
                    break;
                case GameState.Resolving:
                    break;
                case GameState.Complete:
                    _aim.SetAimEnabled(false);
                    _input.SetInputEnabled(false);
                    CompleteHole();
                    break;
            }
        }

        private void HandleShotFired(ShotData shot, BallSimulation.SimResult simResult)
        {
            SetState(GameState.Shooting);

            // Count the stroke
            _strokeCounter.AddStroke();

            // Record for ghost replay
            _ghostRecorder.RecordShot(shot);

            // Store for result
            _playerShots.Add(shot);

            // Play ghost shot in parallel
            _ghostPlayer?.PlayNextShot();

            // Camera follows ball
            _cameraController.FollowBall(_ball.transform);
        }

        private void HandleShotResolved(ShotData shot, BallSimulation.SimResult simResult)
        {
            SetState(GameState.Resolving);

            // Check for penalties
            var hazard = HazardHandler.Evaluate(simResult);
            if (hazard.IsPenalty)
            {
                _strokeCounter.AddPenalty(hazard.PenaltyStrokes);
                OnPenalty?.Invoke(hazard.PenaltyMessage);
            }

            // Check if ball is in the hole
            if (HoleDetector.IsBallInHole(simResult))
            {
                SetState(GameState.Complete);
                return;
            }

            // Check max strokes
            if (_strokeCounter.Count >= _ballConfig.MaxStrokes)
            {
                SetState(GameState.Complete);
                return;
            }

            // Back to aiming
            SetState(GameState.Aiming);
        }

        private void CompleteHole()
        {
            var gm = GameManager.Instance;
            var result = new HoleResult
            {
                Seed = _holeData.Seed,
                Par = _holeData.Par,
                Strokes = _strokeCounter.Count,
                PlayerShots = new List<ShotData>(_playerShots),
                IsChallenge = gm.CurrentChallenge != null,
                OpponentData = gm.CurrentChallenge
            };

            OnHoleComplete?.Invoke(result);

            // Short delay then transition to result
            StartCoroutine(DelayedResult(result));
        }

        private System.Collections.IEnumerator DelayedResult(HoleResult result)
        {
            yield return new WaitForSeconds(1.5f);
            GameManager.Instance.ShowResult(result);
        }

        private void OnDestroy()
        {
            if (_shotExecutor != null)
            {
                _shotExecutor.OnShotFired -= HandleShotFired;
                _shotExecutor.OnShotResolved -= HandleShotResolved;
            }
        }
    }
}
