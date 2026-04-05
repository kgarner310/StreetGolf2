#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Tilemaps;
using UnityEngine.UI;
using TMPro;
using StreetGolf.Config;
using StreetGolf.Core;
using StreetGolf.Gameplay;
using StreetGolf.Rendering;
using StreetGolf.Input;
using StreetGolf.UI;

namespace StreetGolf.Editor
{
    /// <summary>
    /// Builds all three game scenes and wires every serialized field.
    /// Run once via the menu: StreetGolf > Build All Scenes
    /// Safe to re-run — existing config assets are reused, scenes are overwritten.
    /// </summary>
    public static class SceneBuilder
    {
        private const string ScenesPath  = "Assets/_Project/Scenes";
        private const string ConfigPath  = "Assets/_Project/Config";

        [MenuItem("StreetGolf/Build All Scenes")]
        public static void BuildAllScenes()
        {
            EnsureFolder("Assets/_Project");
            EnsureFolder(ScenesPath);
            EnsureFolder(ConfigPath);

            var ball      = GetOrCreate<BallConfigSO>      ($"{ConfigPath}/BallConfig.asset");
            var diff      = GetOrCreate<DifficultyConfigSO>($"{ConfigPath}/DifficultyConfig.asset");
            var terrain   = GetOrCreate<TerrainConfigSO>   ($"{ConfigPath}/TerrainConfig.asset");

            BuildTitleScene();
            BuildGameScene(ball, diff, terrain);
            BuildResultScene();
            UpdateBuildSettings();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[SceneBuilder] Done! Open Assets/_Project/Scenes/TitleScene.unity to start.");
        }

        // ─────────────────────────────────────────────────────────────────
        // TITLE SCENE
        // ─────────────────────────────────────────────────────────────────

        private static void BuildTitleScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            MakeEventSystem();

            // Camera (required even for ScreenSpaceOverlay UI)
            var camGO = new GameObject("Main Camera");
            camGO.tag = "MainCamera";
            var cam = camGO.AddComponent<Camera>();
            cam.orthographic = true;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.05f, 0.15f, 0.05f);
            camGO.transform.position = new Vector3(0, 0, -10);

            var canvas = MakeCanvas("Canvas", 1080, 1920);

            // Title text
            var titleText = MakeText(canvas.transform, "TitleText", "STREET GOLF", 80,
                                     new Vector2(0, 700), new Vector2(900, 100));

            // Daily hole info
            var dailyPanel = MakePanel(canvas.transform, "DailyHolePanel", new Vector2(860, 110), true);
            Anchored(dailyPanel, new Vector2(0, 380));
            var holeNameText   = MakeText(dailyPanel.transform, "DailyHoleName",   "",           34, new Vector2(0,  22), new Vector2(820, 44));
            var holeStatusText = MakeText(dailyPanel.transform, "DailyHoleStatus", "Loading…",   26, new Vector2(0, -22), new Vector2(820, 36));

            // Buttons
            var dailyBtn     = MakeButton(canvas.transform, "DailyHoleButton", "Play Today's Hole", new Vector2(560, 110), new Vector2(0, 230));
            var playBtn      = MakeButton(canvas.transform, "PlayButton",       "Play Random",          new Vector2(420,  90), new Vector2(0, 100));
            var challengeBtn = MakeButton(canvas.transform, "ChallengeButton",  "Challenge",            new Vector2(420,  90), new Vector2(0,  -10));
            dailyBtn.GetComponent<Button>().interactable = false;

            // Seed entry panel (hidden by default)
            var seedPanel = MakePanel(canvas.transform, "SeedEntryPanel", new Vector2(860, 420), false);
            Anchored(seedPanel, new Vector2(0, -150));
            var codeInput  = MakeInputField(seedPanel.transform, "CodeInput",    "Paste or type code…", new Vector2(700, 80), new Vector2(0,  130));
            var goBtn      = MakeButton    (seedPanel.transform, "GoButton",     "Go",                  new Vector2(200, 70), new Vector2(-220, 30));
            var pasteBtn   = MakeButton    (seedPanel.transform, "PasteButton",  "Paste",               new Vector2(200, 70), new Vector2(   0, 30));
            var cancelBtn  = MakeButton    (seedPanel.transform, "CancelButton", "Cancel",              new Vector2(200, 70), new Vector2( 220, 30));
            var errorText  = MakeText      (seedPanel.transform, "ErrorText",    "",                    24, new Vector2(0, -60), new Vector2(780, 36));

