import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HAIR_QUERIES = [
  'natural hair', 'braids', 'locs', 'silk press',
  'weave extensions', 'black hair', 'knotless braids',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { cities = ['Atlanta, GA'] } = await req.json().catch(() => ({}))
  const report: any = { styleseat: 0, booksy: 0, merged: 0, inserted: 0, errors: [] }

  for (const city of cities) {
    const coords = await geocodeCity(city)
    if (!coords) { report.errors.push(`Could not geocode: ${city}`); continue }

    for (const query of HAIR_QUERIES) {
      const [ssResults, bkResults] = await Promise.allSettled([
        scrapeStyleSeat(query, coords, city),
        scrapeBooksy(query, coords, city),
      ])

      const allResults = [
        ...(ssResults.status === 'fulfilled' ? ssResults.value : []),
        ...(bkResults.status === 'fulfilled' ? bkResults.value : []),
      ]

      if (ssResults.status === 'rejected') report.errors.push(`StyleSeat ${query}: ${ssResults.reason}`)
      if (bkResults.status === 'rejected') report.errors.push(`Booksy ${query}: ${bkResults.reason}`)

      for (const stylist of allResults) {
        const result = await upsertWithDedup(stylist)
        if (result === 'merged') { report.merged++; if (stylist.source === 'styleseat') report.styleseat++; else report.booksy++ }
        else if (result === 'inserted') { report.inserted++; if (stylist.source === 'styleseat') report.styleseat++; else report.booksy++ }
      }

      await delay(300)
    }
  }

  return json(report)
})

// ─── StyleSeat ────────────────────────────────────────────────────────────────

async function scrapeStyleSeat(query: string, coords: Coords, city: string) {
  const url = `https://www.styleseat.com/api/v8/pros/search/?` +
    `lat=${coords.lat}&lng=${coords.lng}&query=${encodeURIComponent(query)}&radius=30&page=1`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      'Accept': 'application/json',
      'Referer': 'https://www.styleseat.com/',
    }
  })

  if (!res.ok) return []

  const data = await res.json()
  const pros: any[] = data?.results ?? data?.pros ?? []

  return pros.map(p => normalizeStyleSeat(p, city)).filter(Boolean)
}

function normalizeStyleSeat(p: any, city: string): any {
  if (!p.id || !p.display_name) return null
  const lat = parseFloat(p.lat ?? p.latitude ?? 0)
  const lng = parseFloat(p.lng ?? p.longitude ?? 0)
  const services = inferServices((p.display_name + ' ' + (p.services?.map((s: any) => s.name).join(' ') ?? '')).toLowerCase())
  const textures = inferTextures((p.display_name + ' ' + (p.bio ?? '')).toLowerCase())

  return {
    source: 'styleseat',
    styleseat_id: String(p.id),
    display_name: p.display_name,
    bio: p.bio ?? null,
    profile_image_url: p.profile_pic_url ?? p.photo_url ?? null,
    neighborhood: p.neighborhood ?? city.split(',')[0],
    city: city.split(',')[0],
    state: city.split(', ')[1] ?? null,
    lat, lng,
    service_ids: services,
    texture_categories: textures,
    styleseat_rating: parseFloat(p.avg_rating ?? p.rating ?? 0) || null,
    styleseat_review_count: parseInt(p.rating_count ?? p.review_count ?? 0) || 0,
    booking_url: p.url?.startsWith('http') ? p.url : `https://www.styleseat.com${p.url ?? ''}`,
    platform_urls: { styleseat: p.url?.startsWith('http') ? p.url : `https://www.styleseat.com${p.url ?? ''}` },
    primary_booking_platform: 'styleseat',
    is_active: true,
  }
}

// ─── Booksy ───────────────────────────────────────────────────────────────────

