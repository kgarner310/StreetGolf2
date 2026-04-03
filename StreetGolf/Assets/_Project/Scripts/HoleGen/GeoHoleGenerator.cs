using System;

namespace StreetGolf.HoleGen
{
    /// <summary>
    /// Generates a named, described hole from a real-world coordinate.
    /// No external APIs — all logic is deterministic mock generation.
    /// The same lat/lng always produces the same hole identity.
    /// </summary>
    public static class GeoHoleGenerator
    {
        // ── Name components ───────────────────────────────────────────────

        private static readonly string[] Prefixes =
        {
            "Main", "Oak", "Maple", "River", "Hill", "Park", "Cedar",
            "Market", "Elm", "Harbor", "Summit", "Ridge", "Broad", "Union"
        };

        private static readonly string[] Suffixes =
        {
            "Street Run", "Avenue Dash", "Road Links", "Lane Challenge",
            "Boulevard Blitz", "Drive Course", "Way Putt", "Path Circuit"
        };

        // ── Description templates ─────────────────────────────────────────

        private static readonly string[] DescriptionTemplates =
        {
            "A tight urban run weaving through parked cars and tight corners.",
            "Wide open asphalt with a tricky dogleg around a city block.",
            "Navigate the roundabout and reach the green in style.",
            "A short but punishing hole flanked by towering buildings.",
            "Smooth road gives way to rough patches — play it smart.",
            "Watch out for the crosswalk hazard on your approach.",
            "A downhill run with a sharp bend before the pin.",
            "Classic street layout with a surprise sand trap near the cup."
        };

        // ── Public API ────────────────────────────────────────────────────

        public static GeoHoleResult GenerateHole(double lat, double lng)
        {
            uint seed = CoordToSeed(lat, lng);
            var rng = new SeededRandom(seed);

            string prefix = Prefixes[rng.Range(0, Prefixes.Length)];
            string suffix = Suffixes[rng.Range(0, Suffixes.Length)];
            string name = $"{prefix} {suffix}";

            string description = DescriptionTemplates[rng.Range(0, DescriptionTemplates.Length)];

            // Nudge the pin location slightly (~10–80 m) so every spot is unique
            double latOffset = (rng.Value() - 0.5) * 0.001;   // ±~55 m
            double lngOffset = (rng.Value() - 0.5) * 0.001;

            return new GeoHoleResult
            {
                Name = name,
                Description = description,
                Lat = lat + latOffset,
                Lng = lng + lngOffset
            };
        }

        // ── Helpers ───────────────────────────────────────────────────────

        /// <summary>
        /// Converts a coordinate pair to a stable uint seed.
        /// Quantises to ~11 m precision so nearby taps hit the same hole.
        /// </summary>
        private static uint CoordToSeed(double lat, double lng)
        {
            // Quantise to 4 decimal places (~11 m)
            int iLat = (int)Math.Round(lat * 1_0000);
            int iLng = (int)Math.Round(lng * 1_0000);

            // Mix the two ints into a single uint with FNV-1a inspired mixing
            uint h = 2166136261u;
            h = (h ^ (uint)iLat) * 16777619u;
            h = (h ^ (uint)iLng) * 16777619u;
            return h == 0 ? 1 : h;
        }
    }

    /// <summary>Result returned by <see cref="GeoHoleGenerator.GenerateHole"/>.</summary>
    public class GeoHoleResult
    {
        public string Name;
        public string Description;
        public double Lat;
        public double Lng;
    }
}
