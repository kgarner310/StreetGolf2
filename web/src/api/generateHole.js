// Routes through /.netlify/functions/replicate-proxy to avoid CORS
// and keep the API token server-side (not in the JS bundle).
const PROXY = '/.netlify/functions/replicate-proxy'
const POLL  = '/.netlify/functions/replicate-poll'

function resizeImage(dataUrl, maxDim = 768) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.src = dataUrl
  })
}

export async function generateHole(photoDataUrl, pin) {
  const resized = await resizeImage(photoDataUrl, 768)
  const base64  = resized.replace(/^data:image\/[a-z]+;base64,/, '')

  const pinPct = pin
    ? `Flag/pin at roughly ${Math.round(pin.x * 100)}% from left, ${Math.round(pin.y * 100)}% from top.`
    : ''

  const prompt = [
    'Semi-realistic golf hole, photorealistic golf video game screenshot.',
    'Lush green fairway, manicured rough, sand bunkers, realistic grass textures.',
    'White golf flag stick with red flag marks the hole.',
    pinPct,
    'Scene layout and proportions match the original photograph.',
    'Bright natural lighting, high detail. No text, no UI, no watermarks.',
  ].filter(Boolean).join(' ')

  let res
  try {
    res = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          prompt,
          image: `data:image/jpeg;base64,${base64}`,
          prompt_strength: 0.6,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          negative_prompt: 'blurry, cartoon, flat, 2d, painting, ugly, text, watermark',
        },
      }),
    })
  } catch (err) {
    throw new Error(`Proxy unreachable: ${err.message}. Is the Netlify function deployed?`)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.detail || `Proxy error ${res.status}`)
  }

  const prediction = await res.json()
  return pollPrediction(prediction.id)
}

async function pollPrediction(id, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    await delay(2000)
    const res  = await fetch(`${POLL}?id=${id}`)
    const data = await res.json()

    if (data.status === 'succeeded') {
      const output = data.output
      return Array.isArray(output) ? output[0] : output
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Generation ${data.status}: ${data.error || ''}`)
    }
  }
  throw new Error('Timed out waiting for image generation')
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
