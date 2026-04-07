import { useState, useEffect } from 'react'

// In-memory hole feed (persists in sessionStorage for now; backend TBD)
function loadHoles() {
  try {
    return JSON.parse(sessionStorage.getItem('sg_holes') || '[]')
  } catch { return [] }
}
function saveHoles(holes) {
  try { sessionStorage.setItem('sg_holes', JSON.stringify(holes.slice(0, 20))) } catch {}
}

export default function HoleFeed({ currentHole, onBack, onNewHole }) {
  const [holes, setHoles] = useState([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const existing = loadHoles()
    // Add current hole to top if it hasn't been submitted yet
    if (currentHole?.imageUrl && !submitted) {
      const entry = {
        id: Date.now(),
        imageUrl: currentHole.imageUrl,
        votes: 0,
        createdAt: new Date().toISOString(),
        mine: true,
      }
      const updated = [entry, ...existing]
      saveHoles(updated)
      setHoles(updated)
      setSubmitted(true)
    } else {
      setHoles(existing)
    }
  }, []) // eslint-disable-line

  function vote(id) {
    setHoles(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, votes: h.votes + 1, voted: true } : h)
      saveHoles(updated)
      return updated
    })
  }

  // Sort by votes descending for leaderboard feel
  const sorted = [...holes].sort((a, b) => b.votes - a.votes)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <button style={styles.back} onClick={onBack}>← Back</button>
        <div>
          <div style={styles.title}>Hole of the Day</div>
          <div style={styles.date}>{today}</div>
        </div>
        <button style={styles.newBtn} onClick={onNewHole}>+ New</button>
      </div>

      {holes.length === 0 && (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No holes yet.</p>
          <p style={styles.emptySub}>Create one and it'll show up here for the community to vote.</p>
        </div>
      )}

      <div style={styles.feed}>
        {sorted.map((hole, i) => (
          <HoleCard key={hole.id} hole={hole} rank={i + 1} onVote={() => vote(hole.id)} />
        ))}
      </div>
    </div>
  )
}

function HoleCard({ hole, rank, onVote }) {
  return (
    <div style={card.wrap}>
      {rank <= 3 && (
        <div style={{ ...card.badge, background: rank === 1 ? '#f5c518' : rank === 2 ? '#aaa' : '#cd7f32' }}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
        </div>
      )}
      <img src={hole.imageUrl} alt="hole" style={card.img} />
      <div style={card.footer}>
        <div style={card.meta}>
          {hole.mine && <span style={card.mineBadge}>Yours</span>}
          <span style={card.time}>
            {new Date(hole.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <button
          style={{ ...card.voteBtn, opacity: hole.voted ? 0.5 : 1 }}
          onClick={hole.voted ? undefined : onVote}
          disabled={hole.voted}
        >
          ⛳ {hole.votes} {hole.votes === 1 ? 'vote' : 'votes'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  screen: {
    width: '100vw',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a1a0a',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(0,0,0,0.4)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  back: {
    background: 'transparent',
    color: '#f5c518',
    fontSize: '15px',
    fontWeight: 600,
    padding: '6px',
  },
  title: { fontSize: '18px', fontWeight: 800, color: '#fff', textAlign: 'center' },
  date: { fontSize: '12px', color: '#666', textAlign: 'center' },
  newBtn: {
    background: '#f5c518',
    color: '#000',
    fontWeight: 700,
    fontSize: '14px',
    padding: '8px 14px',
    borderRadius: '10px',
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px',
  },
  emptyText: { fontSize: '20px', color: '#fff', fontWeight: 700 },
  emptySub: { fontSize: '14px', color: '#666', textAlign: 'center', maxWidth: '260px' },
}

const card = {
  wrap: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#111',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  badge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    fontSize: '20px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  img: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
  },
  meta: { display: 'flex', alignItems: 'center', gap: '8px' },
  mineBadge: {
    background: 'rgba(245,197,24,0.15)',
    color: '#f5c518',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
  },
  time: { fontSize: '13px', color: '#555' },
  voteBtn: {
    background: 'rgba(245,197,24,0.12)',
    color: '#f5c518',
    fontWeight: 700,
    fontSize: '14px',
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
}
