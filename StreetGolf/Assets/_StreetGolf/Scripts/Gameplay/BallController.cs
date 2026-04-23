using System;
using UnityEngine;

namespace StreetGolf
{
    [RequireComponent(typeof(Rigidbody))]
    public class BallController : MonoBehaviour
    {
        [Header("Tuning")]
        public float stopThreshold    = 0.05f;
        public int   stopFramesRequired = 8;     // consecutive slow frames before "stopped"
        public float dragGround       = 1f;
        public float angularDrag      = 2f;

        [Header("State — read only")]
        [SerializeField] private bool _isMoving;

        public bool IsMoving => _isMoving;

        // Fired once when ball transitions from moving to fully stopped.
        public event Action OnStopped;

        private Rigidbody _rb;
        private Vector3   _startPosition;
        private int       _slowFrameCount;

        void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            _rb.drag        = dragGround;
            _rb.angularDrag = angularDrag;
            _startPosition  = transform.position;
        }

        void FixedUpdate()
        {
            bool slow = _rb.velocity.magnitude <= stopThreshold;

            if (!slow)
            {
                _slowFrameCount = 0;
                _isMoving = true;
            }
            else if (_isMoving)
            {
                _slowFrameCount++;
                if (_slowFrameCount >= stopFramesRequired)
                {
                    _isMoving       = false;
                    _slowFrameCount = 0;
                    _rb.velocity        = Vector3.zero;
                    _rb.angularVelocity = Vector3.zero;
                    OnStopped?.Invoke();
                }
            }
        }

        public void ApplyForce(Vector3 force)
        {
            _isMoving       = true;
            _slowFrameCount = 0;
            _rb.AddForce(force, ForceMode.Impulse);
        }

        public void ResetBall()
        {
            _rb.velocity        = Vector3.zero;
            _rb.angularVelocity = Vector3.zero;
            transform.position  = _startPosition;
            transform.rotation  = Quaternion.identity;
            _isMoving           = false;
            _slowFrameCount     = 0;
        }
    }
}
