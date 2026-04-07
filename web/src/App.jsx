import { useState } from 'react'
import CameraGate from './components/CameraGate'
import PhotoCapture from './components/PhotoCapture'
import PinPlacement from './components/PinPlacement'
import HoleRenderer from './components/HoleRenderer'
import GolfGame from './components/GolfGame'
import HoleFeed from './components/HoleFeed'

// Screens: gate → capture → pin → render → play | feed
export default function App() {
  const [screen, setScreen] = useState('gate')
  const [photoDataUrl, setPhotoDataUrl] = useState(null)
  const [pin, setPin] = useState(null) // { x: 0-1, y: 0-1 } normalized
  const [holeImageUrl, setHoleImageUrl] = useState(null)

  if (screen === 'gate') {
    return <CameraGate onAllow={() => setScreen('capture')} />
  }

  if (screen === 'capture') {
    return (
      <PhotoCapture
        onCapture={(dataUrl) => {
          setPhotoDataUrl(dataUrl)
          setScreen('pin')
        }}
      />
    )
  }

  if (screen === 'pin') {
    return (
      <PinPlacement
        photoDataUrl={photoDataUrl}
        onConfirm={(pinCoords) => {
          setPin(pinCoords)
          setScreen('render')
        }}
        onRetake={() => setScreen('capture')}
      />
    )
  }

  if (screen === 'render') {
    return (
      <HoleRenderer
        photoDataUrl={photoDataUrl}
        pin={pin}
        onReady={(url) => {
          setHoleImageUrl(url)
          setScreen('play')
        }}
      />
    )
  }

  if (screen === 'play') {
    return (
      <GolfGame
        holeImageUrl={holeImageUrl}
        pin={pin}
        onFeed={() => setScreen('feed')}
        onNewHole={() => {
          setPhotoDataUrl(null)
          setPin(null)
          setHoleImageUrl(null)
          setScreen('capture')
        }}
      />
    )
  }

  if (screen === 'feed') {
    return (
      <HoleFeed
        currentHole={{ imageUrl: holeImageUrl, pin }}
        onBack={() => setScreen('play')}
        onNewHole={() => {
          setPhotoDataUrl(null)
          setPin(null)
          setHoleImageUrl(null)
          setScreen('capture')
        }}
      />
    )
  }

  return null
}
