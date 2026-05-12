import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { handle } = await req.json()
  if (!handle) return json({ error: 'handle required' }, 400)

  try {
    const posts = await scrapeInstagramPosts(handle)
    if (!posts.length) return json({ handle, posts: [], analysis: null })

    const analysis = await analyzeWithVision(handle, posts)
    return json({ handle, posts: posts.length, analysis })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})

// Fetch recent posts from public Instagram profile
async function scrapeInstagramPosts(handle: string) {
  // Instagram's public JSON endpoint (no auth required for public profiles)
  const url = `https://www.instagram.com/${handle}/?__a=1&__d=dis`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'application/json',
    }
  })

  if (!res.ok) {
    // Fallback: try the graphql endpoint format
    return await scrapeViaGraphql(handle)
  }

  try {
    const data = await res.json()
    const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges ?? []
    return edges.slice(0, 12).map((e: any) => ({
      id: e.node.id,
      imageUrl: e.node.display_url,
      thumbnailUrl: e.node.thumbnail_src,
      caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '',
      likeCount: e.node.edge_liked_by?.count ?? 0,
      commentCount: e.node.edge_media_to_comment?.count ?? 0,
      comments: e.node.edge_media_preview_comment?.edges?.map((c: any) => c.node.text) ?? [],
    }))
  } catch {
    return await scrapeViaGraphql(handle)
  }
}

async function scrapeViaGraphql(handle: string) {
  // Try the newer Instagram API format
  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        'X-IG-App-ID': '936619743392459',
        'Accept': 'application/json',
      }
    }
  )

  if (!res.ok) return []

  try {
    const data = await res.json()
    const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges ?? []
    return edges.slice(0, 12).map((e: any) => ({
      id: e.node.id,
      imageUrl: e.node.display_url,
      thumbnailUrl: e.node.thumbnail_src,
      caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '',
      likeCount: e.node.edge_liked_by?.count ?? 0,
      commentCount: e.node.edge_media_to_comment?.count ?? 0,
      comments: e.node.edge_media_preview_comment?.edges?.map((c: any) => c.node.text) ?? [],
    }))
  } catch {
    return []
  }
}

async function analyzeWithVision(handle: string, posts: any[]) {
  const allCaptions = posts.map(p => p.caption).filter(Boolean).join('\n')
  const allComments = posts.flatMap(p => p.comments).filter(Boolean)
  const imageUrls = posts.map(p => p.thumbnailUrl || p.imageUrl).filter(Boolean).slice(0, 6)

  // Vision analysis prompt — classify each photo for service type and hair texture
  const visionMessages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are analyzing the Instagram portfolio of a hairstylist (@${handle}).

Look at these portfolio images and identify:
1. Hair services shown (e.g. knotless braids, silk press, color, locs, weave, cut, etc.)
2. Hair textures visible in client photos (straight, wavy, curly, coily, 4C)
3. Whether each photo shows actual client work (vs selfie/promo/product)

Respond ONLY with valid JSON matching this schema exactly:
{
  "detected_services": ["string"],
  "confirmed_textures": ["string"],
  "has_before_after": boolean,
  "portfolio_quality_score": 0.0-1.0
}`
        },
        ...imageUrls.map(url => ({
          type: 'image_url',
          image_url: { url, detail: 'low' }
        }))
      ]
    }
  ]

  const visionRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: visionMessages, max_tokens: 400 })
  })
  const visionData = await visionRes.json()
  let visionResult: any = {}
  try {
    visionResult = JSON.parse(visionData.choices?.[0]?.message?.content ?? '{}')
  } catch { /* use empty */ }

  // NLP analysis of captions + comments
  const nlpMessages = [
    {
      role: 'user',
      content: `Analyze these Instagram captions and comments from a hairstylist's page.

CAPTIONS:
${allCaptions.slice(0, 2000)}

COMMENTS (sample):
${allComments.slice(0, 40).join('\n').slice(0, 2000)}

Respond ONLY with valid JSON:
{
  "texture_tags": ["string"],
  "sentiment_score": 0.0-1.0,
  "repeat_client_signals": ["username"],
  "notable_positive_comments": ["string"],
  "service_keywords": ["string"]
}`
    }
  ]

  const nlpRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: nlpMessages, max_tokens: 500 })
  })
  const nlpData = await nlpRes.json()
  let nlpResult: any = {}
  try {
    nlpResult = JSON.parse(nlpData.choices?.[0]?.message?.content ?? '{}')
  } catch { /* use empty */ }

  // Compute repeat client ratio
  const uniqueCommenters = new Set(allComments.map(c => c?.split(':')[0]?.trim()).filter(Boolean))
  const repeatRatio = uniqueCommenters.size > 0
    ? (nlpResult.repeat_client_signals?.length ?? 0) / uniqueCommenters.size
    : 0

  return {
    detected_services: [
      ...new Set([...(visionResult.detected_services ?? []), ...(nlpResult.service_keywords ?? [])])
    ],
    confirmed_textures: visionResult.confirmed_textures ?? [],
    texture_tags: nlpResult.texture_tags ?? [],
    sentiment_score: nlpResult.sentiment_score ?? 0.75,
    repeat_client_ratio: Math.min(repeatRatio, 1),
    notable_comments: (nlpResult.notable_positive_comments ?? []).slice(0, 3),
    has_before_after: visionResult.has_before_after ?? false,
    portfolio_quality_score: visionResult.portfolio_quality_score ?? 0.5,
    sample_photos: imageUrls.slice(0, 3),
    post_count: posts.length,
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
