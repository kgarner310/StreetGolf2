// Geocode an address string → { lat, lng } using OpenStreetMap Nominatim (free, no key)
export async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ChicPick-app/1.0' }
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

// Reverse geocode coords → neighborhood label
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { headers: { 'User-Agent': 'ChicPick-app/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  const addr = data.address
  return addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.city || null
}
