using System;
using UnityEngine;

namespace StreetGolf.Input
{
    /// <summary>
    /// Abstracts touch/mouse input into drag-based aim events.
    /// Uses Unity's legacy Input for MVP simplicity — the abstraction layer
    /// means swapping to the new Input System later requires changing only this file.
    ///
    /// For controller support later: add stick-based aiming as an alternative path.
    /// </summary>
    public class PlayerInputHandler : MonoBehaviour
    {
        /// <summary>Fires when the player starts dragging (touch down / mouse down).</summary>
        public event Action<Vector2> OnDragStarted;

        /// <summary>Fires each frame during drag with the current position.</summary>
        public event Action<Vector2> OnDragMoved;

        /// <summary>Fires when the player releases (touch up / mouse up) with start and end positions.</summary>
        public event Action<Vector2, Vector2> OnDragReleased;

        /// <summary>Is the player currently dragging?</summary>
        public bool IsDragging { get; private set; }

        /// <summary>Screen position where the current drag started.</summary>
        public Vector2 DragStartPosition { get; private set; }

        /// <summary>Current screen position during drag.</summary>
        public Vector2 DragCurrentPosition { get; private set; }

        /// <summary>Drag delta from start to current (screen space).</summary>
        public Vector2 DragDelta => IsDragging ? DragCurrentPosition - DragStartPosition : Vector2.zero;

        private bool _inputEnabled = true;

        /// <summary>Enable or disable input processing.</summary>
        public void SetInputEnabled(bool enabled)
        {
            _inputEnabled = enabled;
            if (!enabled && IsDragging)
            {
                // Cancel any active drag
                IsDragging = false;
            }
        }

        private void Update()
        {
            if (!_inputEnabled) return;

            // Handle touch input (prioritized) or mouse fallback
            if (UnityEngine.Input.touchCount > 0)
            {
                HandleTouch();
            }
            else
            {
                HandleMouse();
            }
        }

        private void HandleTouch()
        {
            Touch touch = UnityEngine.Input.GetTouch(0);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    StartDrag(touch.position);
                    break;

                case TouchPhase.Moved:
                case TouchPhase.Stationary:
                    if (IsDragging)
                        UpdateDrag(touch.position);
                    break;

                case TouchPhase.Ended:
                case TouchPhase.Canceled:
                    if (IsDragging)
                        EndDrag(touch.position);
                    break;
            }
        }

        private void HandleMouse()
        {
            if (UnityEngine.Input.GetMouseButtonDown(0))
            {
                StartDrag(UnityEngine.Input.mousePosition);
            }
            else if (UnityEngine.Input.GetMouseButton(0) && IsDragging)
            {
                UpdateDrag(UnityEngine.Input.mousePosition);
            }
            else if (UnityEngine.Input.GetMouseButtonUp(0) && IsDragging)
            {
                EndDrag(UnityEngine.Input.mousePosition);
            }
        }

        private void StartDrag(Vector2 screenPos)
        {
            IsDragging = true;
            DragStartPosition = screenPos;
            DragCurrentPosition = screenPos;
            OnDragStarted?.Invoke(screenPos);
        }

        private void UpdateDrag(Vector2 screenPos)
        {
            DragCurrentPosition = screenPos;
            OnDragMoved?.Invoke(screenPos);
        }

        private void EndDrag(Vector2 screenPos)
        {
            DragCurrentPosition = screenPos;
            IsDragging = false;
            OnDragReleased?.Invoke(DragStartPosition, screenPos);
        }
    }
}
