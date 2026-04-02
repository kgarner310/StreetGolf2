using System;
using UnityEngine;
using StreetGolf.Config;
using StreetGolf.Input;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// Reads drag input and converts it to aim direction and power.
    /// Drag direction is OPPOSITE to shot direction (pull-back-and-release mechanic).
    /// Power is proportional to drag distance, clamped by BallConfig.
    /// </summary>
    public class AimController : MonoBehaviour
    {
        /// <summary>Fires when the player confirms a shot (releases drag).</summary>
        public event Action<float, float> OnAimComplete; // angle (degrees), power (0..1)

        /// <summary>Fires each frame while aiming with current angle and power.</summary>
        public event Action<float, float> OnAimUpdated; // angle (degrees), power (0..1)

        /// <summary>Fires when aiming starts.</summary>
        public event Action OnAimStarted;

        /// <summary>Fires when aim is cancelled (drag too short).</summary>
        public event Action OnAimCancelled;

        /// <summary>Is the player currently aiming?</summary>
        public bool IsAiming { get; private set; }

        /// <summary>Current aim angle in degrees (0=right, 90=up).</summary>
        public float CurrentAngle { get; private set; }

        /// <summary>Current power normalized 0..1.</summary>
        public float CurrentPower { get; private set; }

        private PlayerInputHandler _input;
        private BallConfigSO _ballConfig;
        private bool _enabled = true;

        public void Initialize(PlayerInputHandler input, BallConfigSO ballConfig)
        {
            _input = input;
            _ballConfig = ballConfig;

            _input.OnDragStarted += HandleDragStarted;
            _input.OnDragMoved += HandleDragMoved;
            _input.OnDragReleased += HandleDragReleased;
        }

        /// <summary>Enable/disable aiming (e.g., during ball animation).</summary>
        public void SetAimEnabled(bool enabled)
        {
            _enabled = enabled;
            if (!enabled)
            {
                IsAiming = false;
            }
        }

        private void HandleDragStarted(Vector2 screenPos)
        {
            if (!_enabled) return;
            IsAiming = true;
            CurrentAngle = 0f;
            CurrentPower = 0f;
            OnAimStarted?.Invoke();
        }

        private void HandleDragMoved(Vector2 screenPos)
        {
            if (!_enabled || !IsAiming) return;
            ComputeAim(_input.DragStartPosition, screenPos);
            OnAimUpdated?.Invoke(CurrentAngle, CurrentPower);
        }

        private void HandleDragReleased(Vector2 startPos, Vector2 endPos)
        {
            if (!_enabled || !IsAiming) return;
            IsAiming = false;

            ComputeAim(startPos, endPos);

            float dragDist = Vector2.Distance(startPos, endPos);
            if (dragDist < _ballConfig.MinDragDistance)
            {
                // Drag too short — cancel
                OnAimCancelled?.Invoke();
                return;
            }

            OnAimComplete?.Invoke(CurrentAngle, CurrentPower);
        }

        private void ComputeAim(Vector2 dragStart, Vector2 dragEnd)
        {
            Vector2 dragDelta = dragEnd - dragStart;
            float dragDist = dragDelta.magnitude;

            // Shot direction is OPPOSITE to drag direction (pull back to shoot forward)
            Vector2 shotDir = -dragDelta.normalized;

            // Angle in degrees
            CurrentAngle = Mathf.Atan2(shotDir.y, shotDir.x) * Mathf.Rad2Deg;

            // Power normalized to 0..1
            CurrentPower = Mathf.Clamp01(dragDist / _ballConfig.MaxDragDistance);
        }

        private void OnDestroy()
        {
            if (_input != null)
            {
                _input.OnDragStarted -= HandleDragStarted;
                _input.OnDragMoved -= HandleDragMoved;
                _input.OnDragReleased -= HandleDragReleased;
            }
        }
    }
}
