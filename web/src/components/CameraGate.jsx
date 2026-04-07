import { useState } from 'react'

export default function CameraGate({ onAllow }) {
  const [checking, setChecking] = useState(false)
  const [denied, setDenied] = useState(false)

  async function handleAllow() {
    setChecking(true)
    setDenied(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      // Stop immediately — PhotoCapture will re-request
      stream.getTracks().forEach(t => t.stop())
      onAllow()
    } catch {
      setDenied(true)
      setChecking(false)
    }
  }

  return (
    <div style={styles.screen}>
      <div style={styles.logo}>⛳</div>
      <h1 style={styles.title}>Street Golf</h1>
      <p style={styles.sub}>Turn any scene into a playable golf hole</p>

      <div style={styles.card}>
        <p style={styles.cardText}>
          To play, we need your <strong>camera</strong>. We only access it while you're creating a hole — never in the background.
        </p>
        {denied && (
          <p style={styles.error}>
            Camera access was denied. Please allow camera access in your browser settings and try again.
          </p>
        )}
        <button style={styles.btn} onClick={handleAllow} disabled={checking}>
          {checking ? 'Checking…' : 'Allow Camera & Play'}
        </button>
        <p style={styles.nope}>No camera, no golf.</p>
      </div>
    </div>
  )
}

const styles = {
  screen: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(160deg, #0d2b0d 0%, #1a4a1a 100%)',
    gap: '16px',
  },
  logo: { fontSize: '72px', lineHeight: 1 },
  title: { fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', color: '#fff' },
  sub: { fontSize: '16px', color: '#9dc99d', textAlign: 'center', maxWidth: '280px' },
  card: {
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '340px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  },
  cardText: { fontSize: '15px', lineHeight: 1.6, color: '#ddd' },
  error: { fontSize: '13px', color: '#ff7070', background: 'rgba(255,80,80,0.1)', borderRadius: '8px', padding: '10px' },
  btn: {
    background: '#f5c518',
    color: '#000',
    fontWeight: 700,
    fontSize: '17px',
    borderRadius: '14px',
    padding: '16px',
    width: '100%',
    transition: 'opacity 0.15s',
  },
  nope: { fontSize: '12px', color: '#666', textAlign: 'center' },
}
