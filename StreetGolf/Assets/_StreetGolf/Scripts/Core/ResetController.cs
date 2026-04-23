using UnityEngine;

namespace StreetGolf
{
    public class ResetController : MonoBehaviour
    {
        [Header("References")]
        public BallController  ball;
        public ShotController  shot;
        public StrokeManager   strokeManager;
        public HoleTarget      holeTarget;

        [Header("Tuning")]
        public KeyCode resetKey = KeyCode.R;

        void Update()
        {
            if (Input.GetKeyDown(resetKey))
                ResetAll();
        }

        public void ResetAll()
        {
            ball?.ResetBall();
            shot?.Reset();
            strokeManager?.ResetStrokes();
            holeTarget?.Reset();
        }
    }
}
