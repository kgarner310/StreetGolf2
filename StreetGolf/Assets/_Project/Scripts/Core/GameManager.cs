using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using StreetGolf.Data;

namespace StreetGolf.Core
{
    /// <summary>
    /// Manages scene flow and carries session data between scenes.
    /// Lives on a DontDestroyOnLoad GameObject, auto-created on first access.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        private static GameManager _instance;

        public static GameManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("[GameManager]");
                    _instance = go.AddComponent<GameManager>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        // --- Session state passed between scenes ---

        /// <summary>Current hole seed.</summary>
        public uint CurrentSeed { get; private set; }

        /// <summary>
        /// Backend hole ID when playing the daily hole; 0 when playing a random or challenge hole.
        /// Used by ResultUI to decide whether to show the vote panel.
        /// </summary>
        public int DailyHoleId { get; private set; }

        /// <summary>Ghost run data from a challenge (null if playing solo).</summary>
        public GhostRun CurrentGhostRun { get; private set; }

        /// <summary>Challenge data from opponent (null if playing solo).</summary>
        public ChallengeData CurrentChallenge { get; private set; }

        /// <summary>Result of the last completed hole (set before loading ResultScene).</summary>
        public HoleResult LastResult { get; private set; }

        // --- Scene names ---
        private const string TitleSceneName = "TitleScene";
        private const string GameSceneName = "GameScene";
        private const string ResultSceneName = "ResultScene";

        // --- Fade transition ---
        private CanvasGroup _fadeOverlay;
        private const float FadeDuration = 0.3f;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);
        }

        /// <summary>
        /// Generate a random seed and start a new solo game.
        /// </summary>
        public void PlayNewHole()
        {
            CurrentSeed = (uint)Random.Range(1, int.MaxValue);
            DailyHoleId = 0;
            CurrentGhostRun = null;
            CurrentChallenge = null;
            LoadScene(GameSceneName);
        }

        /// <summary>
        /// Play the daily hole fetched from the backend.
        /// The seed is derived from the hole ID so generation is deterministic.
        /// </summary>
        public void PlayDailyHole(int holeId)
        {
            // Knuth multiplicative hash — spreads sequential IDs into varied seeds
            CurrentSeed = (uint)holeId * 2654435761u;
            if (CurrentSeed == 0) CurrentSeed = 1;
            DailyHoleId = holeId;
            CurrentGhostRun = null;
            CurrentChallenge = null;
            LoadScene(GameSceneName);
        }

        /// <summary>
        /// Play a specific seed (solo, no ghost).
        /// </summary>
        public void PlaySeed(uint seed)
        {
            CurrentSeed = seed;
            DailyHoleId = 0;
            CurrentGhostRun = null;
            CurrentChallenge = null;
            LoadScene(GameSceneName);
        }

        /// <summary>
        /// Play a challenge — same hole with ghost overlay from opponent.
        /// </summary>
        public void PlayChallenge(ChallengeData challenge)
        {
            CurrentSeed = challenge.Seed;
            DailyHoleId = 0;
            CurrentChallenge = challenge;
            CurrentGhostRun = GhostRun.FromChallenge(challenge);
            LoadScene(GameSceneName);
        }

        /// <summary>
        /// Replay the same hole (retry).
        /// </summary>
        public void ReplayCurrentHole()
        {
            // Keep same seed, clear ghost for a fresh attempt (or keep it for re-challenge)
            LoadScene(GameSceneName);
        }

        /// <summary>
        /// Go to results screen after completing a hole.
        /// </summary>
        public void ShowResult(HoleResult result)
        {
            LastResult = result;
            LoadScene(ResultSceneName);
        }

        /// <summary>
        /// Return to the title screen.
        /// </summary>
        public void GoToTitle()
        {
            CurrentGhostRun = null;
            CurrentChallenge = null;
            LastResult = null;
            LoadScene(TitleSceneName);
        }

        private void LoadScene(string sceneName)
        {
            StartCoroutine(LoadSceneRoutine(sceneName));
        }

        private IEnumerator LoadSceneRoutine(string sceneName)
        {
            // Simple scene load — fade overlay can be added later for polish
            AsyncOperation op = SceneManager.LoadSceneAsync(sceneName);
            if (op != null)
            {
                while (!op.isDone)
                    yield return null;
            }
        }
    }

    /// <summary>
    /// Result of completing a hole. Passed to ResultScene for display.
    /// </summary>
    [System.Serializable]
    public class HoleResult
    {
        public uint Seed;
        public int Par;
        public int Strokes;
        public List<ShotData> PlayerShots;
        public bool IsChallenge;
        public ChallengeData OpponentData;

        public string ScoreName
        {
            get
            {
                if (Strokes == 1) return "Hole in One!";
                int diff = Strokes - Par;
                return diff switch
                {
                    <= -3 => "Albatross",
                    -2 => "Eagle",
                    -1 => "Birdie",
                    0 => "Par",
                    1 => "Bogey",
                    2 => "Double Bogey",
                    3 => "Triple Bogey",
                    _ => $"+{diff}"
                };
            }
        }

        /// <summary>
        /// Build a ChallengeData from this result for sharing.
        /// </summary>
        public ChallengeData ToChallengeData()
        {
            return new ChallengeData(Seed, Par, Strokes, PlayerShots);
        }
    }
}
