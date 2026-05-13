import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { geocode } from '../lib/geocode'

const TEXTURES = [
  { id: 'straight', label: 'Straight' }, { id: 'wavy', label: 'Wavy' },
  { id: 'curly', label: 'Curly' }, { id: 'coily', label: 'Coily' }, { id: '4c', label: '4C' },
]
const SERVICES = [
  { id: 'braids', label: 'Braids & Locs' }, { id: 'natural', label: 'Natural Styles' },
  { id: 'silk_press', label: 'Silk Press' }, { id: 'color', label: 'Color' },
  { id: 'extensions', label: 'Extensions' }, { id: 'cut', label: 'Cuts & Trims' },
  { id: 'relaxer', label: 'Relaxer' },
]
const BUDGETS = [
  { id: 'under75', label: 'Under $75' }, { id: '75to150', label: '$75–$150' }, { id: '150plus', label: '$150+' },
]

export default function Settings() {
  const navigate = useNavigate()
  const store = useStore()
  const {
    hairTexture, services, budgetTier, constraints, locations,
    setOnboarding, setSearchContext
  } = store

  const [texture, setTexture] = useState(hairTexture)
  const [selectedServices, setSelectedServices] = useState(services ?? [])
  const [budget, setBudget] = useState(budgetTier)
  const [homeLabel, setHomeLabel] = useState(locations?.home?.label ?? '')
  const [workLabel, setWorkLabel] = useState(locations?.work?.label ?? '')
  const [schoolLabel, setSchoolLabel] = useState(locations?.school?.label ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const toggleService = (id) =>
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const [homeCoords, workCoords, schoolCoords] = await Promise.all([
        homeLabel ? geocode(homeLabel) : null,
        workLabel ? geocode(workLabel) : null,
        schoolLabel ? geocode(schoolLabel) : null,
      ])
      if (homeLabel && !homeCoords) {
        setError("Couldn't find your home location.")
        setSaving(false)
        return
      }
      await setOnboarding({
        hairTexture: texture,
        services: selectedServices,
        budgetTier: budget,
        constraints,
        locations: {
          home: homeCoords ? { label: homeLabel, ...homeCoords } : locations?.home,
          work: workCoords ? { label: workLabel, ...workCoords } : (workLabel ? null : locations?.work),
          school: schoolCoords ? { label: schoolLabel, ...schoolCoords } : (schoolLabel ? null : locations?.school),
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Save failed. Please try again.')
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    useStore.persist.clearStorage()
    navigate('/')
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate('/search')} style={s.back}>← Search</button>
        <div style={s.headerTitle}>Your Profile</div>
      </div>

      <div style={s.body}>
        <Section title="Hair texture">
          <div style={s.pillRow}>
            {TEXTURES.map(t => (
              <button key={t.id} onClick={() => setTexture(t.id)}
                style={{ ...s.pill, ...(texture === t.id ? s.pillActive : {}) }}>
                {t.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Services I get">
          <div style={s.pillRow}>
            {SERVICES.map(sv => (
              <button key={sv.id} onClick={() => toggleService(sv.id)}
                style={{ ...s.pill, ...(selectedServices.includes(sv.id) ? s.pillActive : {}) }}>
                {sv.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Budget per appointment">
          <div style={s.pillRow}>
            {BUDGETS.map(b => (
              <button key={b.id} onClick={() => setBudget(b.id)}
                style={{ ...s.pill, ...(budget === b.id ? s.pillActive : {}) }}>
                {b.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="My locations">
          <LocationField icon="🏠" label="Home *" value={homeLabel} onChange={setHomeLabel} />
          <LocationField icon="💼" label="Work (optional)" value={workLabel} onChange={setWorkLabel} />
          <LocationField icon="🎒" label="School / dropoff (optional)" value={schoolLabel} onChange={setSchoolLabel} />
        </Section>

        {error && <div style={s.errorBox}>{error}</div>}

        <button style={{ ...s.saveBtn, ...(saving ? s.saveBtnDisabled : {}) }} onClick={handleSave} disabled={saving}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
        </button>

        <button style={s.signOutBtn} onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--espresso)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function LocationField({ icon, label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }}>
      <span>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="Neighborhood, city, or zip"
          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, color: 'var(--charcoal)' }} />
      </div>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--cream)' },
  header: { padding: '14px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 },
  back: { background: 'none', fontSize: 15, fontWeight: 600, color: 'var(--rose)', padding: '4px 0' },
  headerTitle: { fontSize: 17, fontWeight: 700, color: 'var(--espresso)' },
  body: { flex: 1, overflowY: 'auto', padding: '24px 20px' },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: { padding: '9px 16px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 24, fontSize: 14, fontWeight: 500, color: 'var(--charcoal)' },
  pillActive: { background: 'var(--espresso)', borderColor: 'var(--espresso)', color: 'white', fontWeight: 700 },
  errorBox: { marginBottom: 12, padding: '10px 14px', background: '#fff0f0', borderRadius: 8, fontSize: 13, color: '#c00' },
  saveBtn: { width: '100%', padding: 15, background: 'var(--rose)', borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 12 },
  saveBtnDisabled: { background: 'var(--border)', color: 'var(--muted)' },
  signOutBtn: { width: '100%', padding: 14, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600, color: 'var(--muted)' },
}
