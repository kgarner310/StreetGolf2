// Netlify serverless function — proxies Replicate API calls.
// Token stays server-side, CORS issue resolved.
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: cors(),
    }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not set in Netlify env vars' }),
    }
  }

  try {
    const body = JSON.parse(event.body)
    const { path, ...payload } = body
    const url = path || 'https://api.replicate.com/v1/models/stability-ai/stable-diffusion-img2img/predictions'

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    return {
      statusCode: res.status,
      headers: cors(),
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message }),
    }
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}
