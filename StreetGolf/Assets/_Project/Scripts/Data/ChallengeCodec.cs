using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using UnityEngine;

namespace StreetGolf.Data
{
    /// <summary>
    /// Encodes/decodes ChallengeData to compact shareable strings.
    /// Format: "SG-{seed_hex}:{par}:{strokes}:{shot_data_base64}"
    /// Shot data is packed as: angle(float16),power(float16),startX(float16),startY(float16) per shot.
    /// </summary>
    public static class ChallengeCodec
    {
        private const string Prefix = "SG-";
        private const char Separator = ':';

        /// <summary>
        /// Encode a seed-only code (no shot data) for simple hole sharing.
        /// Returns something like "SG-A1B2C3D4"
        /// </summary>
        public static string EncodeSeed(uint seed)
        {
            return Prefix + seed.ToString("X8");
        }

        /// <summary>
        /// Decode a seed from a seed-only code.
        /// </summary>
        public static bool TryDecodeSeed(string code, out uint seed)
        {
            seed = 0;
            if (string.IsNullOrEmpty(code)) return false;

            string trimmed = code.Trim().ToUpperInvariant();
            if (trimmed.StartsWith(Prefix))
                trimmed = trimmed.Substring(Prefix.Length);

            // Could be just a seed (8 hex chars) or a full challenge (seed:par:strokes:shots)
            string seedPart = trimmed.Split(Separator)[0];
            return uint.TryParse(seedPart, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out seed);
        }

        /// <summary>
        /// Encode a full challenge (seed + shots) for friend sharing.
        /// </summary>
        public static string Encode(ChallengeData challenge)
        {
            var sb = new StringBuilder();
            sb.Append(Prefix);
            sb.Append(challenge.Seed.ToString("X8"));
            sb.Append(Separator);
            sb.Append(challenge.Par);
            sb.Append(Separator);
            sb.Append(challenge.Strokes);
            sb.Append(Separator);
            sb.Append(EncodeShotList(challenge.Shots));
            return sb.ToString();
        }

        /// <summary>
        /// Decode a full challenge from a shared string.
        /// Returns null if the string is not a valid challenge code.
        /// </summary>
        public static ChallengeData Decode(string code)
        {
            if (string.IsNullOrEmpty(code)) return null;

            string trimmed = code.Trim().ToUpperInvariant();
            if (trimmed.StartsWith(Prefix))
                trimmed = trimmed.Substring(Prefix.Length);

            string[] parts = trimmed.Split(Separator);
            if (parts.Length < 4) return null;

            if (!uint.TryParse(parts[0], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out uint seed))
                return null;
            if (!int.TryParse(parts[1], out int par)) return null;
            if (!int.TryParse(parts[2], out int strokes)) return null;

            List<ShotData> shots = DecodeShotList(parts[3]);
            if (shots == null) return null;

            return new ChallengeData(seed, par, strokes, shots);
        }

        /// <summary>
        /// Check if a string looks like a full challenge (has shot data) vs just a seed.
        /// </summary>
        public static bool IsFullChallenge(string code)
        {
            if (string.IsNullOrEmpty(code)) return false;
            string trimmed = code.Trim().ToUpperInvariant();
            if (trimmed.StartsWith(Prefix))
                trimmed = trimmed.Substring(Prefix.Length);
            return trimmed.Split(Separator).Length >= 4;
        }

        // Pack each shot as 4 half-precision-ish values into bytes
        // For MVP simplicity: use fixed-point with 1 decimal place
        private static string EncodeShotList(List<ShotData> shots)
        {
            if (shots == null || shots.Count == 0) return "";

            // Simple compact format: angle,power,sx,sy;angle,power,sx,sy;...
            var sb = new StringBuilder();
            for (int i = 0; i < shots.Count; i++)
            {
                if (i > 0) sb.Append(';');
                var s = shots[i];
                sb.AppendFormat(CultureInfo.InvariantCulture,
                    "{0:F1},{1:F2},{2:F1},{3:F1}",
                    s.Angle, s.Power, s.StartPos.x, s.StartPos.y);
            }

            // Base64 encode the CSV to make it more compact and URL-safe
            byte[] bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return Convert.ToBase64String(bytes).TrimEnd('=');
        }

        private static List<ShotData> DecodeShotList(string encoded)
        {
            if (string.IsNullOrEmpty(encoded)) return new List<ShotData>();

            try
            {
                // Restore base64 padding
                int pad = (4 - encoded.Length % 4) % 4;
                string padded = encoded + new string('=', pad);
                byte[] bytes = Convert.FromBase64String(padded);
                string csv = Encoding.UTF8.GetString(bytes);

                string[] shotStrings = csv.Split(';');
                var shots = new List<ShotData>(shotStrings.Length);

                foreach (string shotStr in shotStrings)
                {
                    if (string.IsNullOrEmpty(shotStr)) continue;
                    string[] vals = shotStr.Split(',');
                    if (vals.Length < 4) continue;

                    shots.Add(new ShotData
                    {
                        Angle = float.Parse(vals[0], CultureInfo.InvariantCulture),
                        Power = float.Parse(vals[1], CultureInfo.InvariantCulture),
                        StartPos = new Vector2(
                            float.Parse(vals[2], CultureInfo.InvariantCulture),
                            float.Parse(vals[3], CultureInfo.InvariantCulture))
                    });
                }

                return shots;
            }
            catch
            {
                return null;
            }
        }
    }
}
