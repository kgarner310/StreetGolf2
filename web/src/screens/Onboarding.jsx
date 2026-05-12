import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const TEXTURES = [
  { id: 'straight', label: 'Straight', emoji: '〜', desc: 'Little to no curl pattern' },
  { id: 'wavy', label: 'Wavy', emoji: '〰', desc: 'Loose S-shaped waves' },
  { id: 'curly', label: 'Curly', emoji: '🌀', desc: 'Defined curl pattern (3A–3C)' },
  { id: 'coily', label: 'Coily', emoji: '⭕', desc: 'Tight coils (4A–4B)' },
  { id: '4c', label: '4C', emoji: '✦', desc: 'Tightly coiled, densely packed' },
]

const SERVICES = [
  { id: 'braids', label: 'Braids & Locs' },
  { id: 'natural', label: 'Natural Styles' },
  { id: 'silk_press', label: 'Silk Press' },
  { id: 'color', label: 'Color & Highlights' },
  { id: 'extensions', label: 'Weave & Extensions' },
  { id: 'cut', label: 'Cuts & Trims' },
  { id: 'relaxer', label: 'Relaxer' },
]

const BUDGETS = [
  { id: 'under75', label: 'Under $75', desc: 'Maintenance & simples' },
  { id: '75to150', label: '$75 – $150', desc: 'Most installs & styles' },
  { id: '150plus', label: '$150+', desc: 'Premium & complex work' },
]

const CONSTRAINTS = [
  { id: 'no_heat', label: 'No heat styling' },
  { id: 'no_chemicals', label: 'No chemical treatments' },
  { id: 'fragrance_free', label: 'Fragrance-free products' },
  { id: 'natural_only', label: 'Natural products only' },
]

const STEPS = ['texture', 'services', 'budget', 'location', 'constraints']

