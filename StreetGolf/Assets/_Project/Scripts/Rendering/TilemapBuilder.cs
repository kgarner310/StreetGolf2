using UnityEngine;
using UnityEngine.Tilemaps;
using StreetGolf.Data;
using StreetGolf.Config;

namespace StreetGolf.Rendering
{
    /// <summary>
    /// Writes HoleData grid to Unity Tilemap components.
    /// Uses terrain config to map TerrainType -> tile or color.
    /// Falls back to colored tiles if no tile assets are assigned.
    /// </summary>
    public class TilemapBuilder : MonoBehaviour
    {
        [Header("Tilemap References")]
        [SerializeField] private Tilemap _groundTilemap;
        [SerializeField] private Tilemap _obstacleTilemap;

        [Header("Hole Marker")]
        [SerializeField] private GameObject _holeFlagPrefab;

        private GameObject _holeFlag;

        /// <summary>
        /// Build the tilemap from hole data.
        /// </summary>
        public void BuildTilemap(HoleData hole, TerrainConfigSO terrainConfig)
        {
            ClearTilemaps();

            for (int x = 0; x < hole.Width; x++)
            {
                for (int y = 0; y < hole.Height; y++)
                {
                    TerrainType terrain = hole.Grid[x, y];
                    var props = terrainConfig.GetProperties(terrain);
                    var pos = new Vector3Int(x, y, 0);

                    if (props.Tile != null)
                    {
                        // Use configured tile asset
                        if (terrain == TerrainType.Building)
                        {
                            _obstacleTilemap.SetTile(pos, props.Tile);
                        }
                        else
                        {
                            _groundTilemap.SetTile(pos, props.Tile);
                        }
                    }
                    else
                    {
                        // Fallback: use a simple colored tile
                        SetColoredTile(
                            terrain == TerrainType.Building ? _obstacleTilemap : _groundTilemap,
                            pos, props.DisplayColor);
                    }
                }
            }

            // Place hole flag
            PlaceHoleFlag(hole);
        }

        private void ClearTilemaps()
        {
            if (_groundTilemap != null) _groundTilemap.ClearAllTiles();
            if (_obstacleTilemap != null) _obstacleTilemap.ClearAllTiles();
            if (_holeFlag != null) Destroy(_holeFlag);
        }

        private void SetColoredTile(Tilemap tilemap, Vector3Int pos, Color color)
        {
            // Create or reuse a simple white tile and tint it
            var tile = ScriptableObject.CreateInstance<Tile>();
            tile.sprite = CreateSquareSprite();
            tile.color = color;
            tilemap.SetTile(pos, tile);
        }

        private void PlaceHoleFlag(HoleData hole)
        {
            Vector3 flagPos = new Vector3(
                hole.HolePos.x + 0.5f,
                hole.HolePos.y + 0.5f,
                -0.1f);

            if (_holeFlagPrefab != null)
            {
                _holeFlag = Instantiate(_holeFlagPrefab, flagPos, Quaternion.identity);
            }
            else
            {
                // Create a simple hole marker
                _holeFlag = new GameObject("HoleFlag");
                _holeFlag.transform.position = flagPos;

                var sr = _holeFlag.AddComponent<SpriteRenderer>();
                sr.sprite = CreateHoleSprite();
                sr.color = Color.black;
                sr.sortingOrder = 5;
            }
        }

        // --- Procedural sprite helpers (for when no art assets exist) ---

        private static Sprite _squareSprite;
        private static Sprite CreateSquareSprite()
        {
            if (_squareSprite != null) return _squareSprite;

            var tex = new Texture2D(4, 4, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Point;
            for (int y = 0; y < 4; y++)
                for (int x = 0; x < 4; x++)
                    tex.SetPixel(x, y, Color.white);
            tex.Apply();

            _squareSprite = Sprite.Create(tex, new Rect(0, 0, 4, 4), Vector2.one * 0.5f, 4);
            return _squareSprite;
        }

        private static Sprite CreateHoleSprite()
        {
            int size = 16;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Bilinear;

            float center = size / 2f;
            float outerRadius = size / 2f - 1f;
            float innerRadius = outerRadius * 0.5f;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dist = Vector2.Distance(new Vector2(x, y), new Vector2(center, center));
                    if (dist <= innerRadius)
                    {
                        tex.SetPixel(x, y, new Color(0.1f, 0.1f, 0.1f, 1f));
                    }
                    else if (dist <= outerRadius)
                    {
                        float t = (dist - innerRadius) / (outerRadius - innerRadius);
                        tex.SetPixel(x, y, new Color(0.1f, 0.1f, 0.1f, 1f - t));
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
