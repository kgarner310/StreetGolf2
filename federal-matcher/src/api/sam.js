// SAM.gov Opportunities API (v2)
// Docs: https://open.gsa.gov/api/sam/
// Free API key required — register at SAM.gov

const BASE = 'https://api.sam.gov/opportunities/v2/search'

export async function searchContracts({ keywords, naicsCodes, apiKey, limit = 20 }) {
  if (!apiKey) throw new Error('SAM_NO_KEY')

  const params = new URLSearchParams({
    api_key: apiKey,
    limit,
    keyword: keywords.join(' '),
    ptype: 'k,o,p,r,s,g,i,a,u', // all opportunity types
    active: 'true',
    ...(naicsCodes.length > 0 ? { naicsCode: naicsCodes.join(',') } : {}),
  })

  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SAM API ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return (data.opportunitiesData || []).map(normalizeOpportunity)
}

function normalizeOpportunity(o) {
  return {
    id: o.noticeId || o.id,
    title: o.title,
    agency: o.organizationHierarchy?.[0]?.name || o.fullParentPathName || 'Unknown Agency',
    type: o.type || o.baseType,
    naics: o.naicsCode,
    postedDate: o.postedDate,
    responseDeadline: o.responseDeadLine,
    description: o.description,
    uiLink: o.uiLink,
    placeOfPerformance: o.placeOfPerformance?.city?.name
      ? `${o.placeOfPerformance.city.name}, ${o.placeOfPerformance.state?.code || ''}`
      : 'See listing',
    setAside: o.typeOfSetAsidesDescription || null,
  }
}
