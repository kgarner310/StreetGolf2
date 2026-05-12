import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'

export default function StylistProfile() {
  const navigate = useNavigate()
  const { id } = useParams()
  const results = useStore(s => s.results)
  const stylist = results.find(r => r.id === id)

  if (!stylist) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 16, color: 'var(--muted)' }}>Stylist not found.</div>
      <button style={s.backBtn} onClick={() => navigate('/results')}>← Back</button>
    </div>
  )

  const ig = stylist.instagram_analysis

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate('/results')} style={s.back}>← Results</button>
      </div>

      <div style={s.body}>
        {/* Hero */}
        <div style={s.hero}>
          {stylist.profile_image_url
            ? <img src={stylist.profile_image_url} alt={stylist.display_name} style={s.heroAvatar} />
            : <div style={s.heroAvatarFallback}>{stylist.display_name[0]}</div>
          }
          <h1 style={s.heroName}>{stylist.display_name}</h1>
          <div style={s.heroMeta}>
            <span>★ {stylist.reputation_score?.toFixed(1)}</span>
            <span style={s.dot}>·</span>
            <span>{stylist.neighborhood}</span>
            <span style={s.dot}>·</span>
            <span>{stylist.travel_minutes} min away</span>
          </div>
          {stylist.on_your_way && <div style={s.onYourWayPill}>On your way ✓</div>}
        </div>

        {/* Instagram Intelligence Section */}
        {ig && (
          <Section title="📸 Instagram Portfolio Analysis">
            <div style={s.igMeta}>
              <a href={`https://instagram.com/${stylist.instagram_handle}`} target="_blank" rel="noreferrer" style={s.igLink}>
                @{stylist.instagram_handle}
              </a>
              <span style={s.igPostCount}>{ig.post_count} posts analyzed</span>
            </div>

            {ig.sample_photos?.length > 0 && (
              <div style={s.photoGrid}>
                {ig.sample_photos.slice(0, 6).map((url, i) => (
                  <img key={i} src={url} alt="portfolio" style={s.gridPhoto} />
                ))}
              </div>
            )}

            <DetailRow
              label="Services confirmed in photos"
              value={ig.detected_services?.join(', ') || '—'}
            />
            <DetailRow
              label="Hair textures visible in work"
              value={ig.confirmed_textures?.join(', ') || '—'}
              highlight
            />
            <DetailRow
              label="Client sentiment score"
              value={`${Math.round((ig.sentiment_score || 0) * 100)}% positive`}
            />
            <DetailRow
              label="Repeat clients in comments"
              value={ig.repeat_client_ratio >= 0.1
                ? `${Math.round(ig.repeat_client_ratio * 100)}% of commenters are regulars`
                : 'Not enough data'
              }
            />

            {ig.notable_comments?.length > 0 && (
              <div style={s.commentsBlock}>
                <div style={s.commentsTitle}>What clients say</div>
                {ig.notable_comments.map((c, i) => (
                  <div key={i} style={s.comment}>"{c}"</div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Services + Pricing */}
        <Section title="Services">
          {stylist.service_ids?.map(sv => (
            <div key={sv} style={s.serviceRow}>
              <span style={s.serviceName}>{sv.replace(/_/g, ' ')}</span>
            </div>
          ))}
          {stylist.price_floor && (
            <div style={s.priceRange}>Prices from ${stylist.price_floor} – ${stylist.price_ceiling}</div>
          )}
        </Section>

        {/* Reputation breakdown */}
        <Section title="Reputation">
          {[
            { label: 'Google', value: stylist.google_rating, count: stylist.google_review_count },
            { label: 'StyleSeat', value: stylist.styleseat_rating },
            { label: 'Booksy', value: stylist.booksy_rating },
          ].filter(r => r.value).map(r => (
            <div key={r.label} style={s.repRow}>
              <span style={s.repLabel}>{r.label}</span>
              <span style={s.repStars}>★ {r.value?.toFixed(1)}</span>
              {r.count && <span style={s.repCount}>({r.count} reviews)</span>}
            </div>
          ))}
        </Section>
      </div>

      {/* Book CTA */}
      <div style={s.footer}>
        <div style={s.footerSlot}>
          Next: <strong>{stylist.next_slot_label || 'This week'}</strong>
        </div>
        <button
          style={s.bookBtn}
          onClick={() => window.open(stylist.booking_url, '_blank')}
        >
          Book {stylist.next_slot_short || 'Now'} →
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function DetailRow({ label, value, highlight }) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={{ ...s.detailValue, ...(highlight ? s.detailValueHighlight : {}) }}>{value}</span>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--cream)' },
  header: { padding: '14px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border)' },
  back: { background: 'none', fontSize: 15, fontWeight: 600, color: 'var(--rose)', padding: '4px 0' },
  body: { flex: 1, overflowY: 'auto', padding: '0 0 20px' },
  backBtn: { marginTop: 16, padding: '10px 20px', background: 'var(--espresso)', borderRadius: 10, color: 'white', fontWeight: 700 },

  hero: { padding: '32px 24px 24px', background: 'var(--white)', textAlign: 'center', borderBottom: '1px solid var(--border)' },
  heroAvatar: { width: 88, height: 88, borderRadius: 44, objectFit: 'cover', marginBottom: 12 },
  heroAvatarFallback: { width: 88, height: 88, borderRadius: 44, background: 'var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: 'var(--rose)', margin: '0 auto 12px' },
  heroName: { fontSize: 22, fontWeight: 800, color: 'var(--espresso)' },
  heroMeta: { marginTop: 8, fontSize: 14, color: 'var(--muted)', display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  dot: { color: 'var(--border)' },
  onYourWayPill: { marginTop: 10, display: 'inline-block', background: '#fdf0f3', color: 'var(--rose)', fontWeight: 700, fontSize: 12, padding: '4px 14px', borderRadius: 20 },

  section: { padding: '20px 20px 4px', borderBottom: '1px solid var(--border)' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: 'var(--espresso)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 },

  igMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  igLink: { fontSize: 14, fontWeight: 700, color: 'var(--rose)' },
  igPostCount: { fontSize: 13, color: 'var(--muted)' },

  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 },
  gridPhoto: { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 },

  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--blush)' },
  detailLabel: { fontSize: 13, color: 'var(--muted)', flex: 1 },
  detailValue: { fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', textAlign: 'right', maxWidth: '55%' },
  detailValueHighlight: { color: 'var(--rose)' },

  commentsBlock: { marginTop: 12, marginBottom: 4 },
  commentsTitle: { fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  comment: { fontSize: 13, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.5, padding: '8px 12px', background: 'var(--white)', borderRadius: 8, marginBottom: 6, borderLeft: '3px solid var(--rose)' },

  serviceRow: { paddingBottom: 8 },
  serviceName: { fontSize: 14, color: 'var(--charcoal)', textTransform: 'capitalize' },
  priceRange: { marginTop: 8, fontSize: 14, fontWeight: 700, color: 'var(--espresso)' },

  repRow: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 },
  repLabel: { fontSize: 14, color: 'var(--muted)', width: 80 },
  repStars: { fontSize: 14, fontWeight: 700, color: 'var(--gold)' },
  repCount: { fontSize: 13, color: 'var(--muted)' },

  footer: { padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--white)', display: 'flex', alignItems: 'center', gap: 14 },
  footerSlot: { flex: 1, fontSize: 14, color: 'var(--charcoal)' },
  bookBtn: { padding: '13px 22px', background: 'var(--rose)', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700, color: 'white' },
}
