using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace StreetGolf.Network
{
    /// <summary>
    /// HTTP client for the StreetGolf backend API.
    /// Lives on a DontDestroyOnLoad GameObject; access via ApiClient.Instance.
    ///
    /// To point at a real server change BaseUrl below, or set it at runtime
    /// before the first call (e.g. from a build config script).
    /// </summary>
    public class ApiClient : MonoBehaviour
    {
        // ---------------------------------------------------------------
        // Configuration — change this to your server address when deployed
        // ---------------------------------------------------------------
        public static string BaseUrl = "http://localhost:8000";

        // ---------------------------------------------------------------
        // Singleton
        // ---------------------------------------------------------------
        private static ApiClient _instance;

        public static ApiClient Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("[ApiClient]");
                    _instance = go.AddComponent<ApiClient>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ---------------------------------------------------------------
        // Public API
        // ---------------------------------------------------------------

        /// <summary>Fetch the current daily hole.</summary>
        public void GetDailyHole(Action<DailyHoleResponse> onSuccess, Action<string> onError)
        {
            StartCoroutine(Get($"{BaseUrl}/v1/daily-hole", onSuccess, onError));
        }

        /// <summary>Submit a thumbs-up or thumbs-down vote for a hole.</summary>
        public void SubmitVote(VoteRequest request, Action<VoteResponse> onSuccess, Action<string> onError)
        {
            StartCoroutine(Post($"{BaseUrl}/v1/vote", request, onSuccess, onError));
        }

        // ---------------------------------------------------------------
        // Helpers
        // ---------------------------------------------------------------

        private IEnumerator Get<T>(string url, Action<T> onSuccess, Action<string> onError)
        {
            using var req = UnityWebRequest.Get(url);
            req.SetRequestHeader("Accept", "application/json");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke(req.error);
                yield break;
            }

            try
            {
                onSuccess?.Invoke(JsonUtility.FromJson<T>(req.downloadHandler.text));
            }
            catch (Exception e)
            {
                onError?.Invoke(e.Message);
            }
        }

        private IEnumerator Post<TReq, TRes>(string url, TReq body,
            Action<TRes> onSuccess, Action<string> onError)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(JsonUtility.ToJson(body));

            using var req = new UnityWebRequest(url, "POST");
            req.uploadHandler = new UploadHandlerRaw(bytes);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            req.SetRequestHeader("Accept", "application/json");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke($"{req.error}: {req.downloadHandler.text}");
                yield break;
            }

            try
            {
                onSuccess?.Invoke(JsonUtility.FromJson<TRes>(req.downloadHandler.text));
            }
            catch (Exception e)
            {
                onError?.Invoke(e.Message);
            }
        }

        // ---------------------------------------------------------------
        // User identity — generated once, stored in PlayerPrefs
        // ---------------------------------------------------------------

        /// <summary>
        /// Returns a stable integer user ID persisted in PlayerPrefs.
        /// Generated on first call; reused on every subsequent launch.
        /// </summary>
        public static int GetOrCreateUserId()
        {
            const string key = "StreetGolf_UserId";
            if (!PlayerPrefs.HasKey(key))
            {
                PlayerPrefs.SetInt(key, UnityEngine.Random.Range(1, int.MaxValue));
                PlayerPrefs.Save();
            }
            return PlayerPrefs.GetInt(key);
        }
    }
}
