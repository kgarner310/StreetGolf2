using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StreetGolf.Core;
using StreetGolf.Data;
using StreetGolf.Network;

namespace StreetGolf.UI
{
    /// <summary>
    /// Title screen UI.
    /// On start: fetches today's daily hole from the backend and enables the
    /// "Play Today's Hole" button when the response arrives.
    /// Also handles random Play and Challenge (enter seed) buttons.
    /// </summary>
    public class TitleUI : MonoBehaviour
    {
        [Header("Buttons")]
        [SerializeField] private Button _playButton;
        [SerializeField] private Button _challengeButton;
        [SerializeField] private Button _dailyHoleButton;

        [Header("Daily Hole Display")]
        [SerializeField] private TMP_Text _dailyHoleNameText;
        [SerializeField] private TMP_Text _dailyHoleStatusText; // shows "Loading…", error, or hole status

        [Header("Other")]
        [SerializeField] private GameObject _seedEntryPanel;
        [SerializeField] private TMP_Text _titleText;

        private int _dailyHoleId;

        private void Start()
        {
            if (_playButton != null)
                _playButton.onClick.AddListener(OnPlayClicked);
            if (_challengeButton != null)
                _challengeButton.onClick.AddListener(OnChallengeClicked);
            if (_dailyHoleButton != null)
            {
                _dailyHoleButton.onClick.AddListener(OnDailyHoleClicked);
                _dailyHoleButton.interactable = false; // disabled until fetch succeeds
            }

            if (_seedEntryPanel != null)
                _seedEntryPanel.SetActive(false);

            if (_titleText != null)
                StartCoroutine(PulseTitle());

            FetchDailyHole();
        }

        // ---------------------------------------------------------------
        // Daily hole
        // ---------------------------------------------------------------

        private void FetchDailyHole()
        {
            SetDailyHoleStatus("Loading today's hole…");

            ApiClient.Instance.GetDailyHole(
                onSuccess: hole =>
                {
                    _dailyHoleId = hole.id;

                    if (_dailyHoleNameText != null)
                        _dailyHoleNameText.text = hole.name;

                    SetDailyHoleStatus(hole.status);

                    if (_dailyHoleButton != null)
                        _dailyHoleButton.interactable = true;
                },
                onError: err =>
                {
                    Debug.LogWarning($"[TitleUI] Failed to fetch daily hole: {err}");
                    SetDailyHoleStatus("Unavailable");
                }
            );
        }

        private void SetDailyHoleStatus(string text)
        {
            if (_dailyHoleStatusText != null)
                _dailyHoleStatusText.text = text;
        }

        private void OnDailyHoleClicked()
        {
            if (_dailyHoleId <= 0) return;
            GameManager.Instance.PlayDailyHole(_dailyHoleId);
        }

        // ---------------------------------------------------------------
        // Existing buttons
        // ---------------------------------------------------------------

        private void OnPlayClicked()
        {
            GameManager.Instance.PlayNewHole();
        }

        private void OnChallengeClicked()
        {
            if (_seedEntryPanel != null)
                _seedEntryPanel.SetActive(true);
        }

        private System.Collections.IEnumerator PulseTitle()
        {
            if (_titleText == null) yield break;

            var originalScale = _titleText.transform.localScale;
            float t = 0f;

            while (true)
            {
                t += Time.deltaTime * 1.5f;
                float scale = 1f + Mathf.Sin(t) * 0.03f;
                _titleText.transform.localScale = originalScale * scale;
                yield return null;
            }
        }
    }
}
