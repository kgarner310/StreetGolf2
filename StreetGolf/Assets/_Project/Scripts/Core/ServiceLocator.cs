using System;
using System.Collections.Generic;

namespace StreetGolf.Core
{
    /// <summary>
    /// Lightweight service registry. Not a MonoBehaviour singleton.
    /// Register configs and shared services at startup, retrieve them anywhere.
    /// Cleared on domain reload (entering play mode in Editor).
    /// </summary>
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> Services = new Dictionary<Type, object>();

        /// <summary>
        /// Register a service instance. Overwrites any previous registration of the same type.
        /// </summary>
        public static void Register<T>(T service) where T : class
        {
            Services[typeof(T)] = service;
        }

        /// <summary>
        /// Retrieve a registered service. Returns null if not registered.
        /// </summary>
        public static T Get<T>() where T : class
        {
            Services.TryGetValue(typeof(T), out object service);
            return service as T;
        }

        /// <summary>
        /// Check if a service type is registered.
        /// </summary>
        public static bool Has<T>() where T : class
        {
            return Services.ContainsKey(typeof(T));
        }

        /// <summary>
        /// Remove all registered services. Called on domain reload.
        /// </summary>
        public static void Clear()
        {
            Services.Clear();
        }

#if UNITY_EDITOR
        [UnityEngine.RuntimeInitializeOnLoadMethod(UnityEngine.RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetOnDomainReload()
        {
            Clear();
        }
#endif
    }
}
