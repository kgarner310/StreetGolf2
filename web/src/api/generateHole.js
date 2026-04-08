const REPLICATE_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN

const MODEL_ENDPOINT = 'https://api.replicate.com/v1/models/stability-ai/stable-diffusion-img2img/predictions'

// Replicate has ~4MB request limit. iPhone photos are 3-5MB raw.
// Resize to 768px max dimension before encoding — keeps quality, stays small.
function resizeImage(dataUrl, maxDim = 768) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.src = dataUrl
  })
}

export async function generateHole(photoDataUrl, pin) {
  if (!REPLICATE_TOKEN) {
    throw new Error('Missing VITE_REPLICATE_API_TOKEN in .env')
  }

  // Resize before sending — prevents "Load failed" on large iPhone photos
  const resized = await resizeImage(photoDataUrl, 768)
  const base64 = resized.replace(/^data:image\/[a-z]+;base64,/, '')

  const pinPct = pin
    ? `The flag/pin is located at roughly ${Math.round(pin.x * 100)}% from the left and ${Math.round(pin.y * 100)}% from the top of the image.`
    : ''

  const prompt = [
    'Semi-realistic golf hole, photorealistic golf video game screenshot.',
    'Lush green fairway, manicured rough, sand bunkers, realistic grass textures.',
    'A single white golf flag stick with a red flag marks the hole.',
    pinPct,
    'The scene layout, proportions, and background elements closely match the original photograph.',
    'Bright natural lighting, high detail, Golf Clash meets real life.',
    'No text, no UI, no watermarks.',
  ].filter(Boolean).join(' ')

  let createRes
  try {
    createRes = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
      },
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
  } catch (networkErr) {
    throw new Error(`Network error calling Replicate: ${networkErr.message}. Check your API token and internet connection.`)
  }

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    throw new Error(err.detail || `Replicate API error ${createRes.status}`)
  }

  const prediction = await createRes.json()
  return pollPrediction(prediction.id)
}

async function pollPrediction(id, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    await delay(2000)
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
    })
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
