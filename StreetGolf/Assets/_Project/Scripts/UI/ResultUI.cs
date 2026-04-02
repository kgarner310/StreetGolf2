using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StreetGolf.Core;
using StreetGolf.Data;

namespace StreetGolf.UI
{
    /// <summary>
    /// Result screen UI. Displays score, par comparison, and action buttons.
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

            // Display score
            if (_scoreNameText != null)
                _scoreNameText.text = result.ScoreName;
            if (_strokesText != null)
                _strokesText.text = $"{result.Strokes}";
            if (_parText != null)
                _parText.text = $"PAR {result.Par}";
            if (_seedText != null)
                _seedText.text = ChallengeCodec.EncodeSeed(result.Seed);

            // Challenge comparison
            if (_challengePanel != null)
            {
                if (result.IsChallenge && result.OpponentData != null)
                {
                    _challengePanel.SetActive(true);
                    if (_opponentStrokesText != null)
                        _opponentStrokesText.text = $"Opponent: {result.OpponentData.Strokes}";

                    if (_resultCompareText != null)
                    {
                        int diff = result.Strokes - result.OpponentData.Strokes;
                        if (diff < 0)
                            _resultCompareText.text = $"You win by {-diff}!";
                        else if (diff > 0)
                            _resultCompareText.text = $"Opponent wins by {diff}";
                        else
                            _resultCompareText.text = "It's a tie!";
                    }
                }
                else
                {
                    _challengePanel.SetActive(false);
                }
            }

            // Set up buttons
            if (_retryButton != null)
                _retryButton.onClick.AddListener(OnRetryClicked);
            if (_newHoleButton != null)
                _newHoleButton.onClick.AddListener(OnNewHoleClicked);
            if (_shareButton != null)
                _shareButton.onClick.AddListener(OnShareClicked);
            if (_mainMenuButton != null)
                _mainMenuButton.onClick.AddListener(OnMainMenuClicked);
        }

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

            // Copy to clipboard
            GUIUtility.systemCopyBuffer = shareText;
            Debug.Log($"Challenge copied to clipboard: {code}");

            // Update button text to confirm
            if (_shareButton != null)
            {
                var text = _shareButton.GetComponentInChildren<TMP_Text>();
                if (text != null)
                    text.text = "Copied!";
            }
        }

        private void OnMainMenuClicked()
        {
            GameManager.Instance.GoToTitle();
        }
    }
}
