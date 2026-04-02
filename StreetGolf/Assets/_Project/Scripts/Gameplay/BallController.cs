using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using StreetGolf.Data;
using StreetGolf.Config;

namespace StreetGolf.Gameplay
{
    /// <summary>
    /// MonoBehaviour that drives ball visualization along a simulated trajectory.
    /// The actual physics happen in BallSimulation (pure C#) — this just animates.
    /// </summary>
    public class BallController : MonoBehaviour
    {
        /// <summary>Fires when the ball finishes animating a shot.</summary>
        public event Action<BallSimulation.SimResult> OnShotAnimationComplete;

        /// <summary>Is the ball currently animating a shot?</summary>
        public bool IsAnimating { get; private set; }

        /// <summary>Current world position of the ball.</summary>
        public Vector2 Position => transform.position;

        [Header("Animation")]
        [SerializeField] private float _playbackSpeedMultiplier = 2.5f;
        [SerializeField] private float _minAnimDuration = 0.3f;

        /// <summary>
        /// Set the ball's position directly (e.g., on spawn or after penalty reset).
        /// </summary>
        public void SetPosition(Vector2 worldPos)
        {
            transform.position = new Vector3(worldPos.x, worldPos.y, 0f);
        }

        /// <summary>
        /// Animate the ball along a pre-computed trajectory.
        /// </summary>
        public void PlayTrajectory(BallSimulation.SimResult simResult)
        {
            if (IsAnimating) return;
            StartCoroutine(AnimateTrajectory(simResult));
        }

        private IEnumerator AnimateTrajectory(BallSimulation.SimResult simResult)
        {
            IsAnimating = true;
            List<Vector2> trajectory = simResult.Trajectory;

            if (trajectory.Count < 2)
            {
                SetPosition(simResult.FinalPosition);
                IsAnimating = false;
                OnShotAnimationComplete?.Invoke(simResult);
                yield break;
            }

            // Calculate total path length for speed normalization
            float totalLength = 0f;
            for (int i = 1; i < trajectory.Count; i++)
            {
                totalLength += Vector2.Distance(trajectory[i - 1], trajectory[i]);
            }

            float animDuration = Mathf.Max(
                _minAnimDuration,
                simResult.Duration / _playbackSpeedMultiplier
            );

            float elapsed = 0f;
            float lengthTraveled = 0f;
            int segIndex = 0;
            float segStartLength = 0f;

            while (elapsed < animDuration && segIndex < trajectory.Count - 1)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / animDuration);

                // Ease-out for satisfying deceleration feel
                float easedT = 1f - (1f - t) * (1f - t);
                float targetLength = easedT * totalLength;

                // Advance through segments
                while (segIndex < trajectory.Count - 1)
                {
                    float segLength = Vector2.Distance(trajectory[segIndex], trajectory[segIndex + 1]);
                    if (segStartLength + segLength >= targetLength)
                    {
                        // Interpolate within this segment
                        float segT = (segLength > 0.001f)
                            ? (targetLength - segStartLength) / segLength
                            : 0f;
                        Vector2 pos = Vector2.Lerp(trajectory[segIndex], trajectory[segIndex + 1], segT);
                        SetPosition(pos);
                        break;
                    }
                    segStartLength += segLength;
                    segIndex++;
                }

                yield return null;
            }

            // Snap to final position
            SetPosition(simResult.FinalPosition);
            IsAnimating = false;
            OnShotAnimationComplete?.Invoke(simResult);
        }
    }
}
