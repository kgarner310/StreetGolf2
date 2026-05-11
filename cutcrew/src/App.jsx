import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CustomerDashboard from './pages/customer/Dashboard'
import PostJob from './pages/customer/PostJob'
import Properties from './pages/customer/Properties'
import ProviderDashboard from './pages/provider/Dashboard'
import ProviderOnboarding from './pages/provider/Onboarding'
import JobBoard from './pages/provider/JobBoard'
import ProviderProfile from './pages/provider/Profile'
import JobDetail from './pages/shared/JobDetail'

function AuthGuard({ children, requiredRole }) {
  const { session, role, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/dashboard" replace />
  return children
}

function DashboardRedirect() {
  const { role, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>
  if (role === 'provider') return <Navigate to="/provider/dashboard" replace />
  return <Navigate to="/customer/dashboard" replace />
}

function NavBar() {
  const { profile, role, signOut, session } = useAuth()
  const location = useLocation()

  if (!session || location.pathname === '/') return null

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-brand-700">CutCrew</Link>

        <div className="flex items-center gap-4 text-sm">
          {role === 'customer' && (
            <>
              <Link to="/customer/dashboard" className="text-gray-600 hover:text-brand-700">Jobs</Link>
              <Link to="/customer/properties" className="text-gray-600 hover:text-brand-700">Properties</Link>
              <Link to="/customer/post-job" className="text-gray-600 hover:text-brand-700 font-medium">+ Post Job</Link>
            </>
          )}
          {role === 'provider' && (
            <>
              <Link to="/provider/dashboard" className="text-gray-600 hover:text-brand-700">Dashboard</Link>
              <Link to="/provider/jobs" className="text-gray-600 hover:text-brand-700">Job Board</Link>
              <Link to="/provider/profile" className="text-gray-600 hover:text-brand-700">Profile</Link>
            </>
          )}
          <button onClick={signOut} className="text-gray-400 hover:text-gray-600 text-xs">Sign out</button>
        </div>
      </div>
    </nav>
  )
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<AuthGuard><DashboardRedirect /></AuthGuard>} />

        {/* Customer */}
        <Route path="/customer/dashboard" element={<AuthGuard requiredRole="customer"><CustomerDashboard /></AuthGuard>} />
        <Route path="/customer/post-job" element={<AuthGuard requiredRole="customer"><PostJob /></AuthGuard>} />
        <Route path="/customer/properties" element={<AuthGuard requiredRole="customer"><Properties /></AuthGuard>} />

        {/* Provider */}
        <Route path="/provider/dashboard" element={<AuthGuard requiredRole="provider"><ProviderDashboard /></AuthGuard>} />
        <Route path="/provider/onboarding" element={<AuthGuard requiredRole="provider"><ProviderOnboarding /></AuthGuard>} />
        <Route path="/provider/jobs" element={<AuthGuard requiredRole="provider"><JobBoard /></AuthGuard>} />
        <Route path="/provider/profile" element={<AuthGuard requiredRole="provider"><ProviderProfile /></AuthGuard>} />

        {/* Shared */}
        <Route path="/jobs/:id" element={<AuthGuard><JobDetail /></AuthGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/cutcrew">
      <AppRoutes />
    </BrowserRouter>
  )
}
