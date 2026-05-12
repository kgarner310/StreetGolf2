import { useNavigate } from 'react-router-dom'

export default function StylistCard({ stylist, rank }) {
  const navigate = useNavigate()
  const ig = stylist.instagram_analysis

  const reputationLabel = stylist.reputation_score >= 4.8
    ? 'Exceptional'
    : stylist.reputation_score >= 4.5
    ? 'Highly Rated'
    : 'Well Reviewed'

  return (
    <div style={s.card} onClick={() => navigate(`/stylist/${stylist.id}`)}>
      {/* Photo + identity row */}
      <div style={s.topRow}>
        <div style={s.avatarWrap}>
          {stylist.profile_image_url
            ? <img src={stylist.profile_image_url} alt={stylist.display_name} style={s.avatar} />
            : <div style={s.avatarFallback}>{stylist.display_name[0]}</div>
          }
          {rank <= 3 && <div style={s.rankBadge}>#{rank}</div>}
        </div>

        <div style={s.identity}>
          <div style={s.name}>{stylist.display_name}</div>
          <div style={s.meta}>
            <span style={s.stars}>★ {stylist.reputation_score?.toFixed(1)}</span>
            <span style={s.dot}>·</span>
            <span style={s.metaLabel}>{reputationLabel}</span>
          </div>
          <div style={s.distanceRow}>
            <span style={s.distance}>{stylist.travel_minutes} min away</span>
            {stylist.on_your_way && <span style={s.onYourWay}>On your way ✓</span>}
          </div>
        </div>
      </div>

      {/* Instagram evidence — the core differentiator */}
      {ig && (
        <div style={s.igSection}>
          <div style={s.igHeader}>
            <span style={s.igIcon}>📸</span>
            <span style={s.igTitle}>Verified from Instagram</span>
            <span style={s.igHandle}>@{stylist.instagram_handle}</span>
          </div>

          {/* Detected services from photo analysis */}
          {ig.detected_services?.length > 0 && (
            <div style={s.igRow}>
              <span style={s.igRowLabel}>Portfolio shows:</span>
              <div style={s.tagRow}>
                {ig.detected_services.slice(0, 4).map(sv => (
                  <span key={sv} style={s.tag}>{sv}</span>
                ))}
              </div>
            </div>
          )}

          {/* Texture confirmation */}
          {ig.confirmed_textures?.length > 0 && (
            <div style={s.igRow}>
              <span style={s.igRowLabel}>Works with:</span>
              <div style={s.tagRow}>
                {ig.confirmed_textures.map(t => (
                  <span key={t} style={{ ...s.tag, ...s.tagTexture }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Client comment sentiment */}
          <div style={s.igRow}>
            <span style={s.igRowLabel}>Client reactions:</span>
            <div style={s.sentimentBar}>
              <div style={{ ...s.sentimentFill, width: `${(ig.sentiment_score || 0.8) * 100}%` }} />
            </div>
            <span style={s.sentimentLabel}>
              {ig.sentiment_score >= 0.85 ? '😍 Clients love her' : ig.sentiment_score >= 0.7 ? '😊 Positive reviews' : '👍 Good feedback'}
            </span>
          </div>

          {/* Repeat client signal */}
          {ig.repeat_client_ratio >= 0.3 && (
            <div style={s.repeatBadge}>
              🔁 {Math.round(ig.repeat_client_ratio * 100)}% of commenters are regulars
            </div>
          )}

          {/* Sample portfolio photos */}
          {ig.sample_photos?.length > 0 && (
            <div style={s.photoRow}>
              {ig.sample_photos.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="portfolio" style={s.portfolioPhoto} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Availability + Book CTA */}
      <div style={s.bookRow}>
        <div style={s.slotInfo}>
          <span style={s.slotLabel}>Next opening</span>
          <span style={s.slotTime}>{stylist.next_slot_label || 'This week'}</span>
        </div>
        <button
          style={s.bookBtn}
          onClick={e => { e.stopPropagation(); window.open(stylist.booking_url, '_blank') }}
        >
          Book {stylist.next_slot_short || 'Now'} →
        </button>
      </div>
    </div>
  )
}

const s = {
  card: {
    background: 'var(--white)',
    borderRadius: 'var(--radius)',
    padding: 20,
    marginBottom: 16,
    boxShadow: 'var(--shadow-card)',
    cursor: 'pointer',
    border: '1px solid var(--border)',
  },
  topRow: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 64, height: 64, borderRadius: 32, objectFit: 'cover' },
  avatarFallback: {
    width: 64, height: 64, borderRadius: 32,
    background: 'var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 700, color: 'var(--rose)'
  },
  rankBadge: {
    position: 'absolute', bottom: -2, right: -4,
    background: 'var(--gold)', color: 'white', fontSize: 10, fontWeight: 800,
    padding: '2px 5px', borderRadius: 8
  },
  identity: { flex: 1 },
  name: { fontSize: 17, fontWeight: 700, color: 'var(--espresso)' },
  meta: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
  stars: { fontSize: 13, fontWeight: 700, color: 'var(--gold)' },
  dot: { color: 'var(--muted)', fontSize: 12 },
  metaLabel: { fontSize: 13, color: 'var(--muted)' },
  distanceRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  distance: { fontSize: 13, color: 'var(--muted)' },
  onYourWay: { fontSize: 11, fontWeight: 700, color: 'var(--rose)', background: '#fdf0f3', padding: '2px 8px', borderRadius: 10 },

  igSection: { background: 'var(--blush)', borderRadius: 'var(--radius-sm)', padding: '14px 14px', marginBottom: 14 },
  igHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  igIcon: { fontSize: 14 },
  igTitle: { fontSize: 12, fontWeight: 700, color: 'var(--espresso)', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  igHandle: { fontSize: 12, color: 'var(--muted)' },

  igRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  igRowLabel: { fontSize: 12, color: 'var(--muted)', fontWeight: 600, minWidth: 90 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 11, fontWeight: 600, background: 'white', color: 'var(--espresso)', padding: '3px 10px', borderRadius: 12, border: '1px solid var(--border)' },
  tagTexture: { background: 'var(--espresso)', color: 'white', border: 'none' },

  sentimentBar: { height: 6, width: 80, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  sentimentFill: { height: '100%', background: 'var(--rose)', borderRadius: 3 },
  sentimentLabel: { fontSize: 12, color: 'var(--charcoal)' },

  repeatBadge: { fontSize: 12, color: 'var(--espresso)', background: 'white', padding: '4px 10px', borderRadius: 10, display: 'inline-block', marginBottom: 10 },

  photoRow: { display: 'flex', gap: 6, marginTop: 4 },
  portfolioPhoto: { width: 72, height: 72, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '2px solid white' },

  bookRow: { display: 'flex', alignItems: 'center', gap: 12 },
  slotInfo: { flex: 1 },
  slotLabel: { display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 },
  slotTime: { display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--espresso)', marginTop: 2 },
  bookBtn: { padding: '12px 20px', background: 'var(--rose)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 },
}
