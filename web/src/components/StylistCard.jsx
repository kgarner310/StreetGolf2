import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export default function StylistCard({ stylist, rank }) {
  const navigate = useNavigate()
  const vibeProfile = useStore(s => s.vibeProfile)
  const ig = stylist.instagram_analysis

  const reputationLabel = stylist.reputation_score >= 4.8
    ? 'Exceptional'
    : stylist.reputation_score >= 4.5
    ? 'Highly Rated'
    : 'Well Reviewed'

  const vibeMatch = computeVibeMatch(
    vibeProfile?.analysis?.aesthetics ?? [],
    vibeProfile?.analysis?.vibe_tags ?? [],
    stylist.vibe_aesthetics ?? [],
    ig?.detected_services ?? []
  )

  const trustTier = computeTrustTier(stylist, ig)

  return (
    <div style={s.card} onClick={() => navigate(`/stylist/${stylist.id}`)}>
      {/* Vibe match banner */}
      {vibeMatch !== null && (
        <div style={{ ...s.vibeBanner, ...(vibeMatch >= 80 ? s.vibeBannerHigh : vibeMatch >= 60 ? s.vibeBannerMid : s.vibeBannerLow) }}>
          <span style={s.vibeMatchIcon}>{vibeMatch >= 80 ? '🔥' : vibeMatch >= 60 ? '✨' : '💫'}</span>
          <span style={s.vibeMatchPct}>{vibeMatch}% vibe match</span>
          {vibeMatch >= 80 && <span style={s.vibeMatchLabel}>Your aesthetic twin</span>}
          {vibeMatch >= 60 && vibeMatch < 80 && <span style={s.vibeMatchLabel}>Strong fit</span>}
          {vibeMatch < 60 && <span style={s.vibeMatchLabel}>Different style, still skilled</span>}
        </div>
      )}

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

      {/* Instagram evidence panel */}
      {ig && (
        <div style={s.igSection}>
          <div style={s.igHeader}>
            <span style={s.igIcon}>📸</span>
            <span style={s.igTitle}>
              {trustTier === 'verified' ? 'Portfolio Verified' : trustTier === 'mismatch' ? 'Claims vs. Portfolio' : 'From Instagram'}
            </span>
            <span style={s.igHandle}>@{stylist.instagram_handle}</span>
            <TrustBadge tier={trustTier} />
          </div>

          {/* Short-cut bias warning for long-haired users */}
          {ig.short_cut_bias && (
            <div style={s.biasBanner}>
              ⚠️ Portfolio shows mostly short styles — confirm they work with your length
            </div>
          )}

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

          {ig.length_specialties?.length > 0 && (
            <div style={s.igRow}>
              <span style={s.igRowLabel}>Hair lengths:</span>
              <div style={s.tagRow}>
                {ig.length_specialties.map(l => (
                  <span key={l} style={{ ...s.tag, ...s.tagLength }}>{l}</span>
                ))}
              </div>
            </div>
          )}

          <div style={s.igRow}>
            <span style={s.igRowLabel}>Client reactions:</span>
            <div style={s.sentimentBar}>
              <div style={{ ...s.sentimentFill, width: `${(ig.sentiment_score || 0.8) * 100}%` }} />
            </div>
            <span style={s.sentimentLabel}>
              {ig.sentiment_score >= 0.85 ? '😍 Clients love her' : ig.sentiment_score >= 0.7 ? '😊 Positive reviews' : '👍 Good feedback'}
            </span>
          </div>

          {ig.repeat_client_ratio >= 0.3 && (
            <div style={s.repeatBadge}>
              🔁 {Math.round(ig.repeat_client_ratio * 100)}% of commenters are regulars
            </div>
          )}

          {ig.sample_photos?.length > 0 && (
            <div style={s.photoRow}>
              {ig.sample_photos.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="portfolio" style={s.portfolioPhoto} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No IG — show self-reported badge */}
      {!ig && (
        <div style={s.selfReportedBanner}>
          <span style={s.selfReportedIcon}>📋</span>
          <span style={s.selfReportedText}>Self-reported services — no portfolio verification yet</span>
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

function TrustBadge({ tier }) {
  if (tier === 'verified') {
    return <span style={s.trustVerified}>✓ Verified</span>
  }
  if (tier === 'mismatch') {
    return <span style={s.trustMismatch}>⚠ Mismatch</span>
  }
  return null
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

  trustVerified: { fontSize: 10, fontWeight: 800, background: '#e8f5e9', color: '#2e7d32', padding: '2px 7px', borderRadius: 8, marginLeft: 4 },
  trustMismatch: { fontSize: 10, fontWeight: 800, background: '#fff3e0', color: '#e65100', padding: '2px 7px', borderRadius: 8, marginLeft: 4 },

  biasBanner: { fontSize: 12, color: '#7a4000', background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 6, padding: '7px 10px', marginBottom: 10 },

  igRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  igRowLabel: { fontSize: 12, color: 'var(--muted)', fontWeight: 600, minWidth: 90 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 11, fontWeight: 600, background: 'white', color: 'var(--espresso)', padding: '3px 10px', borderRadius: 12, border: '1px solid var(--border)' },
  tagTexture: { background: 'var(--espresso)', color: 'white', border: 'none' },
  tagLength: { background: 'var(--rose)', color: 'white', border: 'none' },

  sentimentBar: { height: 6, width: 80, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  sentimentFill: { height: '100%', background: 'var(--rose)', borderRadius: 3 },
  sentimentLabel: { fontSize: 12, color: 'var(--charcoal)' },

  repeatBadge: { fontSize: 12, color: 'var(--espresso)', background: 'white', padding: '4px 10px', borderRadius: 10, display: 'inline-block', marginBottom: 10 },

  photoRow: { display: 'flex', gap: 6, marginTop: 4 },
  portfolioPhoto: { width: 72, height: 72, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '2px solid white' },

  selfReportedBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f5f5f5', borderRadius: 'var(--radius-sm)', marginBottom: 14 },
  selfReportedIcon: { fontSize: 14 },
  selfReportedText: { fontSize: 12, color: 'var(--muted)' },

  bookRow: { display: 'flex', alignItems: 'center', gap: 12 },
  slotInfo: { flex: 1 },
  slotLabel: { display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 },
  slotTime: { display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--espresso)', marginTop: 2 },
  bookBtn: { padding: '12px 20px', background: 'var(--rose)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 },

  vibeBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 12 },
  vibeBannerHigh: { background: 'linear-gradient(90deg, #2c1a0e 0%, #5a2a40 100%)', color: 'white' },
  vibeBannerMid: { background: 'var(--blush)', color: 'var(--espresso)' },
  vibeBannerLow: { background: '#f5f5f5', color: 'var(--muted)' },
  vibeMatchIcon: { fontSize: 16 },
  vibeMatchPct: { fontWeight: 800, fontSize: 15 },
  vibeMatchLabel: { fontSize: 12, opacity: 0.8, marginLeft: 'auto' },
}

function computeVibeMatch(userAesthetics, userTags, stylistAesthetics, stylistServices) {
  if (!userAesthetics.length && !userTags.length) return null
  if (!stylistAesthetics.length) return null
  const allUser = [...userAesthetics, ...userTags].map(s => s.toLowerCase())
  const allStylest = stylistAesthetics.map(s => s.toLowerCase())
  const overlap = allUser.filter(a => allStylest.some(b => b.includes(a) || a.includes(b))).length
  const score = Math.round((overlap / Math.max(allUser.length, 1)) * 100)
  return Math.min(Math.max(score, 15), 98)
}

function computeTrustTier(stylist, ig) {
  if (!ig) return 'self_reported'
  // Mismatch: claims curly/coily/4C specialization but Instagram shows short_cut_bias
  const claimsTextured = (stylist.texture_categories ?? []).some(t => ['curly', 'coily', '4c'].includes(t))
  if (ig.short_cut_bias && claimsTextured) return 'mismatch'
  // Verified: IG analysis has confirmed textures or detected services
  if ((ig.confirmed_textures?.length > 0) || (ig.detected_services?.length > 0)) return 'verified'
  return 'self_reported'
}
