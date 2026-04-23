using System;
using UnityEngine;

namespace StreetGolf
{
    public class HoleTarget : MonoBehaviour
    {
        public event Action OnBallSunk;

        public bool BallSunk { get; private set; }

        void OnTriggerEnter(Collider other)
        {
            if (BallSunk) return;
            if (!other.CompareTag("Ball")) return;

            BallSunk = true;
            OnBallSunk?.Invoke();
        }

        public void Reset()
        {
            BallSunk = false;
        }
    }
}
