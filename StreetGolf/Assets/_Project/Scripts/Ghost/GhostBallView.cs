using UnityEngine;

namespace StreetGolf.Ghost
{
    /// <summary>
    /// Visual representation of the ghost ball.
    /// Semi-transparent, different color from the player ball.
    /// </summary>
    public class GhostBallView : MonoBehaviour
    {
        private SpriteRenderer _renderer;

        [Header("Ghost Appearance")]
        private Color _ghostColor = new Color(1f, 0.5f, 0.3f, 0.35f); // orange, semi-transparent
        private float _ghostScale = 0.8f;

        public void Initialize()
        {
            // Create sprite renderer if one doesn't exist
            _renderer = GetComponent<SpriteRenderer>();
            if (_renderer == null)
            {
                _renderer = gameObject.AddComponent<SpriteRenderer>();
            }

            // Create a simple circle sprite programmatically
            _renderer.sprite = CreateCircleSprite(16);
            _renderer.color = _ghostColor;
            _renderer.sortingOrder = 8; // Below player ball (10) but above terrain

            transform.localScale = Vector3.one * _ghostScale;
        }

        /// <summary>
        /// Create a simple white circle sprite for the ghost ball.
        /// </summary>
        private static Sprite CreateCircleSprite(int size)
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
                        float alpha = Mathf.Clamp01((radius - dist) / 1.5f);
                        tex.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
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
