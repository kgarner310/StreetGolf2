import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store'
import { runSearch } from '../lib/search'

const SERVICE_SUGGESTIONS = [
  'Knotless braids', 'Box braids', 'Silk press', 'Loc retwist',
  'Starter locs', 'Balayage', 'Color correction', 'Natural twist out',
  'Sew-in weave', 'Quick weave', 'Wig install', 'Trim & shape',
  'Relaxer', 'Keratin treatment', 'Crochet braids', 'Faux locs',
]

const ANCHOR_LABELS = { home: '🏠 Home', work: '💼 Work', school: '🎒 School', current: '📍 Here' }

export default function Search() {
  const navigate = useNavigate()
  const store = useStore()
  const {
    locations, searchService, searchWhen, searchDate, searchDeadline,
    departureAnchor, setSearchContext, setResults, setResultsLoading, setResultsError,
    computedDepartureAnchor
  } = store

  const [service, setService] = useState(searchService || '')
  const [when, setWhen] = useState(searchWhen || 'asap')
  const [date, setDate] = useState(searchDate || '')
  const [deadline, setDeadline] = useState(searchDeadline || '')
  const [anchor, setAnchor] = useState(computedDepartureAnchor())
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = service.length > 0
    ? SERVICE_SUGGESTIONS.filter(s => s.toLowerCase().includes(service.toLowerCase()))
    : SERVICE_SUGGESTIONS

  const availableAnchors = Object.entries(ANCHOR_LABELS).filter(([key]) => {
    if (key === 'current') return true
    return !!locations[key]
  })

  const handleSearch = async () => {
    if (!service.trim()) return
    setSearchContext({ searchService: service, searchWhen: when, searchDate: date, searchDeadline: deadline, departureAnchor: anchor })
    setResultsLoading(true)
    navigate('/results')
    try {
      const data = await runSearch({ service, when, date, deadline, anchor, locations, store })
      setResults(data)
    } catch (e) {
      setResultsError(e.message)
    }
  }

  const anchorLocation = locations[anchor] || null

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={s.logo}>chic<span style={{ color: 'var(--rose)' }}>finds</span></div>
          <Link to="/settings" style={{ fontSize: 22, lineHeight: 1 }}>⚙️</Link>
        </div>
        <div style={s.tagline}>Top stylists in your area, for exactly what you want.</div>
      </div>

      <div style={s.body}>
        {/* Service input */}
        <div style={s.section}>
          <label style={s.label}>What do you want done?</label>
          <div style={{ position: 'relative' }}>
            <input
              value={service}
              onChange={e => { setService(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g. Knotless braids, silk press…"
              style={s.input}
            />
            {showSuggestions && filtered.length > 0 && (
              <div style={s.suggestions}>
                {filtered.slice(0, 6).map(sg => (
                  <button
                    key={sg}
                    style={s.suggestionItem}
                    onClick={() => { setService(sg); setShowSuggestions(false) }}
                  >
                    {sg}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* When */}
        <div style={s.section}>
          <label style={s.label}>When?</label>
          <div style={s.pillRow}>
            {['asap', 'pick'].map(w => (
              <button
                key={w}
                onClick={() => setWhen(w)}
                style={{ ...s.pill, ...(when === w ? s.pillActive : {}) }}
              >
                {w === 'asap' ? 'As soon as possible' : 'Pick a date'}
              </button>
            ))}
          </div>
          {when === 'pick' && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...s.input, flex: 1 }} />
              <input type="time" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ ...s.input, width: 110 }} placeholder="Done by" />
            </div>
          )}
        </div>

        {/* Departure anchor */}
        <div style={s.section}>
          <label style={s.label}>Departing from</label>
          <div style={s.pillRow}>
            {availableAnchors.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setAnchor(key)}
                style={{ ...s.pill, ...(anchor === key ? s.pillActive : {}) }}
              >
                {label}
              </button>
            ))}
          </div>
          {anchorLocation?.label && (
            <div style={s.anchorHint}>{anchorLocation.label}</div>
          )}
          {anchor === 'current' && (
            <div style={s.anchorHint}>Using your current location</div>
          )}
        </div>

        {/* Deadline nudge */}
        {when === 'asap' && (
          <div style={s.section}>
            <label style={s.label}>Need to be done by? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
            <input type="time" value={deadline} onChange={e => setDeadline(e.target.value)} style={s.input} placeholder="e.g. 3:00 PM for school pickup" />
          </div>
        )}
      </div>

      <div style={s.footer}>
        <button
          style={{ ...s.searchBtn, ...(!service.trim() ? s.searchBtnDisabled : {}) }}
          disabled={!service.trim()}
          onClick={handleSearch}
        >
          Find My Top Stylists
        </button>
      </div>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--cream)' },
  header: { padding: '28px 24px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border)' },
  logo: { fontSize: 26, fontWeight: 800, color: 'var(--espresso)' },
  tagline: { marginTop: 6, fontSize: 14, color: 'var(--muted)', lineHeight: 1.4 },
  body: { flex: 1, overflowY: 'auto', padding: '24px 24px 0' },
  section: { marginBottom: 28 },
  label: { display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--espresso)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  input: { width: '100%', padding: '14px 16px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 15, color: 'var(--charcoal)' },
  suggestions: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--white)', border: '1.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', zIndex: 10, boxShadow: 'var(--shadow)' },
  suggestionItem: { display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', fontSize: 14, color: 'var(--charcoal)', borderBottom: '1px solid var(--border)' },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: { padding: '9px 16px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 24, fontSize: 14, fontWeight: 500, color: 'var(--charcoal)' },
  pillActive: { background: 'var(--espresso)', borderColor: 'var(--espresso)', color: 'var(--white)', fontWeight: 700 },
  anchorHint: { marginTop: 8, fontSize: 13, color: 'var(--muted)' },
  footer: { padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--white)' },
  searchBtn: { width: '100%', padding: '16px', background: 'var(--rose)', borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 700, color: 'var(--white)' },
  searchBtnDisabled: { background: 'var(--border)', color: 'var(--muted)' },
}