export default function Onboarding() {
  const navigate = useNavigate()
  const setOnboarding = useStore(s => s.setOnboarding)

  const [step, setStep] = useState(0)
  const [texture, setTexture] = useState(null)
  const [services, setServices] = useState([])
  const [budget, setBudget] = useState(null)
  const [homeLabel, setHomeLabel] = useState('')
  const [workLabel, setWorkLabel] = useState('')
  const [schoolLabel, setSchoolLabel] = useState('')
  const [constraints, setConstraints] = useState([])

  const progress = ((step + 1) / STEPS.length) * 100

  const toggleService = (id) =>
    setServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleConstraint = (id) =>
    setConstraints(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const canAdvance = () => {
    if (step === 0) return !!texture
    if (step === 1) return services.length > 0
    if (step === 2) return !!budget
    if (step === 3) return homeLabel.trim().length > 2
    return true
  }

  const finish = () => {
    setOnboarding({
      hairTexture: texture,
      services,
      budgetTier: budget,
      constraints,
      locations: {
        home: homeLabel ? { label: homeLabel, lat: null, lng: null } : null,
        work: workLabel ? { label: workLabel, lat: null, lng: null } : null,
        school: schoolLabel ? { label: schoolLabel, lat: null, lng: null } : null,
      },
    })
    navigate('/search')
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.logo}>chic<span style={{ color: 'var(--rose)' }}>finds</span></div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        <div style={s.stepLabel}>{step + 1} of {STEPS.length}</div>
      </div>

      <div style={s.body}>
        {step === 0 && (
          <Step title="What's your hair texture?" subtitle="We'll only show stylists who actually work with your texture.">
            <div style={s.textureGrid}>
              {TEXTURES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTexture(t.id)}
                  style={{ ...s.textureCard, ...(texture === t.id ? s.textureCardActive : {}) }}
                >
                  <span style={s.textureEmoji}>{t.emoji}</span>
                  <span style={s.textureName}>{t.label}</span>
                  <span style={s.textureDesc}>{t.desc}</span>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step title="What do you usually get done?" subtitle="Pick everything that applies — we'll match all of them.">
            <div style={s.chipGrid}>
              {SERVICES.map(sv => (
                <button
                  key={sv.id}
                  onClick={() => toggleService(sv.id)}
                  style={{ ...s.chip, ...(services.includes(sv.id) ? s.chipActive : {}) }}
                >
                  {sv.label}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step title="What's your usual budget?" subtitle="Per appointment, before tip.">
            <div style={s.budgetCol}>
              {BUDGETS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setBudget(b.id)}
                  style={{ ...s.budgetCard, ...(budget === b.id ? s.budgetCardActive : {}) }}
                >
                  <span style={s.budgetLabel}>{b.label}</span>
                  <span style={s.budgetDesc}>{b.desc}</span>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title="Where are you based?" subtitle="Your home is required. Work and school let us find stylists on your route.">
            <div style={s.locationCol}>
              <LocationField icon="🏠" placeholder="Home neighborhood or zip *" value={homeLabel} onChange={setHomeLabel} />
              <LocationField icon="💼" placeholder="Work area (optional)" value={workLabel} onChange={setWorkLabel} />
              <LocationField icon="🎒" placeholder="School / dropoff area (optional)" value={schoolLabel} onChange={setSchoolLabel} />
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step title="Any hard limits?" subtitle="Optional — skip if none apply.">
            <div style={s.chipGrid}>
              {CONSTRAINTS.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleConstraint(c.id)}
                  style={{ ...s.chip, ...(constraints.includes(c.id) ? s.chipActive : {}) }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Step>
        )}
      </div>

      <div style={s.footer}>
        {step > 0 && (
          <button style={s.backBtn} onClick={() => setStep(s => s - 1)}>Back</button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            style={{ ...s.nextBtn, ...(!canAdvance() ? s.nextBtnDisabled : {}) }}
            disabled={!canAdvance()}
            onClick={() => setStep(s => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button style={s.nextBtn} onClick={finish}>
            Find My Stylists →
          </button>
        )}
      </div>
    </div>
  )
}

function Step({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--espresso)', lineHeight: 1.3 }}>{title}</h2>
        <p style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function LocationField({ icon, placeholder, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: 'var(--charcoal)' }}
      />
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--cream)' },
  header: { padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--white)' },
  logo: { fontSize: 22, fontWeight: 800, color: 'var(--espresso)', marginBottom: 12 },
  progressBar: { height: 4, background: 'var(--blush)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--rose)', borderRadius: 2, transition: 'width 0.3s ease' },
  stepLabel: { marginTop: 8, fontSize: 12, color: 'var(--muted)' },
  body: { flex: 1, overflowY: 'auto', padding: '28px 24px' },
  footer: { padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--white)', display: 'flex', gap: 12 },
  backBtn: { padding: '14px 20px', background: 'var(--blush)', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600, color: 'var(--espresso)' },
  nextBtn: { flex: 1, padding: '14px 20px', background: 'var(--espresso)', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700, color: 'var(--white)' },
  nextBtnDisabled: { background: 'var(--border)', color: 'var(--muted)' },
  textureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  textureCard: { display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 14px', background: 'var(--white)', border: '2px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'left' },
  textureCardActive: { borderColor: 'var(--rose)', background: '#fdf0f3' },
  textureEmoji: { fontSize: 22, marginBottom: 4 },
  textureName: { fontWeight: 700, fontSize: 15, color: 'var(--espresso)' },
  textureDesc: { fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  chip: { padding: '10px 18px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 24, fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' },
  chipActive: { background: 'var(--espresso)', borderColor: 'var(--espresso)', color: 'var(--white)' },
  budgetCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  budgetCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--white)', border: '2px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'left' },
  budgetCardActive: { borderColor: 'var(--gold)', background: '#fdf8ef' },
  budgetLabel: { fontWeight: 700, fontSize: 16, color: 'var(--espresso)' },
  budgetDesc: { fontSize: 13, color: 'var(--muted)' },
  locationCol: { display: 'flex', flexDirection: 'column', gap: 12 },
}