            // TitleUI
            var titleUI = canvas.AddComponent<TitleUI>();
            SetRef(titleUI, "_playButton",          playBtn.GetComponent<Button>());
            SetRef(titleUI, "_challengeButton",     challengeBtn.GetComponent<Button>());
            SetRef(titleUI, "_dailyHoleButton",     dailyBtn.GetComponent<Button>());
            SetRef(titleUI, "_dailyHoleNameText",   holeNameText.GetComponent<TMP_Text>());
            SetRef(titleUI, "_dailyHoleStatusText", holeStatusText.GetComponent<TMP_Text>());
            SetRef(titleUI, "_seedEntryPanel",      seedPanel);
            SetRef(titleUI, "_titleText",           titleText.GetComponent<TMP_Text>());

            // SeedEntryUI
            var seedUI = seedPanel.AddComponent<SeedEntryUI>();
            SetRef(seedUI, "_codeInput",    codeInput.GetComponent<TMP_InputField>());
            SetRef(seedUI, "_goButton",     goBtn.GetComponent<Button>());
            SetRef(seedUI, "_pasteButton",  pasteBtn.GetComponent<Button>());
            SetRef(seedUI, "_cancelButton", cancelBtn.GetComponent<Button>());
            SetRef(seedUI, "_errorText",    errorText.GetComponent<TMP_Text>());

