using UnityEngine;

namespace StreetGolf.Data
{
    /// <summary>
    /// Records one shot's input and outcome.
    /// Used for ghost replay and challenge sharing.
    /// </summary>
    [System.Serializable]
    public struct ShotData
    {
        /// <summary>Shot angle in degrees (0 = right, 90 = up, counterclockwise).</summary>
        public float Angle;

        /// <summary>Normalized power 0..1 (scaled by BallConfigSO.MaxPower in simulation).</summary>
        public float Power;

        /// <summary>Ball position when this shot was taken.</summary>
        public Vector2 StartPos;

        /// <summary>Ball position after the shot resolved (stopped or penalty reset).</summary>
        public Vector2 EndPos;

        /// <summary>Whether this shot resulted in a penalty (water/OOB).</summary>
        public bool WasPenalty;

        /// <summary>Convert angle + power to a world-space velocity vector.</summary>
        public Vector2 GetVelocity(float maxPower)
        {
            float rad = Angle * Mathf.Deg2Rad;
            Vector2 dir = new Vector2(Mathf.Cos(rad), Mathf.Sin(rad));
            return dir * (Power * maxPower);
        }
    }
}
