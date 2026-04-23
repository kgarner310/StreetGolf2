using UnityEngine;

namespace StreetGolf
{
    [RequireComponent(typeof(Rigidbody))]
    public class BallController : MonoBehaviour
    {
        [Header("Tuning")]
        public float stopThreshold = 0.05f;
        public float dragGround    = 1f;
        public float angularDrag   = 2f;

        [Header("State — read only")]
        [SerializeField] private bool _isMoving;

        public bool IsMoving => _isMoving;

        private Rigidbody _rb;
        private Vector3   _startPosition;

        void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            _rb.drag        = dragGround;
            _rb.angularDrag = angularDrag;
            _startPosition  = transform.position;
        }

        void FixedUpdate()
        {
            _isMoving = _rb.velocity.magnitude > stopThreshold;
        }

        public void ApplyForce(Vector3 force)
        {
            _rb.AddForce(force, ForceMode.Impulse);
        }

        public void ResetBall()
        {
            _rb.velocity        = Vector3.zero;
            _rb.angularVelocity = Vector3.zero;
            transform.position  = _startPosition;
            transform.rotation  = Quaternion.identity;
            _isMoving           = false;
        }
    }
}
