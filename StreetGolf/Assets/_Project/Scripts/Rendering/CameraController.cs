using UnityEngine;

namespace StreetGolf.Rendering
{
    /// <summary>
    /// Orthographic camera controller for the golf hole view.
    /// Frames the entire hole on start, follows the ball during shots.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public class CameraController : MonoBehaviour
    {
        [Header("Framing")]
        [SerializeField] private float _framePadding = 2f;
        [SerializeField] private float _followPadding = 5f;

        [Header("Smoothing")]
        [SerializeField] private float _followSmoothTime = 0.3f;
        [SerializeField] private float _zoomSmoothTime = 0.5f;

        private Camera _cam;
        private Rect _holeBounds;
        private Transform _followTarget;
        private Vector3 _velocity;
        private float _targetOrthoSize;
        private float _orthoSizeVelocity;
        private bool _isFollowing;

        private void Awake()
        {
            _cam = GetComponent<Camera>();
            _cam.orthographic = true;
        }

        /// <summary>Set the world-space bounds of the hole.</summary>
        public void SetHoleBounds(Rect bounds)
        {
            _holeBounds = bounds;
        }

        /// <summary>Zoom out to show the entire hole.</summary>
        public void FrameHole()
        {
            _isFollowing = false;

            // Center camera on hole
            Vector3 center = new Vector3(
                _holeBounds.x + _holeBounds.width / 2f,
                _holeBounds.y + _holeBounds.height / 2f,
                -10f);
            transform.position = center;

            // Set ortho size to fit the hole with padding
            float aspect = _cam.aspect;
            float sizeForHeight = (_holeBounds.height / 2f) + _framePadding;
            float sizeForWidth = ((_holeBounds.width / 2f) + _framePadding) / aspect;
            _targetOrthoSize = Mathf.Max(sizeForHeight, sizeForWidth);
            _cam.orthographicSize = _targetOrthoSize;
        }

        /// <summary>Switch to following a target (the ball).</summary>
        public void FollowBall(Transform target)
        {
            _followTarget = target;
            _isFollowing = true;

            // Zoom in a bit when following
            float aspect = _cam.aspect;
            float followSize = _followPadding / Mathf.Min(aspect, 1f);
            _targetOrthoSize = Mathf.Max(followSize, 6f);
        }

        /// <summary>Stop following and zoom back out.</summary>
        public void StopFollowing()
        {
            _isFollowing = false;
            _followTarget = null;

            // Zoom back out to see the whole hole
            float aspect = _cam.aspect;
            float sizeForHeight = (_holeBounds.height / 2f) + _framePadding;
            float sizeForWidth = ((_holeBounds.width / 2f) + _framePadding) / aspect;
            _targetOrthoSize = Mathf.Max(sizeForHeight, sizeForWidth);
        }

        private void LateUpdate()
        {
            // Smooth zoom
            _cam.orthographicSize = Mathf.SmoothDamp(
                _cam.orthographicSize, _targetOrthoSize, ref _orthoSizeVelocity, _zoomSmoothTime);

            if (_isFollowing && _followTarget != null)
            {
                // Smooth follow
                Vector3 targetPos = new Vector3(
                    _followTarget.position.x,
                    _followTarget.position.y,
                    -10f);

                // Clamp to hole bounds
                float halfH = _cam.orthographicSize;
                float halfW = halfH * _cam.aspect;
                targetPos.x = Mathf.Clamp(targetPos.x,
                    _holeBounds.xMin + halfW, _holeBounds.xMax - halfW);
                targetPos.y = Mathf.Clamp(targetPos.y,
                    _holeBounds.yMin + halfH, _holeBounds.yMax - halfH);

                transform.position = Vector3.SmoothDamp(
                    transform.position, targetPos, ref _velocity, _followSmoothTime);
            }
            else
            {
                // Smoothly return to hole center
                Vector3 center = new Vector3(
                    _holeBounds.x + _holeBounds.width / 2f,
                    _holeBounds.y + _holeBounds.height / 2f,
                    -10f);
                transform.position = Vector3.SmoothDamp(
                    transform.position, center, ref _velocity, _followSmoothTime);
            }
        }
    }
}
