using UnityEngine;

namespace StreetGolf
{
    public class CameraFollow : MonoBehaviour
    {
        [Header("References")]
        public Transform target;

        [Header("Tuning")]
        public Vector3 offset    = new Vector3(0f, 8f, -8f);
        public float   smoothing = 5f;

        void LateUpdate()
        {
            if (target == null) return;

            Vector3 desired = target.position + offset;
            transform.position = Vector3.Lerp(transform.position, desired, smoothing * Time.deltaTime);
        }
    }
}
