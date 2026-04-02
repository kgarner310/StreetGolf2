namespace StreetGolf.Data
{
    /// <summary>
    /// Every cell in the hole grid has exactly one terrain type.
    /// Byte-sized for compact serialization.
    /// </summary>
    public enum TerrainType : byte
    {
        Tee      = 0,  // Starting pad — same physics as Road
        Road     = 1,  // Fast surface — main fairway equivalent
        Rough    = 2,  // Slow surface — default ground cover
        Sand     = 3,  // Very slow — bunker hazard
        Water    = 4,  // Penalty — 1 stroke + reposition to last valid spot
        Building = 5,  // Impassable wall — ball bounces off
        Green    = 6   // Around the hole — moderate speed, low friction
    }
}
