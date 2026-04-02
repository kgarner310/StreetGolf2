using UnityEngine;

namespace StreetGolf.Config
{
    /// <summary>
    /// Ball physics tuning parameters.
    /// Create one asset instance: Assets/_Project/Config/BallConfig.asset
    /// </summary>
    [CreateAssetMenu(fileName = "BallConfig", menuName = "StreetGolf/Ball Config")]
    public class BallConfigSO : ScriptableObject
    {
        [Header("Power")]
        [Tooltip("Maximum launch speed in world units/second.")]
        public float MaxPower = 20f;

        [Tooltip("Minimum meaningful launch speed.")]
        public float MinPower = 1f;

        [Header("Physics")]
        [Tooltip("Base friction multiplier applied each sim step (before terrain modifier).")]
        [Range(0.9f, 1f)]
        public float BaseFriction = 0.98f;

        [Tooltip("Ball speed below this is considered stopped (world units/sec).")]
        public float StopThreshold = 0.1f;

        [Tooltip("Fixed timestep for simulation (seconds). Smaller = more accurate.")]
        public float SimTimeStep = 0.016f;

        [Tooltip("Maximum simulation steps per shot (safety limit).")]
        public int MaxSimSteps = 3000;

        [Header("Hole Detection")]
        [Tooltip("Ball must be within this distance of hole center to sink.")]
        public float HoleRadius = 0.5f;

        [Tooltip("Ball must be below this speed to sink into the hole.")]
        public float HoleSinkSpeed = 3f;

        [Header("Input")]
        [Tooltip("Maximum drag distance in screen pixels for full power.")]
        public float MaxDragDistance = 200f;

        [Tooltip("Minimum drag distance in screen pixels to register a shot.")]
        public float MinDragDistance = 15f;

        [Header("Limits")]
        [Tooltip("Maximum strokes before forced hole completion.")]
        public int MaxStrokes = 12;
    }
}
