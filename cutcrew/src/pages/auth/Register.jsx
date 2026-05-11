import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const defaultRole = params.get('role') === 'provider' ? 'provider' : 'customer'

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role: defaultRole })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await signUp(form)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate(form.role === 'provider' ? '/provider/onboarding' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <Link to="/" className="text-xl font-bold text-brand-700 block mb-6">CutCrew</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Get started — it's free</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="I am a…" value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="customer">Property owner / Customer</option>
            <option value="provider">Lawn care professional</option>
          </Select>

          <Input label="Full name" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required autoComplete="name" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required autoComplete="email" />
          <Input label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            required
            autoComplete="new-password"
            hint="At least 8 characters"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up you agree to CutCrew's Terms of Service and Privacy Policy.
        </p>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
