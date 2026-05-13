import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const body = await req.json()
  const {
    serviceId, serviceRaw, hairTexture, hairLength, budgetTier, constraints,
    when, date, deadline, departure, homeLocation, workLocation,
    userVibeAesthetics = [], userVibeTags = [], verifiedOnly = false,
  } = body

  if (!departure) return json({ error: 'departure location required' }, 400)

  try {
    const candidates = await findCandidates({ serviceId, hairTexture, budgetTier, departure })

    if (!candidates.length) return json({ results: [] })

    const scored = await Promise.all(
      candidates.map(s => scoreStylest(s, {
        serviceId, hairTexture, hairLength, departure,
        homeLocation, workLocation, deadline,
        userVibeAesthetics, userVibeTags,
      }))
    )

    const top = scored
      .filter(s => s.composite >= 0.3)
      .filter(s => !verifiedOnly || s._trustTier === 'verified')
      .sort((a, b) => b.composite - a.composite)
      .slice(0, 5)

    const results = top.map(formatCard)
    return json({ results })
  } catch (e) {
    console.error(e)
    return json({ error: e.message }, 500)
  }
})

async function findCandidates({ serviceId, hairTexture, budgetTier, departure }: any) {
  const serviceCategory = serviceId?.split('.')?.[0] ?? serviceId

  const { data, error } = await supabase.rpc('find_nearby_stylists', {
    lat: departure.lat,
    lng: departure.lng,
    radius_meters: 48280,
    service_filter: serviceCategory,
    texture_filter: hairTexture ?? null,
    budget_tier_filter: budgetTier ?? null,
    limit_count: 20
  })

  if (error) {
    const { data: fallback } = await supabase
      .from('stylists')
      .select('*')
      .eq('is_active', true)
      .contains('service_ids', [serviceCategory])
      .limit(20)
    return fallback ?? []
  }

  return data ?? []
}

async function scoreStylest(stylist: any, context: any) {
  const { serviceId, hairTexture, hairLength, departure, homeLocation, workLocation, deadline, userVibeAesthetics, userVibeTags } = context

  // Specialization: service 55% + texture 30% + length 15%
  const serviceScore = computeServiceMatch(stylist, serviceId)
  const textureScore = computeTextureMatch(stylist, hairTexture)
  const lengthScore = computeLengthMatch(stylist, hairLength)
  const specializationScore = serviceScore * 0.55 + textureScore * 0.30 + lengthScore * 0.15

  // Reputation (15%)
  const reputationScore = computeReputation(stylist)

  // Geography (20%)
  const geoResult = await computeGeography(stylist, departure, homeLocation, workLocation)

  // Availability (20%)
  const availScore = computeAvailability(stylist, deadline)

  // Vibe match (10%)
  const vibeScore = computeVibeScore(stylist, userVibeAesthetics, userVibeTags)

  // Portfolio / Instagram (5%)
  const portfolioScore = computePortfolio(stylist)

  const composite =
    specializationScore * 0.30 +
    reputationScore     * 0.15 +
    geoResult.score     * 0.20 +
    availScore          * 0.20 +
    vibeScore           * 0.10 +
    portfolioScore      * 0.05

  const trustTier = resolveTrustTier(stylist)

  return {
    ...stylist,
    _scores: { specializationScore, reputationScore, geoScore: geoResult.score, availScore, vibeScore, portfolioScore },
    _trustTier: trustTier,
    composite,
    travel_minutes: geoResult.travelMinutes,
    on_your_way: geoResult.onYourWay,
  }
}

function computeServiceMatch(stylist: any, serviceId: string) {
  if (!serviceId) return 0.5
  const ids: string[] = stylist.service_ids ?? []
  if (ids.includes(serviceId)) return 1.0
  const category = serviceId.split('.')[0]
  if (ids.some((id: string) => id === category || id.startsWith(category + '.'))) return 0.75
  if (ids.some((id: string) => id.split('.')[0] === category)) return 0.5
  return 0.2
}

