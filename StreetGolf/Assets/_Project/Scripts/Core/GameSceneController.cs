using UnityEngine;
using StreetGolf.Gameplay;
using StreetGolf.UI;

namespace StreetGolf.Core
{
    /// <summary>
    /// GameScene bootstrapper.
    /// Wires TurnManager → HUDController after both are created.
    /// Created by SceneBuilder and placed on the same GameObject as TurnManager.
    /// </summary>
    public class GameSceneController : MonoBehaviour
    {
        [SerializeField] private TurnManager _turnManager;
        [SerializeField] private HUDController _hud;

        private void Start()
        {
            if (_turnManager != null && _hud != null)
                _hud.Initialize(_turnManager);
        }
    }
}
