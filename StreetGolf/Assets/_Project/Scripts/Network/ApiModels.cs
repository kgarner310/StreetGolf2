using System;

namespace StreetGolf.Network
{
    /// <summary>
    /// Matches GET /v1/daily-hole response.
    /// Field names use snake_case to match the API JSON directly.
    /// </summary>
    [Serializable]
    public class DailyHoleResponse
    {
        public int id;
        public float lat;
        public float lng;
        public string name;
        public string description;
        public float persistence_score;
        public string status;
    }

    /// <summary>
    /// Body for POST /v1/vote.
    /// </summary>
    [Serializable]
    public class VoteRequest
    {
        public int user_id;
        public int hole_id;
        public string vote;   // "up" or "down"
        public string reason; // nullable — leave empty string for none
    }

    /// <summary>
    /// Matches POST /v1/vote response.
    /// </summary>
    [Serializable]
    public class VoteResponse
    {
        public int id;
        public int user_id;
        public int hole_id;
        public string vote;
        public float persistence_score;
        public string status;
    }
}
