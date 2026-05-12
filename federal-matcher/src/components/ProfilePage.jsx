import { useState } from 'react'

const SKILL_TAGS = [
  'Insurance', 'Risk Assessment', 'Claims Processing', 'Underwriting',
  'Coaching / Training', 'Program Management', 'Project Management',
  'Systems Analysis', 'Software Development', 'Web Development',
  'AI / Machine Learning', 'Data Analysis', 'CRM Systems',
  'Process Improvement', 'Customer Success', 'Team Leadership',
  'Technical Writing', 'Business Analysis', 'Contract Management',
  'Compliance', 'Budget Management', 'Stakeholder Communication',
]

const NAICS_SUGGESTIONS = [
  { code: '524210', label: 'Insurance Agencies and Brokerages' },
  { code: '524292', label: 'Third Party Administration of Insurance Funds' },
  { code: '611430', label: 'Professional and Management Development Training' },
  { code: '611699', label: 'All Other Miscellaneous Schools and Instruction' },
  { code: '541511', label: 'Custom Computer Programming Services' },
  { code: '541512', label: 'Computer Systems Design Services' },
  { code: '541519', label: 'Other Computer Related Services' },
  { code: '541611', label: 'Management Consulting Services' },
  { code: '541612', label: 'HR Management Consulting Services' },
  { code: '541990', label: 'All Other Professional / Scientific Services' },
]

export default function ProfilePage({ profile, onSave }) {
  const [form, setForm] = useState(profile)

  function toggleSkill(skill) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill],
    }))
  }

  function toggleNaics(code) {
    setForm(f => ({
      ...f,
      naicsCodes: f.naicsCodes.includes(code)
        ? f.naicsCodes.filter(c => c !== code)
        : [...f.naicsCodes, code],
    }))
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>Your Profile</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Tell us about your background. We'll use this to find matching federal contracts and jobs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Background Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <label>Your name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="First Last"
              />
            </div>
            <div>
              <label>Email (used for USAJobs API calls)</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label>Summary — describe what you do in your own words</label>
              <textarea
                rows={4}
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="e.g. Insurance professional with 10+ years in claims and risk, now building software tools and AI apps. Also coach teams and individuals on performance and process..."
              />
            </div>
            <div>
              <label>Primary location (city, state or ZIP)</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Austin, TX or 78701"
              />
            </div>
            <div>
              <label>Open to remote work?</label>
              <select
                value={form.remote}
                onChange={e => setForm(f => ({ ...f, remote: e.target.value }))}
              >
                <option value="yes">Yes — remote only or hybrid</option>
                <option value="no">No — on-site preferred</option>
                <option value="both">Either is fine</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Skills &amp; Expertise</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: '0.8rem' }}>
            Select all that apply — these become your search keywords.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
            {SKILL_TAGS.map(skill => (
              <button
                key={skill}
                className={`tag${form.skills.includes(skill) ? ' selected' : ''}`}
                onClick={() => toggleSkill(skill)}
                type="button"
              >
                {form.skills.includes(skill) ? '✓ ' : ''}
                {skill}
              </button>
            ))}
          </div>
          <div>
            <label>Add custom skills (comma-separated)</label>
            <input
              value={form.customSkills}
              onChange={e => setForm(f => ({ ...f, customSkills: e.target.value }))}
              placeholder="e.g. Salesforce, grant writing, GIS..."
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '0.3rem' }}>NAICS Codes</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: '0.8rem' }}>
            Select the industry codes that describe your work — SAM.gov uses these to categorize contracts.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {NAICS_SUGGESTIONS.map(({ code, label }) => (
              <label key={code} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400, color: 'var(--gray-800)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={form.naicsCodes.includes(code)}
                  onChange={() => toggleNaics(code)}
                />
                <span><strong>{code}</strong> — {label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '0.8rem' }}>API Keys</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <label>SAM.gov API Key</label>
              <input
                type="password"
                value={form.samApiKey}
                onChange={e => setForm(f => ({ ...f, samApiKey: e.target.value }))}
                placeholder="Get free key at open.gsa.gov/apis/sam/"
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                Free key — register at <a href="https://sam.gov/content/entity-registration" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>sam.gov</a> then request an API key at open.gsa.gov
              </p>
            </div>
            <div>
              <label>USAJobs API Key</label>
              <input
                type="password"
                value={form.usajobsApiKey}
                onChange={e => setForm(f => ({ ...f, usajobsApiKey: e.target.value }))}
                placeholder="Get free key at developer.usajobs.gov"
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                Free key — register at <a href="https://developer.usajobs.gov/APIRequest/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>developer.usajobs.gov</a>
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" style={{ fontSize: '1rem', padding: '0.7rem 2rem' }} onClick={() => onSave(form)}>
            Save &amp; Find Opportunities →
          </button>
        </div>
      </div>
    </div>
  )
}
