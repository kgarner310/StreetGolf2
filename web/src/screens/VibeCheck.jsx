import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

// Visual aesthetic tags with colors for the mood board display
const AESTHETIC_META = {
  'Natural & Effortless':     { emoji: '🌿', color: '#6b8f5e' },
  'Bold & Glamorous':         { emoji: '✨', color: '#c9973a' },
  'Soft & Romantic':          { emoji: '🌸', color: '#d4808e' },
  'Edgy & Fashion-Forward':   { emoji: '🖤', color: '#2d2d2d' },
  'Classic & Polished':       { emoji: '💎', color: '#5a7a9e' },
  'Bohemian & Free':          { emoji: '🌙', color: '#9b7ec8' },
  'Minimal & Clean':          { emoji: '○', color: '#8a8a8a' },
  'Colorful & Expressive':    { emoji: '🎨', color: '#e06b3a' },
  'Afrocentric & Cultural':   { emoji: '🌍', color: '#c9973a' },
  'Urban & Trendy':           { emoji: '⚡', color: '#3a5fc9' },
}

export default function VibeCheck() {
  const navigate = useNavigate()
  const { vibeProfile, setVibeProfile } = useStore()

  const [handle, setHandle] = useState(vibeProfile?.handle ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(vibeProfile?.analysis ?? null)
  const [step, setStep] = useState(result ? 'done' : 'intro') // intro | input | analyzing | done

  const handleAnalyze = async () => {
    if (!handle.trim()) return
    const cleanHandle = handle.replace('@', '').trim()
    setLoading(true)
    setError('')
    setStep('analyzing')

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('analyze-user-vibe', {
        body: { handle: cleanHandle, mode: 'user' }
      })

      if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error || 'Analysis failed')
      if (!data?.vibe) throw new Error('Could not read your Instagram. Make sure your account is public.')

      const profile = { handle: cleanHandle, analysis: data.vibe, analyzedAt: new Date().toISOString() }
      setResult(data.vibe)
      setVibeProfile(profile)

      // Persist to DB
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_profiles').update({
          instagram_handle: cleanHandle,
          vibe_tags: data.vibe.vibe_tags ?? [],
          vibe_aesthetics: data.vibe.aesthetics ?? [],
          vibe_palette: data.vibe.palette ?? [],
          vibe_sample_posts: [],
          vibe_confidence: data.vibe.confidence ?? 0,
          vibe_analyzed_at: new Date().toISOString(),
        }).eq('id', user.id)
      }

      setStep('done')
    } catch (e) {
      setError(e.message)
      setStep('input')
    }
    setLoading(false)
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.back}>← Back</button>
        <div style={s.headerTitle}>Your Vibe Check</div>
      </div>

      <div style={s.body}>
        {step === 'intro' && <IntroStep onContinue={() => setStep('input')} onSkip={() => navigate('/search')} />}
        {step === 'input' && (
          <InputStep
            handle={handle}
            setHandle={setHandle}
            onAnalyze={handleAnalyze}
            onSkip={() => navigate('/search')}
            error={error}
          />
        )}
        {step === 'analyzing' && <AnalyzingStep handle={handle.replace('@', '')} />}
        {step === 'done' && result && (
          <ResultStep
            handle={handle}
            result={result}
            onRedo={() => { setResult(null); setStep('input') }}
            onSearch={() => navigate('/search')}
          />
        )}
      </div>
    </div>
  )
}

function IntroStep({ onContinue, onSkip }) {
  return (
    <div style={s.introWrap}>
      <div style={s.introEmoji}>📱✨</div>
      <h1 style={s.introTitle}>Your style, your match</h1>
      <p style={s.introBody}>
        ChicPick compares your <strong>aesthetic vibe</strong> against every stylist's portfolio —
        not just what they can technically do, but whether their <em>entire look and energy</em> matches yours.
      </p>
      <p style={s.introBody}>
        Think Pinterest-meets-dating-app. Connect your Instagram and we'll read your vibe in seconds.
      </p>

      <div style={s.featureList}>
        {[
          { icon: '🎨', text: 'Detect your color palette & aesthetic' },
          { icon: '💇🏾', text: 'Find stylists who share your visual energy' },
          { icon: '🔮', text: 'Match vibe + technical skill + availability' },
          { icon: '🔒', text: 'We only read — never post or follow' },
        ].map(f => (
          <div key={f.text} style={s.featureRow}>
            <span style={s.featureIcon}>{f.icon}</span>
            <span style={s.featureText}>{f.text}</span>
          </div>
        ))}
      </div>

      <button style={s.primaryBtn} onClick={onContinue}>Connect my Instagram →</button>
      <button style={s.skipBtn} onClick={onSkip}>Skip for now</button>
    </div>
  )
}

