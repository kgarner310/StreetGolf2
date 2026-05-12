import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-8">
        <Link to="/" className="text-lg font-bold text-white block mb-6">SubRoute</Link>
        <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
        <p className="text-sm text-slate-400 mb-6">Welcome back, pro</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white [&_input]:placeholder-slate-500" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" loading={loading} variant="accent" className="w-full">Sign in</Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          No account? <Link to="/register" className="text-brand-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
