import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

const PHASE = { AIM: 'aim', POWER: 'power', SHOT: 'shot', RESULT: 'result' }
const AIM_SPEED = 1.4
const POWER_SPEED = 1.1

export default function GolfGame({ holeImageUrl, pin, onFeed, onNewHole }) {
  const canvasRef = useRef(null)
  const s = useRef({
    phase: PHASE.AIM,
    aimAngle: 0, aimDir: 1,
    power: 0, powerDir: 1,
    ball: { x: 0.5, y: 0.88 },
    flight: null, elapsed: 0,
    lastTs: null,
    result: null, shotCount: 0,
  })
  const rafRef = useRef(null)
  const holeImgRef = useRef(null)

  const [phase, setPhase] = useState(PHASE.AIM)
  const [result, setResult] = useState(null)
  const [shotCount, setShotCount] = useState(0)

  // useMemo so the object reference is stable — prevents RAF loop restarting on every state update
  const pinPos = useMemo(() => pin || { x: 0.5, y: 0.2 }, [pin])

  const loop = useCallback((ts) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const st = s.current

    const dt = st.lastTs ? Math.min((ts - st.lastTs) / 1000, 0.05) : 0
    st.lastTs = ts

    if (st.phase === PHASE.AIM) {
      st.aimAngle += AIM_SPEED * st.aimDir * dt
      if (Math.abs(st.aimAngle) > 0.65) st.aimDir *= -1
    } else if (st.phase === PHASE.POWER) {
      st.power += POWER_SPEED * st.powerDir * dt
      if (st.power >= 1) { st.power = 1; st.powerDir = -1 }
      if (st.power <= 0) { st.power = 0; st.powerDir = 1 }
    } else if (st.phase === PHASE.SHOT && st.flight) {
      st.elapsed += dt
      const t = Math.min(st.elapsed / st.flight.duration, 1)
      st.ball.x = st.flight.sx + (st.flight.tx - st.flight.sx) * t
      st.ball.y = st.flight.sy + (st.flight.ty - st.flight.sy) * t
        - Math.sin(Math.PI * t) * st.flight.arc
      if (t >= 1) {
        const dx = (st.ball.x - pinPos.x) * W
        const dy = (st.ball.y - pinPos.y) * H
        const dist = Math.sqrt(dx * dx + dy * dy)
        const res = scoreResult(dist)
        st.phase = PHASE.RESULT
        st.result = res
        setPhase(PHASE.RESULT)
        setResult(res)
        return
      }
    }

    // --- Render ---
    ctx.clearRect(0, 0, W, H)

    // Hole image background
    const img = holeImgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, W, H)
    } else {
      ctx.fillStyle = '#1a4a1a'
      ctx.fillRect(0, 0, W, H)
    }

    const bx = st.ball.x * W
    const by = st.ball.y * H
    const px = pinPos.x * W
    const py = pinPos.y * H

    // Aim line
    if (st.phase === PHASE.AIM) {
      const len = Math.min(W, H) * 0.38
      const ex = bx + Math.sin(st.aimAngle) * len
      const ey = by - Math.cos(st.aimAngle) * len
      ctx.save()
      ctx.strokeStyle = 'rgba(245,197,24,0.9)'
      ctx.lineWidth = 3
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(ex, ey)
      ctx.stroke()
      const ang = Math.atan2(ey - by, ex - bx)
      ctx.setLineDash([])
      ctx.fillStyle = '#f5c518'
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - 14 * Math.cos(ang - 0.45), ey - 14 * Math.sin(ang - 0.45))
      ctx.lineTo(ex - 14 * Math.cos(ang + 0.45), ey - 14 * Math.sin(ang + 0.45))
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // Ball flight trail
    if (st.phase === PHASE.SHOT && st.flight) {
      const t = st.elapsed / st.flight.duration
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 7])
      ctx.beginPath()
      const steps = 24
      for (let i = 0; i <= Math.floor(steps * t); i++) {
        const it = i / steps
        const ix = (st.flight.sx + (st.flight.tx - st.flight.sx) * it) * W
        const iy = (st.flight.sy + (st.flight.ty - st.flight.sy) * it
          - Math.sin(Math.PI * it) * st.flight.arc) * H
        i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy)
      }
      ctx.stroke()
      ctx.restore()
    }

    // Pin
    ctx.save()
    ctx.font = `${Math.min(W, H) * 0.065}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 8
    ctx.fillText('⛳', px, py)
    ctx.restore()

    // Ball
    const br = Math.min(W, H) * 0.024
    ctx.save()
    const grad = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, br * 0.1, bx, by, br)
    grad.addColorStop(0, '#fff')
    grad.addColorStop(1, '#bbb')
    ctx.fillStyle = grad
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Power bar
    if (st.phase === PHASE.POWER) {
      drawPowerBar(ctx, W, H, st.power)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [pinPos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      // Read CSS dimensions first before mutating canvas.width/height
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width = w * devicePixelRatio
      canvas.height = h * devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

    const img = new Image()
    // No crossOrigin — Replicate CDN doesn't need it for display-only use
    img.src = holeImageUrl
    holeImgRef.current = img

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [loop, holeImageUrl])

  function handleTap(e) {
    e.preventDefault()
    const st = s.current
    const canvas = canvasRef.current
    if (!canvas) return

    if (st.phase === PHASE.AIM) {
      st.phase = PHASE.POWER
      st.power = 0
      st.powerDir = 1
      setPhase(PHASE.POWER)
    } else if (st.phase === PHASE.POWER) {
      const power = st.power
      const angle = st.aimAngle
      const duration = 0.9 + (1 - power) * 0.9
      const arc = 0.24 - power * 0.06
      // High power = closer to pin; low power = overshoots based on angle drift
      const drift = (1 - power) * 0.07
      st.flight = {
        sx: st.ball.x, sy: st.ball.y,
        tx: pinPos.x + Math.sin(angle) * drift,
        ty: pinPos.y + (1 - power) * 0.04,
        duration, arc,
      }
      st.elapsed = 0
      st.phase = PHASE.SHOT
      st.shotCount += 1
      setShotCount(st.shotCount)
      setPhase(PHASE.SHOT)
    }
  }

  function resetShot() {
    const st = s.current
    st.phase = PHASE.AIM
    st.aimAngle = 0; st.aimDir = 1
    st.power = 0; st.powerDir = 1
    st.ball = { x: 0.5, y: 0.88 }
    st.flight = null; st.elapsed = 0
    st.result = null; st.lastTs = null
    setPhase(PHASE.AIM)
    setResult(null)
    rafRef.current = requestAnimationFrame(loop)
  }

  const tappable = phase === PHASE.AIM || phase === PHASE.POWER

  return (
    <div style={styles.screen}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        onClick={tappable ? handleTap : undefined}
        onTouchStart={tappable ? handleTap : undefined}
      />

      <div style={styles.hud}>
        <span style={styles.hudChip}>Shot {shotCount + 1}</span>
      </div>

      {phase === PHASE.AIM && <Hint>Tap to lock aim</Hint>}
      {phase === PHASE.POWER && <Hint>Tap to shoot</Hint>}

      {phase === PHASE.RESULT && result && (
        <ResultOverlay
          result={result}
          shotCount={shotCount}
          onShare={onFeed}
          onRetry={resetShot}
          onNewHole={onNewHole}
        />
      )}
    </div>
  )
}

function Hint({ children }) {
  return <div style={styles.hint}>{children}</div>
}

function drawPowerBar(ctx, W, H, power) {
  // All constants are in CSS pixels; multiply by dpr since canvas is in physical pixels
  const dpr = devicePixelRatio
  const barW = W * 0.52
  const barH = 22 * dpr
  const pad = 14 * dpr
  const x = (W - barW) / 2
  const y = H - 110 * dpr

  ctx.save()
  // Backdrop
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.beginPath()
  rrect(ctx, x - pad, y - pad, barW + pad * 2, barH + pad * 2.5, 16 * dpr)
  ctx.fill()
  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  rrect(ctx, x, y, barW, barH, barH / 2)
  ctx.fill()
  // Fill — green → yellow → red
  const r = power < 0.5 ? Math.round(power * 2 * 230) : 230
  const g = power < 0.5 ? 210 : Math.round((1 - (power - 0.5) * 2) * 210)
  ctx.fillStyle = `rgb(${r},${g},0)`
  ctx.beginPath()
  rrect(ctx, x, y, barW * power, barH, barH / 2)
  ctx.fill()
  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = `bold ${14 * dpr}px -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('POWER', W / 2, y + barH + 8 * dpr)
  ctx.restore()
}

