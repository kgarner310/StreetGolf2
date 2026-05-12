import { useState, useCallback } from 'react'
import { searchContracts } from '../api/sam.js'

const TYPE_LABELS = {
  k: 'Solicitation', o: 'Solicitation', p: 'Presolicitation',
  r: 'Sources Sought', s: 'Special Notice', g: 'Grant', i: 'Intent to Bundle',
  a: 'Award Notice', u: 'Justification',
}

function OpportunityCard({ opp }) {
  const [expanded, setExpanded] = useState(false)
  const deadline = opp.responseDeadline
    ? new Date(opp.responseDeadline).toLocaleDateString()
    : null
  const posted = opp.postedDate
    ? new Date(opp.postedDate).toLocaleDateString()
    : null

  return (
    <div className="card" style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.4rem' }}>
            {opp.type && (
              <span className="badge badge-blue">
                {TYPE_LABELS[opp.type?.toLowerCase()] || opp.type}
              </span>
            )}
            {opp.setAside && <span className="badge badge-green">{opp.setAside}</span>}
            {opp.naics && <span className="badge badge-amber">NAICS {opp.naics}</span>}
          </div>
          <h3 style={{ fontSize: '0.97rem', fontWeight: 600, marginBottom: '0.2rem', lineHeight: 1.35 }}>
            {opp.title}
          </h3>
          <p style={{ fontSize: '0.83rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>{opp.agency}</p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--gray-600)', flexWrap: 'wrap' }}>
            {posted && <span>Posted: {posted}</span>}
            {deadline && <span style={{ color: 'var(--red)', fontWeight: 600 }}>Due: {deadline}</span>}
            <span>📍 {opp.placeOfPerformance}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
          {opp.uiLink && (
            <a href={opp.uiLink} target="_blank" rel="noreferrer">
              <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                View on SAM.gov ↗
              </button>
            </a>
          )}
          {opp.description && (
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => setExpanded(e => !e)}>
              {expanded ? 'Less' : 'Details'}
            </button>
          )}
        </div>
      </div>
      {expanded && opp.description && (
        <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--gray-200)', fontSize: '0.85rem', color: 'var(--gray-600)', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: '200px', overflowY: 'auto' }}>
          {opp.description}
        </div>
      )}
    </div>
  )
}

export default function ContractsPage({ profile }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [keywords, setKeywords] = useState(() => {
    const custom = profile.customSkills ? profile.customSkills.split(',').map(s => s.trim()).filter(Boolean) : []
    return [...profile.skills, ...custom].join(', ')
  })
  const [naics, setNaics] = useState(profile.naicsCodes.join(', '))
  const [apiKey, setApiKey] = useState(profile.samApiKey || '')

  const search = useCallback(async () => {
    if (!apiKey) {
      setError('Enter your SAM.gov API key to search. See the Registration tab for how to get one.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const kwList = keywords.split(',').map(s => s.trim()).filter(Boolean)
      const naicsList = naics.split(',').map(s => s.trim()).filter(Boolean)
      const data = await searchContracts({ keywords: kwList, naicsCodes: naicsList, apiKey })
      setResults(data)
    } catch (e) {
      if (e.message === 'SAM_NO_KEY') {
        setError('No API key provided.')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [keywords, naics, apiKey])

  const noKey = !apiKey

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>Contract Opportunities</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Search SAM.gov for active federal contract solicitations matching your skills.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <div>
            <label>Keywords (comma-separated)</label>
            <input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="insurance, training, software, systems analysis..."
            />
          </div>
          <div>
            <label>NAICS Codes (comma-separated, optional)</label>
            <input
              value={naics}
              onChange={e => setNaics(e.target.value)}
              placeholder="524210, 541511..."
            />
          </div>
          <div>
            <label>SAM.gov API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Paste your API key here"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-primary" onClick={search} disabled={loading || noKey} style={{ minWidth: '120px' }}>
              {loading ? 'Searching…' : 'Search SAM.gov'}
            </button>
            {noKey && (
              <span style={{ fontSize: '0.82rem', color: 'var(--amber)' }}>
                ⚠ API key required — see the Registration tab.
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)', fontSize: '0.9rem' }}>Searching SAM.gov…</p>
        </div>
      )}

      {results !== null && !loading && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
            {results.length === 0 ? 'No active opportunities found. Try different keywords.' : `${results.length} opportunities found`}
          </p>
          {results.map(opp => <OpportunityCard key={opp.id} opp={opp} />)}
        </div>
      )}

      {results === null && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)', fontSize: '0.9rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <p>Enter your keywords and API key above, then hit Search.</p>
        </div>
      )}
    </div>
  )
}
