import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const defaultRole = params.get('role') === 'fillin' ? 'fillin' : params.get('role') === 'primary' ? 'primary' : 'both'

  const [form, setForm] = useState({ business_name: '', owner_name: '', email: '', phone: '', password: '', preferred_role: defaultRole })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(f, v) { setForm((prev) => ({ ...prev, [f]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await signUp(form)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-8">
        <Link to="/" className="text-lg font-bold text-white block mb-6">SubRoute</Link>
        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-sm text-slate-400 mb-6">For licensed, insured lawn care businesses only</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="How will you use SubRoute?" value={form.preferred_role} onChange={(e) => set('preferred_role', e.target.value)}
            className="[&_label]:text-slate-300 [&_select]:bg-slate-700 [&_select]:border-slate-600 [&_select]:text-white">
            <option value="both">Both — post coverage AND fill in for others</option>
            <option value="primary">Primarily need coverage for my route</option>
            <option value="fillin">Primarily looking to fill in for others</option>
          </Select>
          <Input label="Business name" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} required
            className="[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white [&_input]:placeholder-slate-500" />
          <Input label="Your name" value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} required
            className="[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white [&_input]:placeholder-slate-500" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required autoComplete="email"
            className="[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white [&_input]:placeholder-slate-500" />
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
            className="[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white [&_input]:placeholder-slate-500" />
          <Input label="Password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required hint="At least 8 characters"
            className="[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white [&_hint]:text-slate-500" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" loading={loading} variant="accent" className="w-full">Create account</Button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">By signing up you agree to SubRoute's Terms and Non-Solicitation Framework.</p>
        <p className="text-center text-sm text-slate-500 mt-3">
          Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
