using UnityEngine;
using UnityEngine.UI;

namespace StreetGolf
{
    public class StrokeManager : MonoBehaviour
    {
        [Header("References")]
        public ShotController shotController;
        public HoleTarget     holeTarget;
        public Text           strokeLabel;   // optional legacy UI Text

        public int StrokeCount { get; private set; }

        void OnEnable()
        {
            if (shotController != null)
                shotController.OnShotFired += HandleShotFired;

            if (holeTarget != null)
                holeTarget.OnBallSunk += HandleBallSunk;
        }

        void OnDisable()
        {
            if (shotController != null)
                shotController.OnShotFired -= HandleShotFired;

            if (holeTarget != null)
                holeTarget.OnBallSunk -= HandleBallSunk;
        }

        public void ResetStrokes()
        {
            StrokeCount = 0;
            UpdateLabel();
        }

        private void HandleShotFired()
        {
            StrokeCount++;
            UpdateLabel();
        }

        private void HandleBallSunk()
        {
            UpdateLabel("Hole! " + StrokeCount);
        }

        private void UpdateLabel(string text = null)
        {
            if (strokeLabel == null) return;
            strokeLabel.text = text ?? "Strokes: " + StrokeCount;
        }
    }
}
