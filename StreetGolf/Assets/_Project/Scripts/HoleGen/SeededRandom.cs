namespace StreetGolf.HoleGen
{
    /// <summary>
    /// Deterministic pseudo-random number generator using xorshift32.
    /// Same seed always produces the same sequence — critical for
    /// reproducible hole generation and challenge sharing.
    /// </summary>
    public class SeededRandom
    {
        private uint _state;

        public SeededRandom(uint seed)
        {
            // Ensure non-zero state (xorshift requires it)
            _state = seed == 0 ? 1 : seed;
        }

        /// <summary>Raw next uint32.</summary>
        public uint Next()
        {
            _state ^= _state << 13;
            _state ^= _state >> 17;
            _state ^= _state << 5;
            return _state;
        }

        /// <summary>Random int in [min, max) range.</summary>
        public int Range(int min, int max)
        {
            if (min >= max) return min;
            uint range = (uint)(max - min);
            return min + (int)(Next() % range);
        }

        /// <summary>Random float in [0, 1).</summary>
        public float Value()
        {
            return (Next() & 0x7FFFFFFF) / (float)0x7FFFFFFF;
        }

        /// <summary>Random float in [min, max).</summary>
        public float Range(float min, float max)
        {
            return min + Value() * (max - min);
        }

        /// <summary>Random bool with given probability of true.</summary>
        public bool Chance(float probability)
        {
            return Value() < probability;
        }
    }
}
