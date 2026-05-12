// USAJobs API
// Docs: https://developer.usajobs.gov/API-Reference/
// Free key required — register at developer.usajobs.gov

const BASE = 'https://data.usajobs.gov/api/search'

export async function searchJobs({ keywords, location, remote, apiKey, userEmail, limit = 20 }) {
  if (!apiKey || !userEmail) throw new Error('USAJOBS_NO_KEY')

  const params = new URLSearchParams({
    Keyword: keywords.join(' '),
    NumberOfResults: limit,
    ...(location ? { LocationName: location } : {}),
    ...(remote === 'yes' ? { RemoteIndicator: 'True' } : {}),
  })

  const res = await fetch(`${BASE}?${params}`, {
    headers: {
      'Authorization-Key': apiKey,
      'Host': 'data.usajobs.gov',
      'User-Agent': userEmail,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`USAJobs API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return (data.SearchResult?.SearchResultItems || []).map(normalizeJob)
}

function normalizeJob(item) {
  const mv = item.MatchedObjectDescriptor
  const pay = mv?.PositionRemuneration?.[0]
  return {
    id: mv?.PositionID,
    title: mv?.PositionTitle,
    agency: mv?.OrganizationName,
    department: mv?.DepartmentName,
    location: mv?.PositionLocationDisplay,
    openDate: mv?.PublicationStartDate,
    closeDate: mv?.ApplicationCloseDate,
    payMin: pay?.MinimumRange,
    payMax: pay?.MaximumRange,
    payInterval: pay?.RateIntervalCode,
    jobGrade: mv?.JobGrade?.[0]?.Code,
    positionSchedule: mv?.PositionSchedule?.[0]?.Name,
    positionType: mv?.PositionOfferingType?.[0]?.Name,
    applyUrl: mv?.ApplyURI?.[0],
    summary: mv?.UserArea?.Details?.JobSummary,
    qualifications: mv?.UserArea?.Details?.Requirements,
  }
}
