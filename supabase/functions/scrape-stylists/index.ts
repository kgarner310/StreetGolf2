import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API') ?? Deno.env.get('GOOGLE_MAPS_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hair-specific keywords to search Google Places with
const SEARCH_QUERIES = [
  'natural hair salon',
  'braiding salon',
  'black hair salon',
  'loc specialist',
  'hair extensions salon',
  'silk press salon',
  'hair colorist salon',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (!GOOGLE_MAPS_KEY) return json({ error: 'GOOGLE_MAPS_KEY not configured' }, 500)

  const { cities = ['Atlanta, GA'] } = await req.json().catch(() => ({}))

  let totalUpserted = 0

  for (const city of cities) {
    for (const query of SEARCH_QUERIES) {
      const places = await searchPlaces(`${query} ${city}`)
      for (const place of places) {
        const detail = await getPlaceDetail(place.place_id)
        if (!detail) continue
        const stylist = normalizePlaceToStylist(detail, city)
        const { error } = await supabase
          .from('stylists')
          .upsert(stylist, { onConflict: 'google_place_id', ignoreDuplicates: false })
        if (!error) totalUpserted++
      }
      // Respect Google rate limits
      await delay(200)
    }
  }

  return json({ upserted: totalUpserted })
})

async function searchPlaces(query: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=hair_care&key=${GOOGLE_MAPS_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.results ?? []
}

async function getPlaceDetail(placeId: string) {
  const fields = 'place_id,name,formatted_address,geometry,rating,user_ratings_total,website,formatted_phone_number,opening_hours,photos,vicinity,address_components'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.result ?? null
}

function normalizePlaceToStylist(place: any, cityHint: string) {
  const lat = place.geometry?.location?.lat
  const lng = place.geometry?.location?.lng
  const name = place.name ?? ''
  const rating = place.rating ?? null
  const reviewCount = place.user_ratings_total ?? 0

  // Infer services from place name and vicinity
  const nameAndVicinity = (name + ' ' + (place.vicinity ?? '')).toLowerCase()
  const serviceIds = inferServices(nameAndVicinity)
  const textures = inferTextures(nameAndVicinity)

  // Try to extract Instagram handle from website
  const website = place.website ?? ''
  const igHandle = extractInstagramHandle(website)

  // Infer booking URL: prefer website, fallback to Google Maps
  const bookingUrl = website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`

  // Infer price tier from place price_level (1-4)
  const priceTier = place.price_level
    ? (place.price_level <= 1 ? 'under75' : place.price_level <= 2 ? '75to150' : '150plus')
    : null

  // Extract city/neighborhood from address components
  const components: any[] = place.address_components ?? []
  const neighborhood = components.find(c => c.types.includes('neighborhood'))?.long_name
    || components.find(c => c.types.includes('sublocality'))?.long_name
    || components.find(c => c.types.includes('locality'))?.long_name
    || cityHint.split(',')[0]

  const city = components.find(c => c.types.includes('locality'))?.long_name
    || cityHint.split(',')[0]
  const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name
    || cityHint.split(', ')[1]

  return {
    id: `google_${place.place_id}`,
    display_name: name,
    google_place_id: place.place_id,
    google_rating: rating,
    google_review_count: reviewCount,
    reputation_score: rating,
    neighborhood,
    city,
    state,
    location: lat && lng ? `SRID=4326;POINT(${lng} ${lat})` : null,
    service_ids: serviceIds,
    texture_categories: textures,
    price_tier: priceTier,
    booking_url: bookingUrl,
    platform_urls: website ? { website } : {},
    instagram_handle: igHandle,
    is_active: true,
    updated_at: new Date().toISOString(),
  }
}

function inferServices(text: string): string[] {
  const map: Record<string, string> = {
    braid: 'braids', loc: 'locs', natural: 'natural', silk: 'natural.silk_press',
    press: 'natural.silk_press', color: 'color', highlight: 'color',
    extension: 'extensions', weave: 'extensions', sew: 'extensions',
    wig: 'extensions.wig', cut: 'cut', trim: 'cut', relaxer: 'relaxer', keratin: 'keratin',
  }
  const found = new Set<string>()
  for (const [keyword, serviceId] of Object.entries(map)) {
    if (text.includes(keyword)) found.add(serviceId)
  }
  if (!found.size) found.add('cut') // default
  return [...found]
}

function inferTextures(text: string): string[] {
  const textures: string[] = []
  if (text.match(/natural|coil|kinky|4c|afro|loc/)) textures.push('coily', '4c')
  if (text.match(/curly|curl/)) textures.push('curly')
  if (text.match(/braid/)) { textures.push('coily'); textures.push('4c') }
  if (!textures.length) textures.push('straight', 'wavy', 'curly', 'coily', '4c')
  return [...new Set(textures)]
}

function extractInstagramHandle(website: string): string | null {
  const match = website.match(/instagram\.com\/([a-zA-Z0-9_.]+)/)
  return match ? match[1] : null
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