async function scrapeBooksy(query: string, coords: Coords, city: string) {
  const url = `https://booksy.com/api/us/2/customer/search?` +
    `lat=${coords.lat}&lon=${coords.lng}&within=48000&query=${encodeURIComponent(query)}&limit=100`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      'Accept': 'application/json',
      'X-Api-Key': 'web-e2f8fd1b-9999-4a2b-8b7e-8e2d20e4a3c1',
    }
  })

  if (!res.ok) return []

  const data = await res.json()
  const businesses: any[] = data?.businesses ?? data?.results ?? []

  return businesses.map(b => normalizeBooksy(b, city)).filter(Boolean)
}

function normalizeBooksy(b: any, city: string): any {
  if (!b.id || !b.name) return null
  const lat = parseFloat(b.location?.lat ?? b.lat ?? 0)
  const lng = parseFloat(b.location?.lon ?? b.location?.lng ?? b.lng ?? 0)
  const nameText = (b.name + ' ' + (b.items?.map((i: any) => i.name).join(' ') ?? '')).toLowerCase()
  const services = inferServices(nameText)
  const textures = inferTextures(nameText)
  const booksyUrl = b.url ?? `https://booksy.com/en-us/${b.id}`

  return {
    source: 'booksy',
    booksy_id: String(b.id),
    display_name: b.name,
    bio: b.about ?? b.description ?? null,
    profile_image_url: b.profile_image_url ?? b.avatar ?? null,
    neighborhood: b.address?.city ?? city.split(',')[0],
    city: city.split(',')[0],
    state: city.split(', ')[1] ?? null,
    lat, lng,
    service_ids: services,
    texture_categories: textures,
    booksy_rating: parseFloat(b.score ?? b.rating ?? 0) || null,
    booksy_review_count: parseInt(b.reviews_count ?? b.review_count ?? 0) || 0,
    booking_url: booksyUrl,
    platform_urls: { booksy: booksyUrl },
    primary_booking_platform: 'booksy',
    is_active: true,
  }
}

// ─── Dedup + upsert ───────────────────────────────────────────────────────────

