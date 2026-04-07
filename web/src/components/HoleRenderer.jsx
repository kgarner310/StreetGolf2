import { useEffect, useState } from 'react'
import { generateHole } from '../api/generateHole'

const STAGES = [
  'Scanning scene…',
  'Laying down fairway…',
  'Shaping the rough…',
  'Placing the pin…',
  'Final touches…',
]

export default function HoleRenderer({ photoDataUrl, pin, onReady }) {
  const [stage, setStage] = useState(0)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    // Show the original photo as a behind-the-scenes preview
    setPreviewUrl(photoDataUrl)

    let stageTimer
    let stageIdx = 0
    function advanceStage() {
      stageIdx = Math.min(stageIdx + 1, STAGES.length - 1)
      setStage(stageIdx)
      if (stageIdx < STAGES.length - 1) {
        stageTimer = setTimeout(advanceStage, 4500)
      }
    }
    stageTimer = setTimeout(advanceStage, 3000)

    generateHole(photoDataUrl, pin)
      .then((url) => {
        clearTimeout(stageTimer)
        onReady(url)
      })
      .catch((err) => {
        clearTimeout(stageTimer)
        setError(err.message)
      })

    return () => clearTimeout(stageTimer)
  }, []) // eslint-disable-line

  if (error) {
    return (
      <div style={styles.screen}>
        <img src={photoDataUrl} alt="" style={styles.bgPhoto} />
        <div style={styles.overlay}>
          <p style={styles.errorIcon}>⚠️</p>
          <p style={styles.errorTitle}>Generation failed</p>
          <p style={styles.errorMsg}>{error}</p>
          {error.includes('VITE_REPLICATE_API_TOKEN') && (
            <p style={styles.hint}>Add your Replicate API token to <code>web/.env</code> as <code>VITE_REPLICATE_API_TOKEN=r8_xxx</code></p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.screen}>
      <img src={previewUrl} alt="" style={styles.bgPhoto} />
      <div style={styles.overlay}>
        <div style={styles.spinner} />
        <p style={styles.stageText}>{STAGES[stage]}</p>
        <div style={styles.progress}>
          <div style={{ ...styles.progressBar, width: `${((stage + 1) / STAGES.length) * 100}%` }} />
        </div>
        <p style={styles.sub}>Building your golf hole from your photo</p>
      </div>
    </div>
  )
}

const styles = {
  screen: {
    position: 'relative',
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    background: '#000',
  },
  bgPhoto: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'blur(8px) brightness(0.4)',
    transform: 'scale(1.05)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '32px',
  },
  spinner: {
    width: '52px',
    height: '52px',
    border: '4px solid rgba(255,255,255,0.15)',
    borderTopColor: '#f5c518',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  stageText: { fontSize: '22px', fontWeight: 700, color: '#fff', textAlign: 'center' },
  progress: {
    width: '240px',
    height: '6px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: '#f5c518',
    borderRadius: '3px',
    transition: 'width 1.2s ease',
  },
  sub: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  errorIcon: { fontSize: '48px' },
  errorTitle: { fontSize: '22px', fontWeight: 700, color: '#fff' },
  errorMsg: { fontSize: '14px', color: '#ff7070', textAlign: 'center', maxWidth: '300px' },
  hint: { fontSize: '13px', color: '#ccc', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6 },
}

// Inject keyframes
const sheet = document.styleSheets[0]
try {
  sheet.insertRule('@keyframes spin { to { transform: rotate(360deg) } }', sheet.cssRules.length)
} catch {}