function InputStep({ handle, setHandle, onAnalyze, onSkip, error }) {
  return (
    <div style={s.inputWrap}>
      <h2 style={s.inputTitle}>What's your Instagram handle?</h2>
      <p style={s.inputSubtitle}>
        Your account must be <strong>public</strong>. We read your 9 most recent posts to detect your aesthetic — nothing else.
      </p>

      <div style={s.handleInputWrap}>
        <span style={s.atSign}>@</span>
        <input
          value={handle}
          onChange={e => setHandle(e.target.value.replace('@', ''))}
          onKeyDown={e => e.key === 'Enter' && onAnalyze()}
          placeholder="yourhandle"
          style={s.handleInput}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <button
        style={{ ...s.primaryBtn, ...(!handle.trim() ? s.btnDisabled : {}) }}
        disabled={!handle.trim()}
        onClick={onAnalyze}
      >
        Analyze my vibe
      </button>
      <button style={s.skipBtn} onClick={onSkip}>Skip — search without vibe match</button>
    </div>
  )
}

function AnalyzingStep({ handle }) {
  const steps = [
    'Reading your recent posts…',
    'Detecting your color palette…',
    'Mapping your aesthetic signature…',
    'Building your vibe profile…',
  ]
  return (
    <div style={s.analyzingWrap}>
      <div className="spinner" />
      <h2 style={s.analyzingTitle}>Reading @{handle}</h2>
      <div style={s.analyzeSteps}>
        {steps.map((text, i) => (
          <div key={text} style={{ ...s.analyzeStep, opacity: 1 - i * 0.15 }}>
            <span style={s.analyzeDot}>◆</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultStep({ handle, result, onRedo, onSearch }) {
  const aesthetics = result.aesthetics ?? []
  const palette = result.palette ?? []
  const vibeTags = result.vibe_tags ?? []
  const hairLoves = result.hair_loves ?? []
  const confidence = result.confidence ?? 0

  return (
    <div style={s.resultWrap}>
      {/* Header */}
      <div style={s.resultHeader}>
        <div style={s.resultHandle}>@{handle.replace('@', '')}</div>
        <div style={s.resultSummary}>{result.summary}</div>
      </div>

      {/* Confidence bar */}
      <div style={s.confidenceRow}>
        <span style={s.confidenceLabel}>Vibe read confidence</span>
        <div style={s.confidenceBar}>
          <div style={{ ...s.confidenceFill, width: `${confidence * 100}%` }} />
        </div>
        <span style={s.confidencePct}>{Math.round(confidence * 100)}%</span>
      </div>

      {/* Vibe tags — the "dating profile" */}
      <Section title="Your Style DNA">
        <div style={s.vibeTagWrap}>
          {vibeTags.map(tag => (
            <span key={tag} style={s.vibeTag}>{tag}</span>
          ))}
        </div>
      </Section>

      {/* Aesthetic mood board */}
      <Section title="Your Aesthetic">
        <div style={s.aestheticGrid}>
          {aesthetics.map(a => {
            const meta = AESTHETIC_META[a] || { emoji: '✦', color: 'var(--rose)' }
            return (
              <div key={a} style={{ ...s.aestheticCard, borderColor: meta.color }}>
                <span style={s.aestheticEmoji}>{meta.emoji}</span>
                <span style={s.aestheticLabel}>{a}</span>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Color palette */}
      {palette.length > 0 && (
        <Section title="Color Palette">
          <div style={s.paletteRow}>
            {palette.map(p => (
              <span key={p} style={s.paletteChip}>{p}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Hair loves */}
      {hairLoves.length > 0 && (
        <Section title="Hair Looks You Love">
          <div style={s.paletteRow}>
            {hairLoves.map(h => (
              <span key={h} style={{ ...s.paletteChip, background: 'var(--blush)', color: 'var(--espresso)' }}>{h}</span>
            ))}
          </div>
        </Section>
      )}

      {/* What this means */}
      <div style={s.matchExplain}>
        <div style={s.matchExplainTitle}>How this helps your matches</div>
        <p style={s.matchExplainBody}>
          Stylists whose portfolio aesthetic aligns with yours will rank higher — even if two stylists are equally skilled and close, the one whose <em>vibe</em> matches yours comes first.
        </p>
      </div>

      <button style={s.primaryBtn} onClick={onSearch}>Find stylists who match my vibe →</button>
      <button style={s.skipBtn} onClick={onRedo}>Re-analyze with a different account</button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--muted)', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--cream)' },
  header: { padding: '14px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 },
  back: { background: 'none', fontSize: 15, fontWeight: 600, color: 'var(--rose)', padding: '4px 0' },
  headerTitle: { fontSize: 17, fontWeight: 700, color: 'var(--espresso)' },
  body: { flex: 1, overflowY: 'auto', padding: '28px 20px' },

  // Intro
  introWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  introEmoji: { fontSize: 52, marginBottom: 16 },
  introTitle: { fontSize: 26, fontWeight: 800, color: 'var(--espresso)', marginBottom: 14, lineHeight: 1.2 },
  introBody: { fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 10, maxWidth: 320 },
  featureList: { width: '100%', margin: '20px 0 28px', display: 'flex', flexDirection: 'column', gap: 12 },
  featureRow: { display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' },
  featureIcon: { fontSize: 22, flexShrink: 0, width: 32, textAlign: 'center' },
  featureText: { fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.4 },

  // Input
  inputWrap: { display: 'flex', flexDirection: 'column' },
  inputTitle: { fontSize: 22, fontWeight: 800, color: 'var(--espresso)', marginBottom: 10 },
  inputSubtitle: { fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 },
  handleInputWrap: { display: 'flex', alignItems: 'center', background: 'var(--white)', border: '2px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 16px', marginBottom: 16, fontSize: 18 },
  atSign: { color: 'var(--muted)', fontWeight: 700, marginRight: 4 },
  handleInput: { flex: 1, border: 'none', background: 'transparent', fontSize: 18, fontWeight: 600, color: 'var(--espresso)', padding: '14px 0' },
  errorBox: { marginBottom: 14, padding: '10px 14px', background: '#fff0f0', borderRadius: 8, fontSize: 13, color: '#c00', lineHeight: 1.5 },

  // Analyzing
  analyzingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, textAlign: 'center' },
  analyzingTitle: { fontSize: 20, fontWeight: 700, color: 'var(--espresso)', marginBottom: 28 },
  analyzeSteps: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 },
  analyzeStep: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--charcoal)' },
  analyzeDot: { color: 'var(--rose)', fontSize: 10, flexShrink: 0 },

  // Result
  resultWrap: { display: 'flex', flexDirection: 'column' },
  resultHeader: { background: 'var(--espresso)', borderRadius: 'var(--radius)', padding: '20px 20px', marginBottom: 20, color: 'white' },
  resultHandle: { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  resultSummary: { fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: 'white' },
  confidenceRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  confidenceLabel: { fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' },
  confidenceBar: { flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', background: 'var(--rose)', borderRadius: 3, transition: 'width 1s ease' },
  confidencePct: { fontSize: 12, fontWeight: 700, color: 'var(--rose)', width: 32, textAlign: 'right' },
  vibeTagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  vibeTag: { padding: '8px 16px', background: 'var(--espresso)', color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  aestheticGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  aestheticCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--white)', border: '2px solid', borderRadius: 'var(--radius-sm)' },
  aestheticEmoji: { fontSize: 20 },
  aestheticLabel: { fontSize: 13, fontWeight: 600, color: 'var(--espresso)', lineHeight: 1.3 },
  paletteRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  paletteChip: { padding: '7px 14px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 13, color: 'var(--charcoal)' },
  matchExplain: { background: 'var(--blush)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: 24 },
  matchExplainTitle: { fontSize: 13, fontWeight: 700, color: 'var(--espresso)', marginBottom: 6 },
  matchExplainBody: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 },

  // Shared
  primaryBtn: { width: '100%', padding: 16, background: 'var(--rose)', borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 12, border: 'none', cursor: 'pointer' },
  btnDisabled: { background: 'var(--border)', color: 'var(--muted)' },
  skipBtn: { width: '100%', padding: 13, background: 'transparent', border: 'none', fontSize: 14, color: 'var(--muted)', fontWeight: 600, cursor: 'pointer' },
}
