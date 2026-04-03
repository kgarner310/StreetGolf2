using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StreetGolf.Core;
using StreetGolf.Data;
using StreetGolf.Network;

namespace StreetGolf.UI
{
    /// <summary>
    /// Result screen UI. Displays score, par comparison, and action buttons.
    /// When the completed hole was the daily hole, also shows a thumbs up/down
    /// vote panel that submits to the backend.
    /// </summary>
    public class ResultUI : MonoBehaviour
    {
        [Header("Score Display")]
        [SerializeField] private TMP_Text _scoreNameText;
        [SerializeField] private TMP_Text _strokesText;
        [SerializeField] private TMP_Text _parText;
        [SerializeField] private TMP_Text _seedText;

        [Header("Challenge Comparison")]
        [SerializeField] private GameObject _challengePanel;
        [SerializeField] private TMP_Text _opponentStrokesText;
        [SerializeField] private TMP_Text _resultCompareText;

        [Header("Daily Hole Vote")]
        [SerializeField] private GameObject _votePanel;
        [SerializeField] private Button _thumbsUpButton;
        [SerializeField] private Button _thumbsDownButton;
        [SerializeField] private TMP_Text _voteStatusText;

        [Header("Buttons")]
        [SerializeField] private Button _retryButton;
        [SerializeField] private Button _newHoleButton;
        [SerializeField] private Button _shareButton;
        [SerializeField] private Button _mainMenuButton;

        private void Start()
        {
            var gm = GameManager.Instance;
            var result = gm.LastResult;

            if (result == null)
            {
                Debug.LogWarning("ResultUI: No result data found!");
                return;
            }

            // Score display
            if (_scoreNameText != null) _scoreNameText.text = result.ScoreName;
            if (_strokesText != null)   _strokesText.text = $"{result.Strokes}";
            if (_parText != null)       _parText.text = $"PAR {result.Par}";
            if (_seedText != null)      _seedText.text = ChallengeCodec.EncodeSeed(result.Seed);

            // Challenge comparison
            if (_challengePanel != null)
            {
                bool showChallenge = result.IsChallenge && result.OpponentData != null;
                _challengePanel.SetActive(showChallenge);

                if (showChallenge)
                {
                    if (_opponentStrokesText != null)
                        _opponentStrokesText.text = $"Opponent: {result.OpponentData.Strokes}";

                    if (_resultCompareText != null)
                    {
                        int diff = result.Strokes - result.OpponentData.Strokes;
                        _resultCompareText.text = diff < 0 ? $"You win by {-diff}!"
                                                : diff > 0 ? $"Opponent wins by {diff}"
                                                           : "It's a tie!";
                    }
                }
            }

            // Vote panel — only for daily holes
            if (_votePanel != null)
            {
                bool isDailyHole = gm.DailyHoleId > 0;
                _votePanel.SetActive(isDailyHole);

                if (isDailyHole)
                {
                    if (_thumbsUpButton != null)
                        _thumbsUpButton.onClick.AddListener(() => OnVoteClicked("up"));
                    if (_thumbsDownButton != null)
                        _thumbsDownButton.onClick.AddListener(() => OnVoteClicked("down"));
                    SetVoteStatus("How was this hole?");
                }
            }

            // Buttons
            if (_retryButton != null)    _retryButton.onClick.AddListener(OnRetryClicked);
            if (_newHoleButton != null)  _newHoleButton.onClick.AddListener(OnNewHoleClicked);
            if (_shareButton != null)    _shareButton.onClick.AddListener(OnShareClicked);
            if (_mainMenuButton != null) _mainMenuButton.onClick.AddListener(OnMainMenuClicked);
        }

        // ---------------------------------------------------------------
        // Voting
        // ---------------------------------------------------------------

        private void OnVoteClicked(string vote)
        {
            // Disable both buttons immediately to prevent double-voting
            if (_thumbsUpButton != null)   _thumbsUpButton.interactable = false;
            if (_thumbsDownButton != null) _thumbsDownButton.interactable = false;

            SetVoteStatus("Submitting…");

            var request = new VoteRequest
            {
                user_id = ApiClient.GetOrCreateUserId(),
                hole_id = GameManager.Instance.DailyHoleId,
                vote    = vote,
                reason  = string.Empty,
            };

            ApiClient.Instance.SubmitVote(
                request,
                onSuccess: resp =>
                {
                    SetVoteStatus(vote == "up" ? "Thanks for the thumbs up!" : "Thanks for the feedback!");
                    Debug.Log($"[ResultUI] Vote accepted. Hole status: {resp.status}, score: {resp.persistence_score}");
                },
                onError: err =>
                {
                    // Re-enable on error so the player can retry
                    if (_thumbsUpButton != null)   _thumbsUpButton.interactable = true;
                    if (_thumbsDownButton != null) _thumbsDownButton.interactable = true;
                    SetVoteStatus("Couldn't submit vote.");
                    Debug.LogWarning($"[ResultUI] Vote failed: {err}");
                }
            );
        }

        private void SetVoteStatus(string text)
        {
            if (_voteStatusText != null)
                _voteStatusText.text = text;
        }

        // ---------------------------------------------------------------
        // Navigation
        // ---------------------------------------------------------------

        private void OnRetryClicked()
        {
            GameManager.Instance.ReplayCurrentHole();
        }

        private void OnNewHoleClicked()
        {
            GameManager.Instance.PlayNewHole();
        }

        private void OnShareClicked()
        {
            var result = GameManager.Instance.LastResult;
            if (result == null) return;

            var challenge = result.ToChallengeData();
            string code = ChallengeCodec.Encode(challenge);
            string shareText = $"I scored {result.ScoreName} ({result.Strokes} strokes) on StreetGolf hole {ChallengeCodec.EncodeSeed(result.Seed)}! Can you beat me?\n\nChallenge code: {code}";

            GUIUtility.systemCopyBuffer = shareText;
            Debug.Log($"Challenge copied to clipboard: {code}");

            if (_shareButton != null)
            {
                var text = _shareButton.GetComponentInChildren<TMP_Text>();
                if (text != null) text.text = "Copied!";
            }
        }

        private void OnMainMenuClicked()
        {
            GameManager.Instance.GoToTitle();
        }
    }
}
