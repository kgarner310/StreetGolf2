using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StreetGolf.Core;
using StreetGolf.Data;

namespace StreetGolf.UI
{
    /// <summary>
    /// Title screen UI. Handles Play (random seed) and Challenge (enter seed) buttons.
    /// </summary>
    public class TitleUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button _playButton;
        [SerializeField] private Button _challengeButton;
        [SerializeField] private GameObject _seedEntryPanel;
        [SerializeField] private TMP_Text _titleText;

        private void Start()
        {
            // Set up buttons
            if (_playButton != null)
                _playButton.onClick.AddListener(OnPlayClicked);
            if (_challengeButton != null)
                _challengeButton.onClick.AddListener(OnChallengeClicked);

            // Hide seed entry panel by default
            if (_seedEntryPanel != null)
                _seedEntryPanel.SetActive(false);

            // Animate title (simple scale pulse)
            if (_titleText != null)
                StartCoroutine(PulseTitle());
        }

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
