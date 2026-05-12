import { useState, useCallback } from 'react'
import { searchJobs } from '../api/usajobs.js'

function JobCard({ job }) {
  const [expanded, setExpanded] = useState(false)
  const openDate = job.openDate ? new Date(job.openDate).toLocaleDateString() : null
  const closeDate = job.closeDate ? new Date(job.closeDate).toLocaleDateString() : null

  const pay = job.payMin && job.payMax
    ? `$${Number(job.payMin).toLocaleString()} – $${Number(job.payMax).toLocaleString()} / ${job.payInterval || 'yr'}`
    : null

  return (
    <div className="card" style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.4rem' }}>
            {job.positionType && <span className="badge badge-blue">{job.positionType}</span>}
            {job.positionSchedule && <span className="badge badge-green">{job.positionSchedule}</span>}
            {job.jobGrade && <span className="badge badge-amber">GS-{job.jobGrade}</span>}
          </div>
          <h3 style={{ fontSize: '0.97rem', fontWeight: 600, marginBottom: '0.2rem', lineHeight: 1.35 }}>
            {job.title}
          </h3>
          <p style={{ fontSize: '0.83rem', color: 'var(--gray-600)', marginBottom: '0.2rem' }}>
            {job.agency}{job.department && job.department !== job.agency ? ` — ${job.department}` : ''}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--gray-600)', flexWrap: 'wrap' }}>
            {job.location && <span>📍 {job.location}</span>}
            {pay && <span style={{ color: 'var(--green)', fontWeight: 600 }}>{pay}</span>}
            {openDate && <span>Open: {openDate}</span>}
            {closeDate && <span style={{ color: 'var(--red)', fontWeight: 600 }}>Closes: {closeDate}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
          {job.applyUrl && (
            <a href={job.applyUrl} target="_blank" rel="noreferrer">
              <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                Apply ↗
              </button>
            </a>
          )}
          {(job.summary || job.qualifications) && (
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => setExpanded(e => !e)}>
              {expanded ? 'Less' : 'Details'}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--gray-200)', fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
          {job.summary && (
            <div style={{ marginBottom: '0.6rem' }}>
              <strong style={{ color: 'var(--gray-800)' }}>Summary</strong>
              <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>{job.summary}</p>
            </div>
          )}
          {job.qualifications && (
            <div>
              <strong style={{ color: 'var(--gray-800)' }}>Requirements</strong>
              <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>{job.qualifications}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function JobsPage({ profile }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const allSkills = [
    ...profile.skills,
    ...(profile.customSkills ? profile.customSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
  ]
  const [keywords, setKeywords] = useState(allSkills.join(', '))
  const [location, setLocation] = useState(profile.location || '')
  const [remote, setRemote] = useState(profile.remote || 'both')
  const [apiKey, setApiKey] = useState(profile.usajobsApiKey || '')
  const [email, setEmail] = useState(profile.email || '')

  const search = useCallback(async () => {
    if (!apiKey || !email) {
      setError('USAJobs requires both an API key and your email address. See the Registration tab.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const kwList = keywords.split(',').map(s => s.trim()).filter(Boolean)
      const data = await searchJobs({ keywords: kwList, location, remote, apiKey, userEmail: email })
      setResults(data)
    } catch (e) {
      if (e.message === 'USAJOBS_NO_KEY') {
        setError('API key and email are required.')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [keywords, location, remote, apiKey, email])

  const canSearch = apiKey && email

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>Federal Job Listings</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Search USAJobs for open federal positions that match your background.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <div>
            <label>Keywords (comma-separated)</label>
            <input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="insurance specialist, program analyst, IT specialist..."
            />
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label>Location</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="City, ST or ZIP"
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Remote preference</label>
              <select value={remote} onChange={e => setRemote(e.target.value)}>
                <option value="yes">Remote only</option>
                <option value="no">On-site</option>
                <option value="both">Any</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label>USAJobs API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="From developer.usajobs.gov"
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label>Your email (required by USAJobs API)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-primary" onClick={search} disabled={loading || !canSearch} style={{ minWidth: '120px' }}>
              {loading ? 'Searching…' : 'Search USAJobs'}
            </button>
            {!canSearch && (
              <span style={{ fontSize: '0.82rem', color: 'var(--amber)' }}>
                ⚠ API key + email required — see the Registration tab.
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
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)', fontSize: '0.9rem' }}>Searching USAJobs…</p>
        </div>
      )}

      {results !== null && !loading && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
            {results.length === 0
              ? 'No open positions found. Try broader keywords or remove location.'
              : `${results.length} positions found`}
          </p>
          {results.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {results === null && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)', fontSize: '0.9rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💼</div>
          <p>Fill in your API key and keywords above, then search.</p>
        </div>
      )}
    </div>
  )
}