function computeTextureMatch(stylist: any, hairTexture: string | null) {
  if (!hairTexture) return 0.5
  const textures: string[] = [
    ...(stylist.texture_categories ?? []),
    ...(stylist.instagram_detected_textures ?? []),
    ...(stylist.instagram_texture_tags ?? []),
  ]
  if (textures.includes(hairTexture)) return 1.0
  const adjacency: Record<string, string[]> = {
    '4c': ['coily', 'curly'],
    'coily': ['4c', 'curly'],
    'curly': ['coily', 'wavy'],
    'wavy': ['curly', 'straight'],
    'straight': ['wavy'],
  }
  if ((adjacency[hairTexture] ?? []).some(t => textures.includes(t))) return 0.7
  if (!textures.length) return 0.5
  return 0.2
}

function computeLengthMatch(stylist: any, hairLength: string | null) {
  if (!hairLength) return 0.5
  const lengths: string[] = stylist.length_categories ?? []
  if (!lengths.length) return 0.5 // unknown — don't penalize
  if (lengths.includes(hairLength)) return 1.0
  // Adjacent: medium bridges short↔long
  const adjacency: Record<string, string[]> = {
    short: ['medium'],
    medium: ['short', 'long'],
    long: ['medium', 'very_long'],
    very_long: ['long'],
  }
  if ((adjacency[hairLength] ?? []).some(l => lengths.includes(l))) return 0.65
  // short_cut_bias is a hard signal against long/very_long
  if (stylist.short_cut_bias && (hairLength === 'long' || hairLength === 'very_long')) return 0.1
  return 0.3
}

function computeVibeScore(stylist: any, userAesthetics: string[], userTags: string[]) {
  if (!userAesthetics.length && !userTags.length) return 0.5 // neutral — not a penalty
  const stylistAesthetics: string[] = stylist.vibe_aesthetics ?? []
  if (!stylistAesthetics.length) return 0.4 // slight penalty for no vibe data when user has taste
  const allUser = [...userAesthetics, ...userTags].map(s => s.toLowerCase())
  const allStylest = stylistAesthetics.map(s => s.toLowerCase())
  const overlap = allUser.filter(a => allStylest.some(b => b.includes(a) || a.includes(b))).length
  return Math.min(overlap / Math.max(allUser.length, 1), 1.0)
}

function computeReputation(stylist: any) {
  const ratings = [
    { val: stylist.google_rating, weight: 0.35, count: stylist.google_review_count ?? 0 },
    { val: stylist.styleseat_rating, weight: 0.30, count: 10 },
    { val: stylist.booksy_rating, weight: 0.20, count: 10 },
    { val: stylist.vagaro_rating, weight: 0.15, count: 10 },
  ].filter(r => r.val != null)

  if (!ratings.length) return 0.5

  let weighted = 0, totalWeight = 0
  for (const r of ratings) {
    weighted += (r.val / 5) * r.weight
    totalWeight += r.weight
  }
  const starScore = totalWeight > 0 ? weighted / totalWeight : 0.5
  const maxCount = Math.max(...ratings.map(r => r.count))
  const volumeScore = Math.min(Math.log10(maxCount + 1) / Math.log10(201), 1.0)
  const igSentiment = stylist.instagram_sentiment_score ?? 0.75
  const igRepeat = stylist.instagram_repeat_client_ratio ?? 0

  return starScore * 0.50 + volumeScore * 0.25 + igSentiment * 0.15 + Math.min(igRepeat * 2, 1) * 0.10
}

async function computeGeography(stylist: any, departure: any, homeLocation: any, workLocation: any) {
  let travelMinutes = stylist._straight_line_minutes ?? 30
  let onYourWay = false

  if (GOOGLE_MAPS_KEY && stylist.location) {
    try {
      const dest = extractCoords(stylist.location)
      travelMinutes = await getTravelMinutes(departure, dest)

      if (workLocation && homeLocation) {
        const directMinutes = await getTravelMinutes(workLocation, homeLocation)
        const viaMinutes =
          (await getTravelMinutes(workLocation, dest)) +
          (await getTravelMinutes(dest, homeLocation))
        onYourWay = viaMinutes <= directMinutes * 1.15
      }
    } catch { /* straight-line fallback */ }
  }

  const score =
    travelMinutes < 10 ? 1.0 :
    travelMinutes < 20 ? 0.85 :
    travelMinutes < 30 ? 0.65 :
    travelMinutes < 45 ? 0.40 : 0.15

  return { score, travelMinutes: Math.round(travelMinutes), onYourWay }
}

