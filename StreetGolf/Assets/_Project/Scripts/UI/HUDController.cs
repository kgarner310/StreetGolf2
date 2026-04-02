using UnityEngine;
using TMPro;
using StreetGolf.Gameplay;

namespace StreetGolf.UI
{
    /// <summary>
    /// In-game heads-up display. Shows stroke count, par, and hole seed.
    /// </summary>
    public class HUDController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private TMP_Text _strokeText;
        [SerializeField] private TMP_Text _parText;
        [SerializeField] private TMP_Text _seedText;
        [SerializeField] private TMP_Text _penaltyText;

        [Header("Settings")]
        [SerializeField] private float _penaltyDisplayDuration = 2f;

        private TurnManager _turnManager;
        private float _penaltyTimer;

        /// <summary>
        /// Initialize HUD with the turn manager reference.
        /// </summary>
        public void Initialize(TurnManager turnManager)
        {
            _turnManager = turnManager;

            // Subscribe to events
            _turnManager.Strokes.OnCountChanged += UpdateStrokeDisplay;
            _turnManager.OnPenalty += ShowPenalty;

            // Initial display
            UpdateStrokeDisplay(0);
            UpdateParDisplay(_turnManager.Hole.Par);
            UpdateSeedDisplay(_turnManager.Hole.Seed);

            if (_penaltyText != null)
                _penaltyText.gameObject.SetActive(false);
        }

        private void UpdateStrokeDisplay(int strokes)
        {
            if (_strokeText != null)
                _strokeText.text = $"STROKE  {strokes}";
        }

        private void UpdateParDisplay(int par)
        {
            if (_parText != null)
                _parText.text = $"PAR {par}";
        }

        private void UpdateSeedDisplay(uint seed)
        {
            if (_seedText != null)
                _seedText.text = Data.ChallengeCodec.EncodeSeed(seed);
        }

        private void ShowPenalty(string message)
        {
            if (_penaltyText == null) return;

            _penaltyText.text = message;
            _penaltyText.gameObject.SetActive(true);
            _penaltyTimer = _penaltyDisplayDuration;
        }

        private void Update()
        {
            // Auto-hide penalty text
            if (_penaltyText != null && _penaltyText.gameObject.activeSelf)
            {
                _penaltyTimer -= Time.deltaTime;
                if (_penaltyTimer <= 0f)
                {
                    _penaltyText.gameObject.SetActive(false);
                }
            }
        }

        private void OnDestroy()
        {
            if (_turnManager != null)
            {
                _turnManager.Strokes.OnCountChanged -= UpdateStrokeDisplay;
                _turnManager.OnPenalty -= ShowPenalty;
            }
        }
    }
}
