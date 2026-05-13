import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store'
import Auth from './screens/Auth'
import Onboarding from './screens/Onboarding'
import Search from './screens/Search'
import Results from './screens/Results'
import StylistProfile from './screens/StylistProfile'
import Settings from './screens/Settings'
import VibeCheck from './screens/VibeCheck'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const onboardingComplete = useStore(s => s.onboardingComplete)
  const syncProfileFromDb = useStore(s => s.syncProfileFromDb)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) syncProfileFromDb(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash />

  if (!session) return <Auth />

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/search" element={onboardingComplete ? <Search /> : <Navigate to="/onboarding" />} />
      <Route path="/results" element={onboardingComplete ? <Results /> : <Navigate to="/onboarding" />} />
      <Route path="/stylist/:id" element={<StylistProfile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/vibe" element={<VibeCheck />} />
      <Route path="*" element={<Navigate to={onboardingComplete ? '/search' : '/onboarding'} />} />
    </Routes>
  )
}

function Splash() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--espresso)' }}>
        ChicPick
      </div>
    </div>
  )
}
