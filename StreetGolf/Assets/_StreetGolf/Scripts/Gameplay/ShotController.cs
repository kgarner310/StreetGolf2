using System;
using UnityEngine;

namespace StreetGolf
{
    public class ShotController : MonoBehaviour
    {
        public event Action OnShotFired;
        [Header("References")]
        public BallController ball;

        [Header("Tuning")]
        public float powerMultiplier = 8f;
        public float maxPower        = 20f;
        public float maxDragDistance = 5f;

        private bool    _dragging;
        private Vector3 _dragStartWorld;

        void Update()
        {
            if (ball == null || ball.IsMoving)
                return;

            if (Input.GetMouseButtonDown(0))
            {
                _dragStartWorld = ScreenToGroundPoint(Input.mousePosition);
                _dragging = true;
            }

            if (_dragging && Input.GetMouseButtonUp(0))
            {
                _dragging = false;
                Vector3 dragEndWorld = ScreenToGroundPoint(Input.mousePosition);
                Fire(dragEndWorld);
            }
        }

        private void Fire(Vector3 dragEnd)
        {
            // Pull-back: shot direction is opposite to drag
            Vector3 delta = _dragStartWorld - dragEnd;
            float distance = Mathf.Clamp(delta.magnitude, 0f, maxDragDistance);
            float power = (distance / maxDragDistance) * maxPower * powerMultiplier;

            if (distance < 0.05f)
                return;

            Vector3 force = delta.normalized * power;
            ball.ApplyForce(force);
            OnShotFired?.Invoke();
        }

        // Intersect a screen-space ray with the y=0 ground plane.
        private Vector3 ScreenToGroundPoint(Vector3 screenPos)
        {
            Ray ray = Camera.main.ScreenPointToRay(screenPos);
            if (Mathf.Abs(ray.direction.y) < 0.001f)
                return Vector3.zero;
            float t = -ray.origin.y / ray.direction.y;
            return ray.origin + ray.direction * t;
        }
    }
}
