import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

import Landing     from './pages/Landing'
import Login       from './pages/auth/Login'
import Register    from './pages/auth/Register'
import Onboarding  from './pages/Onboarding'
import Dashboard   from './pages/Dashboard'
import PostCoverage from './pages/PostCoverage'
import JobBoard    from './pages/JobBoard'
import JobDetail   from './pages/JobDetail'

function AuthGuard({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

function NavBar() {
  const { session, profile, signOut } = useAuth()
  const location = useLocation()
  if (!session || location.pathname === '/') return null

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="text-base font-bold text-slate-900 tracking-tight">
          SubRoute <span className="text-xs font-normal text-slate-400 ml-1">B2B</span>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link to="/dashboard"  className="text-slate-600 hover:text-slate-900">Dashboard</Link>
          <Link to="/board"      className="text-slate-600 hover:text-slate-900">Job Board</Link>
          <Link to="/post"       className="text-slate-600 hover:text-slate-900 font-medium">+ Post Coverage</Link>
          <button onClick={signOut} className="text-slate-400 hover:text-slate-600 text-xs">Sign out</button>
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
        <Route path="/"           element={<Landing />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
        <Route path="/dashboard"  element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/post"       element={<AuthGuard><PostCoverage /></AuthGuard>} />
        <Route path="/board"      element={<AuthGuard><JobBoard /></AuthGuard>} />
        <Route path="/jobs/:id"   element={<AuthGuard><JobDetail /></AuthGuard>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/subroute">
      <AppRoutes />
    </BrowserRouter>
  )
}
