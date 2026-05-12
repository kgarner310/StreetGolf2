import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Onboarding
      onboardingComplete: false,
      hairTexture: null,        // 'straight' | 'wavy' | 'curly' | 'coily' | '4c'
      services: [],             // e.g. ['braids', 'color']
      budgetTier: null,         // 'under75' | '75to150' | '150plus'
      constraints: [],          // ['no_heat', 'no_chemicals', ...]
      locations: {
        home: null,             // { label, lat, lng }
        work: null,
        school: null,
      },

      // Current search context
      searchService: '',
      searchWhen: 'asap',       // 'asap' | 'pick'
      searchDate: null,
      searchDeadline: null,
      departureAnchor: 'home',  // 'home' | 'work' | 'school' | 'current'

      // Results
      results: [],
      resultsLoading: false,
      resultsError: null,

      setOnboarding: (data) => set({ ...data, onboardingComplete: true }),
      setSearchContext: (data) => set(data),
      setResults: (results) => set({ results, resultsLoading: false }),
      setResultsLoading: (v) => set({ resultsLoading: v }),
      setResultsError: (e) => set({ resultsError: e, resultsLoading: false }),

      computedDepartureAnchor: () => {
        const { locations } = get()
        const h = new Date().getHours()
        const day = new Date().getDay() // 0=Sun, 6=Sat
        const isWeekend = day === 0 || day === 6

        if (isWeekend) return 'home'
        if (h >= 5 && h < 9) return 'home'
        if (h >= 9 && h < 16) return locations.work ? 'work' : 'home'
        if (h >= 16 && h < 19) return locations.school ? 'school' : (locations.work ? 'work' : 'home')
        return 'home'
      },
    }),
    {
      name: 'chic-finds-profile',
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        hairTexture: s.hairTexture,
        services: s.services,
        budgetTier: s.budgetTier,
        constraints: s.constraints,
        locations: s.locations,
      }),
    }
  )
)
