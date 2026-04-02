using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StreetGolf.Core;
using StreetGolf.Data;

namespace StreetGolf.UI
{
    /// <summary>
    /// Panel for entering a challenge code or seed.
    /// Validates input, decodes challenge data, and starts the game.
    /// </summary>
    public class SeedEntryUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private TMP_InputField _codeInput;
        [SerializeField] private Button _goButton;
        [SerializeField] private Button _pasteButton;
        [SerializeField] private Button _cancelButton;
        [SerializeField] private TMP_Text _errorText;

        private void Start()
        {
            if (_goButton != null)
                _goButton.onClick.AddListener(OnGoClicked);
            if (_pasteButton != null)
                _pasteButton.onClick.AddListener(OnPasteClicked);
            if (_cancelButton != null)
                _cancelButton.onClick.AddListener(OnCancelClicked);

            if (_errorText != null)
                _errorText.gameObject.SetActive(false);
        }

        private void OnGoClicked()
        {
            if (_codeInput == null) return;
            string code = _codeInput.text.Trim();
            TryParseAndPlay(code);
        }

        private void OnPasteClicked()
        {
            string clipboard = ShareController.PasteFromClipboard();
            if (!string.IsNullOrEmpty(clipboard))
            {
                // Try to extract a challenge code from the clipboard text
                // It might be the full share text or just the code
                string code = ExtractCode(clipboard);
                if (_codeInput != null)
                    _codeInput.text = code;
            }
        }

        private void OnCancelClicked()
        {
            gameObject.SetActive(false);
        }

        private void TryParseAndPlay(string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                ShowError("Please enter a code");
                return;
            }

            // Try full challenge first
            if (ChallengeCodec.IsFullChallenge(code))
            {
                var challenge = ChallengeCodec.Decode(code);
                if (challenge != null)
                {
                    GameManager.Instance.PlayChallenge(challenge);
                    return;
                }
            }

            // Try seed-only
            if (ChallengeCodec.TryDecodeSeed(code, out uint seed))
            {
                GameManager.Instance.PlaySeed(seed);
                return;
            }

            ShowError("Invalid code. Try again.");
        }

        /// <summary>
        /// Extract a challenge code from pasted text (which might include the full share message).
        /// </summary>
        private string ExtractCode(string text)
        {
            // Look for a line starting with "SG-"
            string[] lines = text.Split('\n');
            foreach (string line in lines)
            {
                string trimmed = line.Trim();
                if (trimmed.StartsWith("SG-", System.StringComparison.OrdinalIgnoreCase))
                    return trimmed;
            }

            // If no SG- prefix found, return the whole text trimmed
            return text.Trim();
        }

        private void ShowError(string message)
        {
            if (_errorText != null)
            {
                _errorText.text = message;
                _errorText.gameObject.SetActive(true);
            }
        }
    }
}
