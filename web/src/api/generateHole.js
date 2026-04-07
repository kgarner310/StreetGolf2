/**
 * Sends a photo to Replicate's img2img API and returns the URL of the
 * AI-generated semi-realistic golf hole image.
 *
 * Requires VITE_REPLICATE_API_TOKEN in .env
 *
 * Model: black-forest-labs/flux-fill-pro (img2img inpainting)
 * Fallback: stability-ai/stable-diffusion-img2img
 */

const REPLICATE_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN

// Stable Diffusion img2img — reliable, widely available
const MODEL_VERSION = 'stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4af4b51344a2eb5040d32faaf073cc07c7c'

export async function generateHole(photoDataUrl, pin) {
  if (!REPLICATE_TOKEN) {
    throw new Error('Missing VITE_REPLICATE_API_TOKEN in .env')
  }

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

  // Convert dataUrl to base64 string (Replicate wants raw base64 or URL)
  const base64 = photoDataUrl.replace(/^data:image\/[a-z]+;base64,/, '')

  // Create prediction
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: {
        prompt,
        image: `data:image/jpeg;base64,${base64}`,
        prompt_strength: 0.6,  // Keep scene structure, add golf
        num_inference_steps: 30,
        guidance_scale: 7.5,
        negative_prompt: 'blurry, cartoon, flat, 2d, painting, ugly, text, watermark',
      },
    }),
  })

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
