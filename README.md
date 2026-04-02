# StreetGolf

A fast-turn, competitive golf game where holes are generated from neighborhood-inspired seeds. Built with Apple Arcade-quality architecture from day one.

## How to Run

1. **Open in Unity** (2022.3 LTS or later recommended)
   - Open Unity Hub
   - Click "Open" and select the `StreetGolf/` folder
   - Unity will import packages and compile scripts

2. **Set up scenes in Build Settings**
   - File → Build Settings
   - Add scenes in order: `TitleScene`, `GameScene`, `ResultScene`
   - All scenes are in `Assets/_Project/Scenes/`

3. **Create ScriptableObject config assets**
   - Right-click in `Assets/_Project/` → Create → StreetGolf → Terrain Config
   - Right-click → Create → StreetGolf → Ball Config
   - Right-click → Create → StreetGolf → Difficulty Config
   - Default values are built in — you can tune later

4. **Set up GameScene**
   - Create a Grid GameObject with two Tilemap children (Ground and Obstacles)
   - Add `TilemapBuilder` to the Grid, assign both Tilemaps
   - Create an empty GameObject with `TurnManager`, assign references
   - Create a Ball GameObject with `BallController` and `BallRenderer`
   - Add `PlayerInputHandler` to a scene GameObject
   - Add `CameraController` to the Main Camera
   - Assign config assets to `TurnManager` Inspector fields

5. **Play**
   - Enter Play Mode
   - Drag to aim (opposite direction), release to shoot
   - Complete the hole in as few strokes as possible

## What the MVP Includes

- **Procedural hole generation** — deterministic from seed, creates par-3 and short par-4 holes with interesting routing choices
- **Terrain system** — Road (fast), Rough (slow), Sand (very slow), Water (penalty), Building (bounce), Green (putting surface)
- **Touch/mouse aiming** — pull-back-and-release drag mechanic with power indicator
- **Custom ball physics** — fully deterministic Euler simulation with terrain friction, wall bounces, and water penalties
- **Stroke counting** — tracks shots and penalties
- **Hole completion** — ball-in-hole detection with speed threshold
- **Ghost shot replay** — opponent's shots play alongside yours
- **Challenge sharing** — encode/decode challenge codes with seed + shot data
- **3-scene flow** — Title → Game → Result with retry/new/share options
- **HUD** — stroke counter, par display, seed code

## What is Deferred (Not in MVP)

- Real GIS / map data integration
- Live multiplayer
- User accounts / authentication
- Backend services
- Cosmetics / skins / unlockables
- In-app purchases / monetization
- Weather systems
- Tournament systems
- Sound effects and music
- Advanced camera animations
- Decor objects (trees, lampposts, benches)
- Rule tiles for auto-tiling terrain edges
- iOS native share sheet integration
- Game Center (achievements, leaderboards, friend challenges)
- Cross-device save sync
- Controller input bindings
- Apple TV / iPad / Mac optimizations

## Architecture — Apple Arcade Alignment

This codebase is built to ship as a premium game, not a web toy:

- **No singletons pattern** — uses a lightweight `ServiceLocator` for dependency access. Easy to swap implementations for testing or platform differences.

- **Pure C# gameplay logic** — `BallSimulation`, `HoleGenerator`, `StrokeCounter`, `HazardHandler` have zero MonoBehaviour dependencies. They're unit-testable without Play Mode and portable across platforms.

- **Input abstraction** — `PlayerInputHandler` wraps all input. Adding controller support or Apple TV remote means adding new input paths in one file, zero gameplay code changes.

- **ScriptableObject configs** — `TerrainConfigSO`, `BallConfigSO`, `DifficultyConfigSO` allow tuning without code changes. Can be swapped per platform or difficulty level.

- **Deterministic simulation** — same seed + same shots = identical results across devices. This enables cross-device ghost replay, future Game Center challenges, and replay validation.

- **Clean scene flow** — `GameManager` handles scene transitions and session state. Future deep-linking (from Game Center invites) adds one entry point, not a rewrite.

- **No ads, no IAP, no analytics hooks** — the architecture has zero monetization coupling. The game loop stands on its own as a premium experience.

## Project Structure

```
StreetGolf/Assets/_Project/
  Scripts/
    Core/          — GameManager, ServiceLocator
    Data/          — TerrainType, HoleData, ShotData, ChallengeData, ChallengeCodec, GhostRun
    HoleGen/       — SeededRandom, HoleGenerator, RoutePlanner, TerrainPainter, ObstacleScatterer
    Gameplay/      — BallSimulation, BallController, AimController, ShotExecutor,
                     HazardHandler, HoleDetector, StrokeCounter, TurnManager
    Ghost/         — GhostRecorder, GhostPlayer, GhostBallView
    Input/         — PlayerInputHandler
    Rendering/     — TilemapBuilder, CameraController, BallRenderer
    UI/            — TitleUI, HUDController, AimLineRenderer, ResultUI,
                     ShareController, SeedEntryUI
    ScriptableObjects/ — TerrainConfigSO, BallConfigSO, DifficultyConfigSO
  Scenes/          — TitleScene, GameScene, ResultScene
  Tiles/           — Tile assets (create in Unity)
  Sprites/         — Art assets (create in Unity)
  Prefabs/         — Ball, GhostBall, HoleFlag
```