async function getTravelMinutes(origin: any, destination: any) {
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
      'X-Goog-FieldMask': 'routes.duration',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    })
  })
  const data = await res.json()
  const seconds = parseInt(data?.routes?.[0]?.duration ?? '1800s')
  return seconds / 60
}

function extractCoords(geography: any) {
  if (typeof geography === 'object' && geography.coordinates) {
    return { lng: geography.coordinates[0], lat: geography.coordinates[1] }
  }
  return { lat: 0, lng: 0 }
}

function computeAvailability(stylist: any, deadline: string | null) {
  const next = stylist.next_available_at
  if (!next) return 0.3

  const now = Date.now()
  const hoursAway = (new Date(next).getTime() - now) / 3600000

  if (deadline) {
    const service_duration = 120
    const slotEnd = new Date(next).getTime() + service_duration * 60000
    const deadlineMs = new Date(`${new Date().toDateString()} ${deadline}`).getTime()
    if (slotEnd > deadlineMs) return 0.1
  }

  return hoursAway < 24 ? 1.0 : hoursAway < 48 ? 0.85 : hoursAway < 72 ? 0.7 : 0.5
}

function computePortfolio(stylist: any) {
  let score = 0.3
  if (stylist.profile_image_url) score += 0.1
  if ((stylist.instagram_sample_photos ?? []).length > 0) score += 0.2
  const quality = stylist.instagram_portfolio_quality ?? 0
  score += quality * 0.3
  if (stylist.instagram_repeat_client_ratio > 0.3) score += 0.1
  return Math.min(score, 1.0)
}

function resolveTrustTier(stylist: any): 'verified' | 'mismatch' | 'self_reported' {
  const hasIg = stylist.instagram_handle && (
    (stylist.instagram_detected_services ?? []).length > 0 ||
    (stylist.instagram_detected_textures ?? []).length > 0
  )
  if (!hasIg) return 'self_reported'
  const claimsTextured = (stylist.texture_categories ?? []).some((t: string) => ['curly', 'coily', '4c'].includes(t))
  if (stylist.short_cut_bias && claimsTextured) return 'mismatch'
  return 'verified'
}

function formatCard(s: any) {
  const next = s.next_available_at ? new Date(s.next_available_at) : null
  const nextLabel = next
    ? next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null
  const nextShort = next
    ? (isToday(next) ? `Today ${next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : next.toLocaleDateString('en-US', { weekday: 'short' }))
    : null

  const igAnalysis = (s.instagram_detected_services?.length || s.instagram_sentiment_score)
    ? {
        detected_services: s.instagram_detected_services ?? [],
        confirmed_textures: s.instagram_detected_textures ?? [],
        length_specialties: s.length_categories ?? [],
        short_cut_bias: s.short_cut_bias ?? false,
        sentiment_score: s.instagram_sentiment_score ?? 0.75,
        repeat_client_ratio: s.instagram_repeat_client_ratio ?? 0,
        notable_comments: s.instagram_notable_comments ?? [],
        sample_photos: s.instagram_sample_photos ?? [],
        post_count: s.instagram_post_count ?? 0,
      }
    : null

  return {
    id: s.id,
    display_name: s.display_name,
    profile_image_url: s.profile_image_url,
    instagram_handle: s.instagram_handle,
    neighborhood: s.neighborhood,
    reputation_score: s.reputation_score,
    google_rating: s.google_rating,
    google_review_count: s.google_review_count,
    styleseat_rating: s.styleseat_rating,
    booksy_rating: s.booksy_rating,
    service_ids: s.service_ids,
    texture_categories: s.texture_categories,
    price_floor: s.price_floor,
    price_ceiling: s.price_ceiling,
    travel_minutes: s.travel_minutes,
    on_your_way: s.on_your_way,
    vibe_aesthetics: s.vibe_aesthetics ?? [],
    next_slot_label: nextLabel,
    next_slot_short: nextShort,
    booking_url: s.booking_url,
    instagram_analysis: igAnalysis,
    trust_tier: s._trustTier,
    _composite: s.composite,
  }
}

function isToday(date: Date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
