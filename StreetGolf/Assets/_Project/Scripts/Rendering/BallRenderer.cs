using UnityEngine;

namespace StreetGolf.Rendering
{
    /// <summary>
    /// Visual representation of the player's golf ball.
    /// Creates a simple procedural sprite if no art asset is assigned.
    /// </summary>
    public class BallRenderer : MonoBehaviour
    {
        [Header("Appearance")]
        [SerializeField] private Color _ballColor = Color.white;
        [SerializeField] private float _ballSize = 0.6f;
        [SerializeField] private int _sortingOrder = 10;

        private SpriteRenderer _renderer;
        private Transform _shadow;

        private void Awake()
        {
            SetupSprite();
            SetupShadow();
        }

        private void SetupSprite()
        {
            _renderer = GetComponent<SpriteRenderer>();
            if (_renderer == null)
            {
                _renderer = gameObject.AddComponent<SpriteRenderer>();
            }

            if (_renderer.sprite == null)
            {
                _renderer.sprite = CreateBallSprite(32);
            }

            _renderer.color = _ballColor;
            _renderer.sortingOrder = _sortingOrder;
            transform.localScale = Vector3.one * _ballSize;
        }

        private void SetupShadow()
        {
            var shadowGO = new GameObject("Shadow");
            shadowGO.transform.SetParent(transform, false);
            shadowGO.transform.localPosition = new Vector3(0.08f, -0.08f, 0.01f);
            shadowGO.transform.localScale = Vector3.one * 1.1f;

            var shadowRenderer = shadowGO.AddComponent<SpriteRenderer>();
            shadowRenderer.sprite = _renderer.sprite;
            shadowRenderer.color = new Color(0f, 0f, 0f, 0.25f);
            shadowRenderer.sortingOrder = _sortingOrder - 1;
            _shadow = shadowGO.transform;
        }

        /// <summary>
        /// Create a procedural circle sprite for the ball.
        /// </summary>
        private static Sprite CreateBallSprite(int size)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Bilinear;

            float center = size / 2f;
            float radius = size / 2f - 1f;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dist = Vector2.Distance(new Vector2(x, y), new Vector2(center, center));
                    if (dist <= radius)
                    {
                        // Simple shading: lighter at top-left, darker at bottom-right
                        float nx = (x - center) / radius;
                        float ny = (y - center) / radius;
                        float shade = 0.85f + 0.15f * Mathf.Clamp01(-nx * 0.5f + ny * 0.5f + 0.5f);

                        float alpha = Mathf.Clamp01((radius - dist) / 1.5f); // soft edge
                        tex.SetPixel(x, y, new Color(shade, shade, shade, alpha));
                    }
                    else
                    {
                        tex.SetPixel(x, y, Color.clear);
                    }
                }
            }

            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), Vector2.one * 0.5f, size);
        }
    }
}