function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function scoreResult(distPx) {
  // distPx is in canvas pixels (already scaled by devicePixelRatio)
  const d = distPx / devicePixelRatio
  if (d < 20) return { label: 'Hole In One!', emoji: '🏆' }
  if (d < 40) return { label: 'Eagle!', emoji: '🦅' }
  if (d < 65) return { label: 'Birdie!', emoji: '🐦' }
  if (d < 100) return { label: 'Par', emoji: '✅' }
  if (d < 150) return { label: 'Bogey', emoji: '😬' }
  return { label: 'Double Bogey', emoji: '😅' }
}

function ResultOverlay({ result, shotCount, onShare, onRetry, onNewHole }) {
  return (
    <div style={overlay.bg}>
      <div style={overlay.card}>
        <div style={overlay.emoji}>{result.emoji}</div>
        <div style={overlay.label}>{result.label}</div>
        <div style={overlay.shots}>{shotCount} shot{shotCount !== 1 ? 's' : ''}</div>
        <div style={overlay.actions}>
          <button style={{ ...overlay.btn, background: '#f5c518', color: '#000' }} onClick={onShare}>
            Share Hole & Vote ⛳
          </button>
          <button style={{ ...overlay.btn, background: 'rgba(255,255,255,0.12)', color: '#fff' }} onClick={onRetry}>
            Try Again
          </button>
          <button style={{ ...overlay.btn, background: 'rgba(255,255,255,0.07)', color: '#999' }} onClick={onNewHole}>
            New Hole
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  screen: {
    position: 'relative',
    width: '100vw',
    height: '100dvh',
    background: '#000',
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    touchAction: 'none',
  },
  hud: {
    position: 'absolute',
    top: '16px',
    left: '16px',
  },
  hudChip: {
    background: 'rgba(0,0,0,0.6)',
    color: '#f5c518',
    fontWeight: 700,
    fontSize: '14px',
    padding: '6px 14px',
    borderRadius: '20px',
    backdropFilter: 'blur(6px)',
  },
  hint: {
    position: 'absolute',
    bottom: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.65)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    padding: '10px 28px',
    borderRadius: '24px',
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
}

const overlay = {
  bg: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    background: 'linear-gradient(160deg, #0d2b0d, #1a4a1a)',
    borderRadius: '24px',
    padding: '36px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    minWidth: '280px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  emoji: { fontSize: '64px', lineHeight: 1 },
  label: { fontSize: '30px', fontWeight: 800, color: '#f5c518' },
  shots: { fontSize: '15px', color: '#888', marginBottom: '4px' },
  actions: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '6px' },
  btn: {
    width: '100%',
    padding: '15px',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
}
