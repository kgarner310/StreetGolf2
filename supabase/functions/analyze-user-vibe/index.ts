import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Aesthetic categories used for matching user ↔ stylist
const AESTHETIC_CATEGORIES = [
  'Natural & Effortless', 'Bold & Glamorous', 'Soft & Romantic', 'Edgy & Fashion-Forward',
  'Classic & Polished', 'Bohemian & Free', 'Minimal & Clean', 'Colorful & Expressive',
  'Afrocentric & Cultural', 'Urban & Trendy',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { handle, mode = 'user' } = await req.json()
  // mode: 'user' = analyze the woman's own IG for vibe
  //       'stylist' = analyze a stylist's IG for aesthetic fit

  if (!handle) return json({ error: 'handle required' }, 400)
  if (!OPENAI_KEY) return json({ error: 'OPENAI_API_KEY not configured' }, 500)

  try {
    const posts = await scrapeRecentPosts(handle)
    if (!posts.length) return json({ handle, vibe: null, reason: 'no_posts' })

    const vibe = mode === 'user'
      ? await analyzeUserVibe(handle, posts)
      : await analyzeStylistAesthetic(handle, posts)

    return json({ handle, vibe })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})

async function scrapeRecentPosts(handle: string) {
  // Try Instagram public endpoints
  for (const fetchFn of [fetchViaPublicApi, fetchViaGraphql]) {
    const posts = await fetchFn(handle)
    if (posts.length > 0) return posts
  }
  return []
}

async function fetchViaPublicApi(handle: string) {
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', 'X-IG-App-ID': '936619743392459', 'Accept': 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges ?? []
    return edges.slice(0, 9).map((e: any) => ({
      imageUrl: e.node.thumbnail_src || e.node.display_url,
      caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '',
      likeCount: e.node.edge_liked_by?.count ?? 0,
    }))
  } catch { return [] }
}

async function fetchViaGraphql(handle: string) {
  try {
    const res = await fetch(`https://www.instagram.com/${handle}/?__a=1&__d=dis`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', 'Accept': 'application/json' }
    })
    if (!res.ok) return []
    const data = await res.json()
    const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges ?? []
    return edges.slice(0, 9).map((e: any) => ({
      imageUrl: e.node.thumbnail_src || e.node.display_url,
      caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '',
      likeCount: e.node.edge_liked_by?.count ?? 0,
    }))
  } catch { return [] }
}

async function analyzeUserVibe(handle: string, posts: any[]) {
  const imageUrls = posts.map(p => p.imageUrl).filter(Boolean)
  const captions = posts.map(p => p.caption).filter(Boolean).join('\n')

  const prompt = `You are analyzing someone's Instagram feed (@${handle}) to understand their personal style and aesthetic — NOT as a stylist, but as a client/woman with a personal aesthetic.

Look at these photos from their feed and determine:
1. What is their overall aesthetic/vibe? (pick the best matches from: ${AESTHETIC_CATEGORIES.join(', ')})
2. What color palette do they gravitate toward? (e.g. earth tones, jewel tones, neutrals, pastels, bold/bright, monochrome)
3. What hair aesthetics do they seem to love? (e.g. natural texture, sleek styles, protective styles, colorful hair, long flowing hair, short cuts, locs, etc.)
4. What is their style personality in 3-5 short tags? (e.g. "effortless chic", "natural beauty", "bold statements")
5. How confident are you in this read? (0.0–1.0)

Respond ONLY with valid JSON:
{
  "aesthetics": ["string"],
  "palette": ["string"],
  "hair_loves": ["string"],
  "vibe_tags": ["string"],
  "confidence": 0.0-1.0,
  "summary": "one sentence description of her style"
}`

  return await callVisionAPI(prompt, imageUrls, captions)
}

async function analyzeStylistAesthetic(handle: string, posts: any[]) {
  const imageUrls = posts.map(p => p.imageUrl).filter(Boolean)
  const captions = posts.map(p => p.caption).filter(Boolean).join('\n')

  const prompt = `You are analyzing a hairstylist's Instagram portfolio (@${handle}) to understand their artistic aesthetic and the visual vibe of their work — separate from technical skills.

Look at these portfolio photos and determine:
1. What is the overall aesthetic of their work? (pick best matches from: ${AESTHETIC_CATEGORIES.join(', ')})
2. What color palette dominates their photography and client looks? (e.g. warm tones, cool tones, high contrast, earthy, vibrant, soft)
3. What type of client do they seem to attract aesthetically?
4. What are 3-5 vibe tags for their brand? (e.g. "editorial luxury", "natural goddess", "everyday glam")
5. How polished/cohesive is their visual brand? (0.0–1.0)

Respond ONLY with valid JSON:
{
  "aesthetics": ["string"],
  "palette": ["string"],
  "client_vibe": "string",
  "vibe_tags": ["string"],
  "brand_cohesion": 0.0-1.0,
  "summary": "one sentence description of their aesthetic"
}`

  return await callVisionAPI(prompt, imageUrls, captions)
}

async function callVisionAPI(prompt: string, imageUrls: string[], captions: string) {
  const content: any[] = [
    { type: 'text', text: prompt },
    ...imageUrls.slice(0, 6).map(url => ({ type: 'image_url', image_url: { url, detail: 'low' } })),
  ]

  if (captions) {
    content.push({ type: 'text', text: `\n\nCAPTIONS FROM POSTS:\n${captions.slice(0, 1500)}` })
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content }],
      max_tokens: 500,
    })
  })

  const data = await res.json()
  try {
    return JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
  } catch {
    return null
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
