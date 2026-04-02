using UnityEngine;
using StreetGolf.Gameplay;

namespace StreetGolf.UI
{
    /// <summary>
    /// Draws the aim line and power indicator while the player is dragging.
    /// Uses a LineRenderer for the aim arrow and scales to show power.
    /// </summary>
    [RequireComponent(typeof(LineRenderer))]
    public class AimLineRenderer : MonoBehaviour
    {
        [Header("Appearance")]
        [SerializeField] private Color _lowPowerColor = new Color(0.3f, 0.8f, 0.3f);
        [SerializeField] private Color _highPowerColor = new Color(0.9f, 0.2f, 0.2f);
        [SerializeField] private float _maxLineLength = 5f;
        [SerializeField] private float _lineWidth = 0.08f;
        [SerializeField] private int _sortingOrder = 15;

        private LineRenderer _line;
        private AimController _aim;
        private Transform _ballTransform;

        public void Initialize(AimController aim, Transform ballTransform)
        {
            _aim = aim;
            _ballTransform = ballTransform;

            _aim.OnAimStarted += ShowLine;
            _aim.OnAimUpdated += UpdateLine;
            _aim.OnAimComplete += HideLineOnShot;
            _aim.OnAimCancelled += HideLine;

            SetupLineRenderer();
            HideLine();
        }

        private void SetupLineRenderer()
        {
            _line = GetComponent<LineRenderer>();
            _line.positionCount = 2;
            _line.startWidth = _lineWidth;
            _line.endWidth = _lineWidth * 0.3f; // tapered arrow
            _line.useWorldSpace = true;
            _line.sortingOrder = _sortingOrder;
            _line.material = new Material(Shader.Find("Sprites/Default"));
            _line.startColor = _lowPowerColor;
            _line.endColor = _lowPowerColor;
        }

        private void ShowLine()
        {
            _line.enabled = true;
        }

        private void UpdateLine(float angle, float power)
        {
            if (_ballTransform == null) return;

            Vector2 ballPos = _ballTransform.position;
            float rad = angle * Mathf.Deg2Rad;
            Vector2 dir = new Vector2(Mathf.Cos(rad), Mathf.Sin(rad));

            float length = power * _maxLineLength;
            Vector2 endPos = ballPos + dir * length;

            _line.SetPosition(0, new Vector3(ballPos.x, ballPos.y, -0.5f));
            _line.SetPosition(1, new Vector3(endPos.x, endPos.y, -0.5f));

            // Color gradient based on power
            Color color = Color.Lerp(_lowPowerColor, _highPowerColor, power);
            _line.startColor = color;
            _line.endColor = new Color(color.r, color.g, color.b, 0.3f);
        }

        private void HideLineOnShot(float angle, float power)
        {
            HideLine();
        }

        private void HideLine()
        {
            if (_line != null)
                _line.enabled = false;
        }

        private void OnDestroy()
        {
            if (_aim != null)
            {
                _aim.OnAimStarted -= ShowLine;
                _aim.OnAimUpdated -= UpdateLine;
                _aim.OnAimComplete -= HideLineOnShot;
                _aim.OnAimCancelled -= HideLine;
            }
        }
    }
}