            bool savedTitle = EditorSceneManager.SaveScene(scene, $"{ScenesPath}/TitleScene.unity");
            if (!savedTitle) Debug.LogError("[SceneBuilder] FAILED to save TitleScene!");
            else Debug.Log("[SceneBuilder] TitleScene saved.");
        }

        // ─────────────────────────────────────────────────────────────────
        // GAME SCENE
        // ─────────────────────────────────────────────────────────────────

        private static void BuildGameScene(BallConfigSO ballCfg, DifficultyConfigSO diffCfg, TerrainConfigSO terrainCfg)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            MakeEventSystem();

            // Camera
            var camGO = new GameObject("Main Camera");
            camGO.tag = "MainCamera";
            var cam = camGO.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 12;
            cam.backgroundColor = new Color(0.18f, 0.36f, 0.18f);
            camGO.transform.position = new Vector3(12, 18, -10);
            var camCtrl = camGO.AddComponent<CameraController>();

            // Grid + Tilemaps
            var gridGO = new GameObject("Grid");
            gridGO.AddComponent<Grid>().cellSize = Vector3.one;

            var groundGO = new GameObject("Ground");
            groundGO.transform.SetParent(gridGO.transform, false);
            var groundTilemap = groundGO.AddComponent<Tilemap>();
            groundGO.AddComponent<TilemapRenderer>().sortingOrder = 0;

            var obstacleGO = new GameObject("Obstacles");
            obstacleGO.transform.SetParent(gridGO.transform, false);
            var obstacleTilemap = obstacleGO.AddComponent<Tilemap>();
            obstacleGO.AddComponent<TilemapRenderer>().sortingOrder = 1;

            var tilemapBuilder = gridGO.AddComponent<TilemapBuilder>();
            SetRef(tilemapBuilder, "_groundTilemap",   groundTilemap);
            SetRef(tilemapBuilder, "_obstacleTilemap", obstacleTilemap);

            // Ball — BallRenderer creates its own sprite procedurally
            var ballGO = new GameObject("Ball");
            ballGO.AddComponent<BallRenderer>();
            var ballCtrl = ballGO.AddComponent<BallController>();

            // Input handler
            var inputGO      = new GameObject("Input");
            var inputHandler = inputGO.AddComponent<PlayerInputHandler>();

            // Game controller (TurnManager + scene bootstrapper)
            var controllerGO  = new GameObject("GameController");
            var turnManager   = controllerGO.AddComponent<TurnManager>();
            SetRef(turnManager, "_ball",             ballCtrl);
            SetRef(turnManager, "_input",            inputHandler);
            SetRef(turnManager, "_tilemapBuilder",   tilemapBuilder);
            SetRef(turnManager, "_cameraController", camCtrl);
            SetRef(turnManager, "_terrainConfig",    terrainCfg);
            SetRef(turnManager, "_ballConfig",       ballCfg);
            SetRef(turnManager, "_difficultyConfig", diffCfg);

            // HUD
            var hudCanvas   = MakeCanvas("HUDCanvas", 1080, 1920);
            var strokeText  = MakeText(hudCanvas.transform, "StrokeText",  "STROKE  0", 42, new Vector2(-300, 900), new Vector2(500, 60));
            var parText     = MakeText(hudCanvas.transform, "ParText",     "PAR 3",     42, new Vector2( 200, 900), new Vector2(280, 60));
            var seedText    = MakeText(hudCanvas.transform, "SeedText",    "",          26, new Vector2(   0, 820), new Vector2(700, 40));
            var penaltyText = MakeText(hudCanvas.transform, "PenaltyText", "",          54, new Vector2(   0,   0), new Vector2(800, 80));

            var hud = hudCanvas.AddComponent<HUDController>();
            SetRef(hud, "_strokeText",  strokeText.GetComponent<TMP_Text>());
            SetRef(hud, "_parText",     parText.GetComponent<TMP_Text>());
            SetRef(hud, "_seedText",    seedText.GetComponent<TMP_Text>());
            SetRef(hud, "_penaltyText", penaltyText.GetComponent<TMP_Text>());

            // Wire TurnManager → HUDController via bootstrapper
            var sceneCtrl = controllerGO.AddComponent<GameSceneController>();
            SetRef(sceneCtrl, "_turnManager", turnManager);
            SetRef(sceneCtrl, "_hud",         hud);

            bool savedGame = EditorSceneManager.SaveScene(scene, $"{ScenesPath}/GameScene.unity");
            if (!savedGame) Debug.LogError("[SceneBuilder] FAILED to save GameScene!");
            else Debug.Log("[SceneBuilder] GameScene saved.");
        }

        // ─────────────────────────────────────────────────────────────────
        // RESULT SCENE
        // ─────────────────────────────────────────────────────────────────

        private static void BuildResultScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            MakeEventSystem();

            var camGO = new GameObject("Main Camera");
            camGO.tag = "MainCamera";
            var cam = camGO.AddComponent<Camera>();
            cam.orthographic = true;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.05f, 0.15f, 0.05f);
            camGO.transform.position = new Vector3(0, 0, -10);

            var canvas = MakeCanvas("Canvas", 1080, 1920);

            // Score display
            var scoreNameText = MakeText(canvas.transform, "ScoreNameText", "Birdie!",  80, new Vector2(0, 600), new Vector2(900, 110));
            var strokesText   = MakeText(canvas.transform, "StrokesText",   "2",       130, new Vector2(0, 440), new Vector2(400, 160));
            var parText       = MakeText(canvas.transform, "ParText",       "PAR 3",    42, new Vector2(0, 320), new Vector2(400,  60));
            var seedText      = MakeText(canvas.transform, "SeedText",      "",         26, new Vector2(0, 255), new Vector2(700,  40));

            // Challenge comparison panel (hidden unless it's a challenge run)
            var challengePanel   = MakePanel(canvas.transform, "ChallengePanel", new Vector2(760, 100), false);
            Anchored(challengePanel, new Vector2(0, 170));
            var opponentText     = MakeText(challengePanel.transform, "OpponentStrokesText", "Opponent: 3",   30, new Vector2(-200, 0), new Vector2(340, 50));
            var compareText      = MakeText(challengePanel.transform, "ResultCompareText",   "You win by 1!", 30, new Vector2( 200, 0), new Vector2(340, 50));

            // Vote panel — visible for daily holes
            var votePanel      = MakePanel(canvas.transform, "VotePanel", new Vector2(760, 200), true);
            Anchored(votePanel, new Vector2(0, 30));
            MakeText(votePanel.transform, "VotePrompt", "How was this hole?", 30, new Vector2(0, 70), new Vector2(700, 44));
            var thumbsUpBtn    = MakeButton(votePanel.transform, "ThumbsUpButton",   "Good Hole",  new Vector2(280, 80), new Vector2(-170, -20));
            var thumbsDownBtn  = MakeButton(votePanel.transform, "ThumbsDownButton", "Bad Hole",   new Vector2(280, 80), new Vector2( 170, -20));
            var voteStatusText = MakeText  (votePanel.transform, "VoteStatusText",   "",              24, new Vector2(0, -90), new Vector2(700, 40));

            // Action buttons
            var retryBtn    = MakeButton(canvas.transform, "RetryButton",    "Retry",     new Vector2(300, 80), new Vector2(-270, -320));
            var newHoleBtn  = MakeButton(canvas.transform, "NewHoleButton",  "New Hole",  new Vector2(300, 80), new Vector2(   0, -320));
            var shareBtn    = MakeButton(canvas.transform, "ShareButton",    "Share",     new Vector2(300, 80), new Vector2( 270, -320));
            var mainMenuBtn = MakeButton(canvas.transform, "MainMenuButton", "Main Menu", new Vector2(440, 80), new Vector2(   0, -430));

            // ResultUI
            var resultUI = canvas.AddComponent<ResultUI>();
            SetRef(resultUI, "_scoreNameText",       scoreNameText.GetComponent<TMP_Text>());
            SetRef(resultUI, "_strokesText",         strokesText.GetComponent<TMP_Text>());
            SetRef(resultUI, "_parText",             parText.GetComponent<TMP_Text>());
            SetRef(resultUI, "_seedText",            seedText.GetComponent<TMP_Text>());
            SetRef(resultUI, "_challengePanel",      challengePanel);
            SetRef(resultUI, "_opponentStrokesText", opponentText.GetComponent<TMP_Text>());
            SetRef(resultUI, "_resultCompareText",   compareText.GetComponent<TMP_Text>());
            SetRef(resultUI, "_votePanel",           votePanel);
            SetRef(resultUI, "_thumbsUpButton",      thumbsUpBtn.GetComponent<Button>());
            SetRef(resultUI, "_thumbsDownButton",    thumbsDownBtn.GetComponent<Button>());
            SetRef(resultUI, "_voteStatusText",      voteStatusText.GetComponent<TMP_Text>());
            SetRef(resultUI, "_retryButton",         retryBtn.GetComponent<Button>());
            SetRef(resultUI, "_newHoleButton",       newHoleBtn.GetComponent<Button>());
            SetRef(resultUI, "_shareButton",         shareBtn.GetComponent<Button>());
            SetRef(resultUI, "_mainMenuButton",      mainMenuBtn.GetComponent<Button>());

            bool savedResult = EditorSceneManager.SaveScene(scene, $"{ScenesPath}/ResultScene.unity");
            if (!savedResult) Debug.LogError("[SceneBuilder] FAILED to save ResultScene!");
            else Debug.Log("[SceneBuilder] ResultScene saved.");
        }

        // ─────────────────────────────────────────────────────────────────
        // Build settings
        // ─────────────────────────────────────────────────────────────────

        private static void UpdateBuildSettings()
        {
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene($"{ScenesPath}/TitleScene.unity",  true),
                new EditorBuildSettingsScene($"{ScenesPath}/GameScene.unity",   true),
                new EditorBuildSettingsScene($"{ScenesPath}/ResultScene.unity", true),
            };
            Debug.Log("[SceneBuilder] Build settings updated.");
        }

        // ─────────────────────────────────────────────────────────────────
        // UI helpers
        // ─────────────────────────────────────────────────────────────────

        private static void MakeEventSystem()
        {
            var go = new GameObject("EventSystem");
            go.AddComponent<EventSystem>();
            go.AddComponent<StandaloneInputModule>();
        }

        private static GameObject MakeCanvas(string name, float refW, float refH)
        {
            var go     = new GameObject(name);
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = go.AddComponent<CanvasScaler>();
            scaler.uiScaleMode        = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(refW, refH);
            scaler.matchWidthOrHeight  = 0.5f;
            go.AddComponent<GraphicRaycaster>();
            return go;
        }

        private static GameObject MakeText(Transform parent, string name, string content,
            float fontSize, Vector2 anchoredPos, Vector2 sizeDelta)
        {
            var go   = new GameObject(name);
            go.transform.SetParent(parent, false);
            var t    = go.AddComponent<TextMeshProUGUI>();
            t.text      = content;
            t.fontSize  = fontSize;
            t.alignment = TextAlignmentOptions.Center;
            t.color     = Color.white;
            var r    = go.GetComponent<RectTransform>();
            r.sizeDelta       = sizeDelta;
            r.anchoredPosition = anchoredPos;
            return go;
        }

        private static GameObject MakeButton(Transform parent, string name, string label,
            Vector2 size, Vector2 anchoredPos)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.AddComponent<Image>().color = new Color(0.12f, 0.48f, 0.22f);
            go.AddComponent<Button>();
            var r  = go.GetComponent<RectTransform>();
            r.sizeDelta        = size;
            r.anchoredPosition = anchoredPos;

            var labelGO = new GameObject("Label");
            labelGO.transform.SetParent(go.transform, false);
            var t = labelGO.AddComponent<TextMeshProUGUI>();
            t.text      = label;
            t.fontSize  = 30;
            t.alignment = TextAlignmentOptions.Center;
            t.color     = Color.white;
            var lr = labelGO.GetComponent<RectTransform>();
            lr.anchorMin = Vector2.zero;
            lr.anchorMax = Vector2.one;
            lr.offsetMin = Vector2.zero;
            lr.offsetMax = Vector2.zero;
            return go;
        }

        private static GameObject MakePanel(Transform parent, string name, Vector2 size, bool active)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.AddComponent<Image>().color = new Color(0f, 0f, 0f, 0.45f);
            go.GetComponent<RectTransform>().sizeDelta = size;
            go.SetActive(active);
            return go;
        }

        private static GameObject MakeInputField(Transform parent, string name, string placeholder,
            Vector2 size, Vector2 anchoredPos)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.AddComponent<Image>().color = new Color(0.92f, 0.92f, 0.92f);
            var field = go.AddComponent<TMP_InputField>();
            var r     = go.GetComponent<RectTransform>();
            r.sizeDelta        = size;
            r.anchoredPosition = anchoredPos;

            // Text viewport
            var viewport = new GameObject("Text Area");
            viewport.transform.SetParent(go.transform, false);
            var vr = viewport.AddComponent<RectTransform>(); // explicit — Editor scripts don't auto-add
            vr.anchorMin = Vector2.zero; vr.anchorMax = Vector2.one;
            vr.offsetMin = new Vector2(10, 6); vr.offsetMax = new Vector2(-10, -6);
            viewport.AddComponent<RectMask2D>();

            // Placeholder
            var phGO = new GameObject("Placeholder");
            phGO.transform.SetParent(viewport.transform, false);
            var ph   = phGO.AddComponent<TextMeshProUGUI>();
            ph.text    = placeholder;
            ph.color   = new Color(0.5f, 0.5f, 0.5f);
            ph.fontSize = 28;
            FillParent(phGO.GetComponent<RectTransform>());

            // Input text
            var inputTextGO = new GameObject("Text");
            inputTextGO.transform.SetParent(viewport.transform, false);
            var inputText = inputTextGO.AddComponent<TextMeshProUGUI>();
            inputText.fontSize = 28;
            inputText.color    = Color.black;
            FillParent(inputTextGO.GetComponent<RectTransform>());

            field.textViewport  = vr;
            field.textComponent = inputText;
            field.placeholder   = ph;
            return go;
        }

        private static void Anchored(GameObject go, Vector2 pos) =>
            go.GetComponent<RectTransform>().anchoredPosition = pos;

        private static void FillParent(RectTransform r)
        {
            r.anchorMin = Vector2.zero; r.anchorMax = Vector2.one;
            r.offsetMin = Vector2.zero; r.offsetMax = Vector2.zero;
        }

        // ─────────────────────────────────────────────────────────────────
        // Serialized field assignment via SerializedObject
        // ─────────────────────────────────────────────────────────────────

        private static void SetRef(Object target, string field, Object value)
        {
            var so   = new SerializedObject(target);
            var prop = so.FindProperty(field);
            if (prop == null)
            {
                Debug.LogWarning($"[SceneBuilder] '{field}' not found on {target.GetType().Name}");
                return;
            }
            prop.objectReferenceValue = value;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        // ─────────────────────────────────────────────────────────────────
        // Asset helpers
        // ─────────────────────────────────────────────────────────────────

        private static void EnsureFolder(string path)
        {
            // Ensure the directory exists on disk first, then register with AssetDatabase
            string fullPath = Path.GetFullPath(path);
            if (!Directory.Exists(fullPath))
                Directory.CreateDirectory(fullPath);

            if (!AssetDatabase.IsValidFolder(path))
            {
                string parent = Path.GetDirectoryName(path)!.Replace('\\', '/');
                string folder = Path.GetFileName(path);
                AssetDatabase.CreateFolder(parent, folder);
                AssetDatabase.Refresh();
            }
        }

        private static T GetOrCreate<T>(string assetPath) where T : ScriptableObject
        {
            var existing = AssetDatabase.LoadAssetAtPath<T>(assetPath);
            if (existing != null) return existing;
            var asset = ScriptableObject.CreateInstance<T>();
            AssetDatabase.CreateAsset(asset, assetPath);
            return asset;
        }
    }
}
#endif
