namespace StreetGolf.Data
{
    /// <summary>
    /// Lifecycle state of a hole, derived from its persistence_score.
    /// </summary>
    public enum HoleLifecycleStatus
    {
        /// <summary>Default — hole is active and being evaluated.</summary>
        Active,

        /// <summary>persistence_score &lt; -2 — hole is no longer relevant, retire it.</summary>
        Expired,

        /// <summary>persistence_score &gt; 3 — hole is well-liked, keep it around longer.</summary>
        Sticky,

        /// <summary>persistence_score &gt; 6 — hole is a crowd favourite, surface it repeatedly.</summary>
        Recurring,
    }
}
