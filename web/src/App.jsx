import { Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './screens/Onboarding'
import Search from './screens/Search'
import Results from './screens/Results'
import StylistProfile from './screens/StylistProfile'
import { useStore } from './store'

export default function App() {
  const onboardingComplete = useStore(s => s.onboardingComplete)

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/search" element={onboardingComplete ? <Search /> : <Navigate to="/onboarding" />} />
      <Route path="/results" element={onboardingComplete ? <Results /> : <Navigate to="/onboarding" />} />
      <Route path="/stylist/:id" element={<StylistProfile />} />
      <Route path="*" element={<Navigate to={onboardingComplete ? '/search' : '/onboarding'} />} />
    </Routes>
  )
}
