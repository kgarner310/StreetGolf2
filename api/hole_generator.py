"""
Mock hole generator that mirrors the C# HoleGenerator logic in Python.
Uses a simple xorshift32 RNG matching SeededRandom.cs for reproducibility.
"""
from __future__ import annotations

import hashlib
from datetime import date, datetime, timezone

from models import HoleData, Position, TerrainType


def _xorshift32(state: int) -> int:
    """Single xorshift32 step, matching SeededRandom.cs."""
    state ^= (state << 13) & 0xFFFFFFFF
    state ^= (state >> 17) & 0xFFFFFFFF
    state ^= (state << 5) & 0xFFFFFFFF
    return state & 0xFFFFFFFF


class SeededRandom:
    def __init__(self, seed: int) -> None:
        self._state = seed if seed != 0 else 1

    def next_uint(self) -> int:
        self._state = _xorshift32(self._state)
        return self._state

    def range_int(self, lo: int, hi: int) -> int:
        """[lo, hi)"""
        return lo + self.next_uint() % (hi - lo)

    def value(self) -> float:
        return self.next_uint() / 0xFFFFFFFF

    def chance(self, probability: float) -> bool:
        return self.value() < probability


def _date_to_seed(d: date) -> int:
    """Deterministic daily seed from calendar date."""
    digest = hashlib.sha256(d.isoformat().encode()).digest()
    return int.from_bytes(digest[:4], "big") | 1  # ensure non-zero


def _generate_hole(seed: int) -> HoleData:
    rng = SeededRandom(seed)

    is_par3 = rng.chance(0.65)
    par = 3 if is_par3 else 4
    width = 24 if is_par3 else 28
    height = 36 if is_par3 else 48

    # Fill with rough
    grid = [TerrainType.rough.value] * (width * height)

    def cell(x: int, y: int) -> int:
        return y * width + x

    def set_terrain(x: int, y: int, t: TerrainType) -> None:
        if 0 <= x < width and 0 <= y < height:
            grid[cell(x, y)] = t.value

    # Place tee near bottom centre
    tee_x = width // 2 + rng.range_int(-2, 3)
    tee_y = 2 + rng.range_int(0, 3)
    tee_pos = Position(x=tee_x, y=tee_y)

    # Place hole near top centre
    hole_x = width // 2 + rng.range_int(-3, 4)
    hole_y = height - 4 - rng.range_int(0, 4)
    hole_pos = Position(x=hole_x, y=hole_y)

    # Paint tee zone (radius 2)
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            set_terrain(tee_x + dx, tee_y + dy, TerrainType.tee)

    # Paint green zone (radius 3)
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            set_terrain(hole_x + dx, hole_y + dy, TerrainType.green)

    # Carve a road path with 2-3 waypoints
    waypoint_count = rng.range_int(2, 4)
    waypoints = [(tee_x, tee_y)]
    for _ in range(waypoint_count):
        wx = rng.range_int(3, width - 3)
        wy = rng.range_int(tee_y + 4, hole_y - 4) if hole_y - tee_y > 8 else rng.range_int(tee_y + 2, hole_y - 2)
        waypoints.append((wx, wy))
    waypoints.append((hole_x, hole_y))

    # Carve road along waypoints (path width 3)
    for i in range(len(waypoints) - 1):
        ax, ay = waypoints[i]
        bx, by = waypoints[i + 1]
        steps = max(abs(bx - ax), abs(by - ay))
        for s in range(steps + 1):
            t = s / max(steps, 1)
            px = round(ax + (bx - ax) * t)
            py = round(ay + (by - ay) * t)
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    nx, ny = px + dx, py + dy
                    if grid[cell(nx, ny)] == TerrainType.rough.value if 0 <= nx < width and 0 <= ny < height else False:
                        set_terrain(nx, ny, TerrainType.road)

    # Scatter hazards (buildings ~8%, water ~5%, sand ~4%)
    for x in range(width):
        for y in range(height):
            if grid[cell(x, y)] != TerrainType.rough.value:
                continue
            r = rng.value()
            if r < 0.08:
                set_terrain(x, y, TerrainType.building)
            elif r < 0.13:
                set_terrain(x, y, TerrainType.water)
            elif r < 0.17:
                set_terrain(x, y, TerrainType.sand)

    hole_id = f"{seed:08x}"
    return HoleData(
        id=hole_id,
        seed=seed,
        par=par,
        width=width,
        height=height,
        tee_pos=tee_pos,
        hole_pos=hole_pos,
        grid=grid,
        persistence_score=0.0,
        created_at=datetime.now(timezone.utc),
    )


def get_daily_hole() -> HoleData:
    """Generate (or return cached) hole for today."""
    today = date.today()
    seed = _date_to_seed(today)
    return _generate_hole(seed)


def get_hole_by_seed(seed: int) -> HoleData:
    return _generate_hole(seed)
