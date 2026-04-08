// Polls a Replicate prediction by ID — token stays server-side.
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors() }
  }

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not set' }),
    }
  }

  const id = event.queryStringParameters?.id
  if (!id) {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Missing id' }) }
  }

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${token}` },
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }
}
