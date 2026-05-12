import { supabase } from './supabase'

// Canonical service taxonomy mapping
const SERVICE_MAP = {
  knotless: 'braids.knotless',
  'knotless braids': 'braids.knotless',
  'box braids': 'braids.box',
  braids: 'braids',
  locs: 'locs',
  'loc retwist': 'locs.retwist',
  'starter locs': 'locs.starter',
  'silk press': 'natural.silk_press',
  'silk presses': 'natural.silk_press',
  'natural styles': 'natural',
  'twist out': 'natural.twist_out',
  balayage: 'color.balayage',
  color: 'color',
  'color correction': 'color.correction',
  highlights: 'color.highlights',
  'sew-in': 'extensions.sew_in',
  'sew-in weave': 'extensions.sew_in',
  'quick weave': 'extensions.quick_weave',
  weave: 'extensions',
  'wig install': 'extensions.wig',
  cut: 'cut',
  trim: 'cut',
  relaxer: 'relaxer',
  keratin: 'keratin',
  'crochet braids': 'braids.crochet',
  'faux locs': 'locs.faux',
}

function resolveService(raw) {
  const lower = raw.toLowerCase().trim()
  return SERVICE_MAP[lower] || lower
}

// Time-of-day based departure anchor auto-selection
export function computeAnchor(locations) {
  const h = new Date().getHours()
  const day = new Date().getDay()
  const isWeekend = day === 0 || day === 6
  if (isWeekend) return 'home'
  if (h >= 5 && h < 9) return 'home'
  if (h >= 9 && h < 16) return locations?.work ? 'work' : 'home'
  if (h >= 16 && h < 19) return locations?.school ? 'school' : (locations?.work ? 'work' : 'home')
  return 'home'
}

export async function runSearch({ service, when, date, deadline, anchor, locations, store }) {
  const serviceId = resolveService(service)
  const departureLocation = anchor === 'current'
    ? await getCurrentCoords()
    : locations[anchor]

  // Call Supabase Edge Function which handles:
  // 1. Geo-filtered stylist query
  // 2. Instagram analysis scoring
  // 3. Availability checking
  // 4. Composite ranking
  const { data, error } = await supabase.functions.invoke('find-stylists', {
    body: {
      serviceId,
      serviceRaw: service,
      hairTexture: store.hairTexture,
      budgetTier: store.budgetTier,
      constraints: store.constraints,
      when,
      date: date || null,
      deadline: deadline || null,
      departure: departureLocation,
      homeLocation: locations.home,
      workLocation: locations.work,
    }
  })

  if (error) throw new Error(error.message)
  return data.results
}

function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Current location' }),
      () => reject(new Error('Location access denied'))
    )
  })
}