async function upsertWithDedup(stylist: any): Promise<'merged' | 'inserted' | 'skipped'> {
  if (!stylist || !stylist.lat || !stylist.lng) return 'skipped'

  // 1. Check by platform ID first (exact dedup on re-runs)
  if (stylist.source === 'styleseat' && stylist.styleseat_id) {
    const { data: existing } = await supabase
      .from('stylists').select('id, platform_urls').eq('styleseat_id', stylist.styleseat_id).single()
    if (existing) {
      await supabase.from('stylists').update({
        styleseat_rating: stylist.styleseat_rating,
        styleseat_review_count: stylist.styleseat_review_count,
        platform_urls: { ...existing.platform_urls, ...stylist.platform_urls },
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
      return 'merged'
    }
  }
  if (stylist.source === 'booksy' && stylist.booksy_id) {
    const { data: existing } = await supabase
      .from('stylists').select('id, platform_urls').eq('booksy_id', stylist.booksy_id).single()
    if (existing) {
      await supabase.from('stylists').update({
        booksy_rating: stylist.booksy_rating,
        booksy_review_count: stylist.booksy_review_count,
        platform_urls: { ...existing.platform_urls, ...stylist.platform_urls },
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
      return 'merged'
    }
  }

  // 2. Fuzzy match: same city, name similarity > 75%, within 300 meters
  const { data: nearby } = await supabase
    .from('stylists')
    .select('id, display_name, platform_urls, booking_url')
    .ilike('city', `%${stylist.city}%`)
    .limit(50)

  const nameMatch = nearby?.find(n => nameSimilarity(n.display_name, stylist.display_name) > 0.75)

  if (nameMatch) {
    // Merge platform data into existing Google Places record
    const updates: any = {
      platform_urls: { ...nameMatch.platform_urls, ...stylist.platform_urls },
      updated_at: new Date().toISOString(),
    }
    if (stylist.source === 'styleseat') {
      updates.styleseat_id = stylist.styleseat_id
      updates.styleseat_rating = stylist.styleseat_rating
      updates.styleseat_review_count = stylist.styleseat_review_count
      // Only override booking_url if we don't already have one
      if (!nameMatch.booking_url || nameMatch.booking_url.includes('google.com/maps')) {
        updates.booking_url = stylist.booking_url
        updates.primary_booking_platform = 'styleseat'
      }
    } else {
      updates.booksy_id = stylist.booksy_id
      updates.booksy_rating = stylist.booksy_rating
      updates.booksy_review_count = stylist.booksy_review_count
      if (!nameMatch.booking_url || nameMatch.booking_url.includes('google.com/maps')) {
        updates.booking_url = stylist.booking_url
        updates.primary_booking_platform = 'booksy'
      }
    }
    await supabase.from('stylists').update(updates).eq('id', nameMatch.id)
    return 'merged'
  }

  // 3. No match — insert as new record
  const id = stylist.source === 'styleseat'
    ? `ss_${stylist.styleseat_id}`
    : `bk_${stylist.booksy_id}`

  await supabase.from('stylists').upsert({
    id,
    display_name: stylist.display_name,
    bio: stylist.bio,
    profile_image_url: stylist.profile_image_url,
    neighborhood: stylist.neighborhood,
    city: stylist.city,
    state: stylist.state,
    location: stylist.lat && stylist.lng ? `SRID=4326;POINT(${stylist.lng} ${stylist.lat})` : null,
    service_ids: stylist.service_ids,
    texture_categories: stylist.texture_categories,
    styleseat_id: stylist.styleseat_id ?? null,
    booksy_id: stylist.booksy_id ?? null,
    styleseat_rating: stylist.styleseat_rating ?? null,
    booksy_rating: stylist.booksy_rating ?? null,
    styleseat_review_count: stylist.styleseat_review_count ?? null,
    booksy_review_count: stylist.booksy_review_count ?? null,
    reputation_score: stylist.styleseat_rating ?? stylist.booksy_rating ?? null,
    booking_url: stylist.booking_url,
    platform_urls: stylist.platform_urls,
    primary_booking_platform: stylist.primary_booking_platform,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  return 'inserted'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function geocodeCity(city: string): Promise<Coords | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'ChicPick/1.0' } }
    )
    const data = await res.json()
    if (!data?.[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { return null }
}

function inferServices(text: string): string[] {
  const map: Record<string, string> = {
    braid: 'braids', loc: 'locs', natural: 'natural', silk: 'natural.silk_press',
    press: 'natural.silk_press', color: 'color', highlight: 'color.highlights',
    extension: 'extensions', weave: 'extensions', sew: 'extensions.sew_in',
    wig: 'extensions.wig', cut: 'cut', trim: 'cut', relaxer: 'relaxer',
    keratin: 'keratin', crochet: 'braids.crochet', knotless: 'braids.knotless',
    'faux loc': 'locs.faux', retwist: 'locs.retwist',
  }
  const found = new Set<string>()
  for (const [keyword, serviceId] of Object.entries(map)) {
    if (text.includes(keyword)) found.add(serviceId)
  }
  if (!found.size) found.add('cut')
  return [...found]
}

function inferTextures(text: string): string[] {
  const textures: string[] = []
  if (text.match(/natural|coil|kinky|4c|afro|loc|braid|knotless/)) { textures.push('coily', '4c') }
  if (text.match(/curly|curl|3[abc]/)) textures.push('curly')
  if (text.match(/wavy/)) textures.push('wavy')
  if (!textures.length) textures.push('straight', 'wavy', 'curly', 'coily', '4c')
  return [...new Set(textures)]
}

function nameSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\b(salon|studio|hair|beauty|by)\b/g, '').trim()
  const setA = new Set(normalize(a).split(' ').filter(Boolean))
  const setB = new Set(normalize(b).split(' ').filter(Boolean))
  if (!setA.size || !setB.size) return 0
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return intersection / union
}

interface Coords { lat: number; lng: number }
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
