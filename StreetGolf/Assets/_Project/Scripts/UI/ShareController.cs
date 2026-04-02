using UnityEngine;
using StreetGolf.Core;
using StreetGolf.Data;

namespace StreetGolf.UI
{
    /// <summary>
    /// Handles encoding and sharing challenge data.
    /// For MVP: copies to system clipboard.
    /// Future: native share sheet on iOS via plugin.
    /// </summary>
    public static class ShareController
    {
        /// <summary>
        /// Build and share a challenge from a hole result.
        /// Returns the share text that was copied to clipboard.
        /// </summary>
        public static string ShareResult(HoleResult result)
        {
            if (result == null) return null;

            var challenge = result.ToChallengeData();
            string code = ChallengeCodec.Encode(challenge);
            string seedDisplay = ChallengeCodec.EncodeSeed(result.Seed);

            string shareText =
                $"StreetGolf Challenge!\n" +
                $"Hole: {seedDisplay}\n" +
                $"Score: {result.ScoreName} ({result.Strokes} strokes, Par {result.Par})\n" +
                $"\nCan you beat me? Paste this code:\n{code}";

            CopyToClipboard(shareText);
            return shareText;
        }

        /// <summary>
        /// Copy text to the system clipboard.
        /// Works in Unity Editor and standalone builds.
        /// </summary>
        public static void CopyToClipboard(string text)
        {
            GUIUtility.systemCopyBuffer = text;
        }

        /// <summary>
        /// Read text from the system clipboard.
        /// </summary>
        public static string PasteFromClipboard()
        {
            return GUIUtility.systemCopyBuffer;
        }
    }
}
