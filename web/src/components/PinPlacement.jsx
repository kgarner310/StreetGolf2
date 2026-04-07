import { useRef, useState } from 'react'

export default function PinPlacement({ photoDataUrl, onConfirm, onRetake }) {
  const [pin, setPin] = useState(null)
  const imgRef = useRef(null)

  function handleTap(e) {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setPin({
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    })
  }

  return (
    <div style={styles.screen}>
      <div style={styles.photoWrap} onClick={handleTap} onTouchStart={handleTap}>
        <img ref={imgRef} src={photoDataUrl} alt="capture" style={styles.photo} draggable={false} />
        {pin && (
          <div style={{
            ...styles.pin,
            left: `calc(${pin.x * 100}% - 14px)`,
            top: `calc(${pin.y * 100}% - 36px)`,
          }}>
            <div style={styles.flag}>⛳</div>
            <div style={styles.pinShadow} />
          </div>
        )}
        {!pin && <div style={styles.tapHint}>Tap to place the pin</div>}
      </div>

      <div style={styles.bar}>
        <button style={styles.retakeBtn} onClick={onRetake}>Retake</button>
        <button
          style={{ ...styles.goBtn, opacity: pin ? 1 : 0.4 }}
          disabled={!pin}
          onClick={() => onConfirm(pin)}
        >
          Generate Hole →
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
    background: '#000',
  },
  photoWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  pin: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  flag: { fontSize: '28px', lineHeight: 1 },
  pinShadow: {
    width: '10px',
    height: '4px',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: '50%',
    marginTop: '2px',
  },
  tapHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    borderRadius: '20px',
    padding: '12px 24px',
    pointerEvents: 'none',
  },
  bar: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: 'rgba(0,0,0,0.85)',
  },
  retakeBtn: {
    flex: 1,
    padding: '16px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
  },
  goBtn: {
    flex: 2,
    padding: '16px',
    borderRadius: '14px',
    background: '#f5c518',
    color: '#000',
    fontSize: '16px',
    fontWeight: 700,
    transition: 'opacity 0.2s',
  },
}
