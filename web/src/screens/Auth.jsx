import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin }
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <div style={s.checkmark}>✉️</div>
          <h2 style={s.title}>Check your email</h2>
          <p style={s.subtitle}>
            We sent a magic link to <strong>{email}</strong>. Tap it to sign in — no password needed.
          </p>
          <button style={s.ghostBtn} onClick={() => setSent(false)}>Use a different email</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logo}>Chic<span style={{color:'var(--rose)'}}>Pick</span></div>
        <h2 style={s.title}>Find your perfect stylist</h2>
        <p style={s.subtitle}>Enter your email to get started. No password, no friction.</p>

        <div style={s.field}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="your@email.com"
            style={s.input}
            autoFocus
          />
        </div>

        {error && <div style={s.error}>{error}</div>}

        <button
          style={{ ...s.btn, ...(loading || !email.trim() ? s.btnDisabled : {}) }}
          onClick={handleSend}
          disabled={loading || !email.trim()}
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>

        <p style={s.terms}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

const s = {
  container: {
    minHeight: '100dvh', background: 'var(--cream)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
  },
  card: {
    width: '100%', maxWidth: 400, background: 'var(--white)',
    borderRadius: 'var(--radius)', padding: '40px 32px',
    boxShadow: 'var(--shadow-card)', textAlign: 'center'
  },
  logo: { fontSize: 28, fontWeight: 800, color: 'var(--espresso)', marginBottom: 20 },
  checkmark: { fontSize: 48, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--espresso)', marginBottom: 10 },
  subtitle: { fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 },
  field: { marginBottom: 14 },
  input: {
    width: '100%', padding: '14px 16px', fontSize: 16,
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--cream)', color: 'var(--charcoal)'
  },
  error: { marginBottom: 12, padding: '10px 14px', background: '#fff0f0', borderRadius: 8, fontSize: 13, color: '#c00' },
  btn: {
    width: '100%', padding: '15px', background: 'var(--espresso)',
    borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 16
  },
  btnDisabled: { background: 'var(--border)', color: 'var(--muted)' },
  ghostBtn: {
    background: 'none', color: 'var(--rose)', fontSize: 14,
    fontWeight: 600, padding: '8px 0', marginTop: 12
  },
  terms: { fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 },
}
