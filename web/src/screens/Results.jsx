import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import StylistCard from '../components/StylistCard'

export default function Results() {
  const navigate = useNavigate()
  const { searchService, results, resultsLoading, resultsError } = useStore()

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate('/search')} style={s.back}>← Back</button>
        <div>
          <div style={s.headerTitle}>Top picks for</div>
          <div style={s.headerService}>"{searchService}"</div>
        </div>
      </div>

      <div style={s.body}>
        {resultsLoading && <LoadingState service={searchService} />}

        {resultsError && (
          <div style={s.errorBox}>
            <div style={s.errorTitle}>Search failed</div>
            <div style={s.errorMsg}>{resultsError}</div>
            <button style={s.retryBtn} onClick={() => navigate('/search')}>Try again</button>
          </div>
        )}

        {!resultsLoading && !resultsError && results.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyEmoji}>🔍</div>
            <div style={s.emptyTitle}>No exact matches nearby</div>
            <div style={s.emptyMsg}>Try a broader service (e.g. "braids" instead of "micro knotless") or expand your travel range.</div>
            <button style={s.retryBtn} onClick={() => navigate('/search')}>Adjust search</button>
          </div>
        )}

        {!resultsLoading && results.length > 0 && (
          <>
            <div style={s.resultsMeta}>
              {results.length} stylists matched · ranked by fit
            </div>
            {results.map((stylist, i) => (
              <StylistCard key={stylist.id} stylist={stylist} rank={i + 1} />
            ))}
            <div style={s.disclaimer}>
              Availability confirmed within the last 15 minutes. Tap Book to hold your slot.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LoadingState({ service }) {
  return (
    <div style={s.loadingBox}>
      <div className="spinner" />
      <div style={s.loadingTitle}>Scanning stylists…</div>
      <div style={s.loadingSteps}>
        <LoadStep label={`Finding ${service} specialists near you`} done />
        <LoadStep label="Checking Instagram portfolios" active />
        <LoadStep label="Verifying live availability" />
        <LoadStep label="Ranking by fit + convenience" />
      </div>
    </div>
  )
}

function LoadStep({ label, done, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <span style={{
        width: 18, height: 18, borderRadius: 9,
        background: done ? 'var(--rose)' : active ? 'var(--gold)' : 'var(--border)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: 'white', fontWeight: 700,
      }}>
        {done ? '✓' : active ? '…' : ''}
      </span>
      <span style={{ fontSize: 14, color: done ? 'var(--charcoal)' : active ? 'var(--charcoal)' : 'var(--muted)' }}>
        {label}
      </span>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--cream)' },
  header: { padding: '16px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 },
  back: { background: 'none', fontSize: 15, fontWeight: 600, color: 'var(--rose)', padding: '4px 0', flexShrink: 0 },
  headerTitle: { fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerService: { fontSize: 17, fontWeight: 700, color: 'var(--espresso)', marginTop: 2 },
  body: { flex: 1, overflowY: 'auto', padding: '20px 16px' },
  resultsMeta: { fontSize: 13, color: 'var(--muted)', marginBottom: 14 },
  disclaimer: { marginTop: 20, padding: '12px 16px', background: 'var(--blush)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px' },
  loadingSpinnerWrap: { marginBottom: 24 },
  loadingTitle: { fontSize: 18, fontWeight: 700, color: 'var(--espresso)', marginBottom: 20 },
  loadingSteps: { width: '100%', maxWidth: 320 },
  errorBox: { padding: '40px 24px', textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: 700, color: 'var(--espresso)' },
  errorMsg: { marginTop: 8, fontSize: 14, color: 'var(--muted)' },
  retryBtn: { marginTop: 20, padding: '12px 28px', background: 'var(--espresso)', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700, color: 'var(--white)' },
  emptyBox: { padding: '60px 24px', textAlign: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: 'var(--espresso)' },
  emptyMsg: { marginTop: 8, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 },
}
