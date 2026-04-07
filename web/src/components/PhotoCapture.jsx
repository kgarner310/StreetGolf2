import { useEffect, useRef, useState } from 'react'

export default function PhotoCapture({ onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let active = true
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setReady(true)
        }
      })
      .catch(console.error)
    return () => {
      active = false
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setFlash(true)
    setTimeout(() => {
      setFlash(false)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      onCapture(dataUrl)
    }, 150)
  }

  return (
    <div style={styles.screen}>
      <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {flash && <div style={styles.flash} />}

      <div style={styles.overlay}>
        <p style={styles.hint}>Find a spot that looks like it could be a golf hole</p>
        <div style={styles.reticle} />
        <button
          style={{ ...styles.shutterOuter, opacity: ready ? 1 : 0.4 }}
          onClick={capture}
          disabled={!ready}
        >
          <div style={styles.shutterInner} />
        </button>
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
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  flash: {
    position: 'absolute',
    inset: 0,
    background: '#fff',
    opacity: 0.85,
    zIndex: 10,
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '48px 24px 56px',
  },
  hint: {
    fontSize: '14px',
    color: '#fff',
    background: 'rgba(0,0,0,0.45)',
    borderRadius: '20px',
    padding: '8px 16px',
    textAlign: 'center',
  },
  reticle: {
    width: '220px',
    height: '220px',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: '16px',
    pointerEvents: 'none',
  },
  shutterOuter: {
    width: '74px',
    height: '74px',
    borderRadius: '50%',
    border: '4px solid #fff',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  shutterInner: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    background: '#fff',
  },
}
