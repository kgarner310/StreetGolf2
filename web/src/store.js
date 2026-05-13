import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from './lib/supabase'

export const useStore = create(
  persist(
    (set, get) => ({
      // Onboarding
      onboardingComplete: false,
      hairTexture: null,        // 'straight' | 'wavy' | 'curly' | 'coily' | '4c'
      hairLength: null,         // 'short' | 'medium' | 'long' | 'very_long'
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

      // Vibe profile (user's Instagram aesthetic analysis)
      vibeProfile: null,   // { handle, analysis, analyzedAt }

      setOnboarding: async (data) => {
        set({ ...data, onboardingComplete: true })
        // Persist to Supabase if signed in
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const locs = data.locations
        await supabase.from('user_profiles').upsert({
          id: user.id,
          hair_texture: data.hairTexture,
          hair_length: data.hairLength,
          frequent_services: data.services,
          budget_tier: data.budgetTier,
          hair_constraints: data.constraints,
          onboarding_complete: true,
          home_label: locs.home?.label,
          home_location: locs.home ? `SRID=4326;POINT(${locs.home.lng} ${locs.home.lat})` : null,
          work_label: locs.work?.label,
          work_location: locs.work ? `SRID=4326;POINT(${locs.work.lng} ${locs.work.lat})` : null,
          school_label: locs.school?.label,
          school_location: locs.school ? `SRID=4326;POINT(${locs.school.lng} ${locs.school.lat})` : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      },

      // Pull profile from DB into local state (called after sign-in)
      syncProfileFromDb: async (userId) => {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (!data || !data.onboarding_complete) return
        set({
          onboardingComplete: true,
          hairTexture: data.hair_texture,
          hairLength: data.hair_length ?? null,
          services: data.frequent_services ?? [],
          budgetTier: data.budget_tier,
          constraints: data.hair_constraints ?? [],
          locations: {
            home: data.home_label ? { label: data.home_label, lat: null, lng: null } : null,
            work: data.work_label ? { label: data.work_label, lat: null, lng: null } : null,
            school: data.school_label ? { label: data.school_label, lat: null, lng: null } : null,
          },
        })
      },
      setSearchContext: (data) => set(data),
      setResults: (results) => set({ results, resultsLoading: false }),
      setResultsLoading: (v) => set({ resultsLoading: v }),
      setResultsError: (e) => set({ resultsError: e, resultsLoading: false }),
      setVibeProfile: (vibe) => set({ vibeProfile: vibe }),

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
        hairLength: s.hairLength,
        services: s.services,
        budgetTier: s.budgetTier,
        constraints: s.constraints,
        locations: s.locations,
        vibeProfile: s.vibeProfile,
      }),
    }
  )
)
