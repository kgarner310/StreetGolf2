import { useState, useRef } from 'react'

const CERT_OPTIONS = [
  'Small Business',
  'SBA 8(a)',
  'HUBZone',
  'SDVOSB (Service-Disabled Veteran)',
  'VOSB (Veteran-Owned)',
  'WOSB (Woman-Owned)',
  'EDWOSB (Economically Disadvantaged Woman-Owned)',
  'MBE (Minority Business Enterprise)',
]

function EditableList({ label, items, onChange, placeholder }) {
  function update(i, val) {
    const next = [...items]
    next[i] = val
    onChange(next)
  }
  function add() { onChange([...items, '']) }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)) }

  return (
    <div>
      <label>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.3rem' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              value={item}
              onChange={e => update(i, e.target.value)}
              placeholder={placeholder}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.85rem', color: 'var(--gray-600)', cursor: 'pointer', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.82rem', padding: '0.35rem 0.8rem' }} onClick={add}>
          + Add
        </button>
      </div>
    </div>
  )
}

function PastPerfItem({ item, onChange, onRemove }) {
  return (
    <div className="card" style={{ marginBottom: '0.5rem', background: 'var(--gray-50)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <strong style={{ fontSize: '0.85rem' }}>Project / Engagement</strong>
        <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--gray-400)' }}>✕ Remove</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <input value={item.client} onChange={e => onChange({ ...item, client: e.target.value })} placeholder="Client / Organization (can be private sector)" />
        <input value={item.title} onChange={e => onChange({ ...item, title: e.target.value })} placeholder="Project title or role" />
        <textarea rows={2} value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} placeholder="What you did, the outcome, scale (e.g. 'Designed claims processing workflow reducing cycle time by 30%')..." />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input value={item.year} onChange={e => onChange({ ...item, year: e.target.value })} placeholder="Year(s)" style={{ maxWidth: '100px' }} />
          <input value={item.value} onChange={e => onChange({ ...item, value: e.target.value })} placeholder="Contract / project value (optional)" style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  )
}

function StatementPreview({ cs }) {
  const skills = cs.coreCompetencies.filter(Boolean)
  const diffs = cs.differentiators.filter(Boolean)
  const perfs = cs.pastPerformance.filter(p => p.title || p.description)
  const certs = cs.certifications

  return (
    <div id="cap-statement-preview" style={{
      fontFamily: 'Georgia, serif',
      fontSize: '10.5pt',
      color: '#111',
      maxWidth: '7.5in',
      margin: '0 auto',
      background: '#fff',
      padding: '0.4in 0.5in',
      boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
      borderRadius: '6px',
      lineHeight: 1.45,
    }}>
      {/* Header stripe */}
      <div style={{ background: '#1a3a6b', color: '#fff', margin: '-0.4in -0.5in 0.3in', padding: '0.25in 0.5in 0.2in' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '18pt', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.08in' }}>
              {cs.businessName || cs.contactName || 'Your Name / Business'}
            </div>
            <div style={{ fontSize: '9pt', opacity: 0.85 }}>
              {cs.tagline || 'Federal Contracting Capability Statement'}
            </div>
          </div>
          <div style={{ fontSize: '8.5pt', textAlign: 'right', opacity: 0.9, lineHeight: 1.7 }}>
            {cs.contactName && <div>{cs.contactName}</div>}
            {cs.email && <div>{cs.email}</div>}
            {cs.phone && <div>{cs.phone}</div>}
            {cs.website && <div>{cs.website}</div>}
            {cs.location && <div>{cs.location}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25in' }}>
        {/* Left column */}
        <div>
          {/* Core Competencies */}
          <Section title="Core Competencies">
            {skills.length > 0
              ? <ul style={{ margin: 0, paddingLeft: '1.1em' }}>
                  {skills.map((s, i) => <li key={i} style={{ marginBottom: '0.05in' }}>{s}</li>)}
                </ul>
              : <p style={{ color: '#888', fontStyle: 'italic' }}>Add your core competencies in the form.</p>
            }
          </Section>

          {/* Differentiators */}
          {diffs.length > 0 && (
            <Section title="Differentiators">
              <ul style={{ margin: 0, paddingLeft: '1.1em' }}>
                {diffs.map((d, i) => <li key={i} style={{ marginBottom: '0.05in' }}>{d}</li>)}
              </ul>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Past Performance */}
          <Section title="Past Performance">
            {perfs.length > 0
              ? perfs.map((p, i) => (
                  <div key={i} style={{ marginBottom: '0.12in' }}>
                    <div style={{ fontWeight: 700, fontSize: '9.5pt' }}>{p.title || p.client}</div>
                    {p.client && p.title && <div style={{ fontSize: '8.5pt', color: '#444', marginBottom: '0.02in' }}>{p.client}{p.year ? ` · ${p.year}` : ''}{p.value ? ` · ${p.value}` : ''}</div>}
                    {p.description && <div style={{ fontSize: '9pt' }}>{p.description}</div>}
                  </div>
                ))
              : <p style={{ color: '#888', fontStyle: 'italic' }}>Add past performance examples in the form.</p>
            }
          </Section>

          {/* Company Data */}
          <Section title="Company Data">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <tbody>
                {[
                  ['Entity Type', cs.entityType || 'Sole Proprietor'],
                  ['UEI', cs.uei || '—'],
                  ['CAGE Code', cs.cageCode || '—'],
                  ['EIN / TIN', cs.ein ? `••••${cs.ein.slice(-4)}` : '—'],
                  ['NAICS Codes', cs.naicsCodes || '—'],
                  ['Founded', cs.founded || '—'],
                  ['Location', cs.location || '—'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontWeight: 600, paddingRight: '0.1in', paddingBottom: '0.03in', whiteSpace: 'nowrap', color: '#333', verticalAlign: 'top' }}>{k}:</td>
                    <td style={{ paddingBottom: '0.03in', color: '#111' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Certifications */}
          {certs.length > 0 && (
            <Section title="Certifications &amp; Set-Asides">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.05in 0.1in' }}>
                {certs.map(c => (
                  <span key={c} style={{ background: '#e8f0fe', color: '#1a3a6b', borderRadius: '3px', padding: '0.02in 0.08in', fontSize: '8.5pt', fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px solid #1a3a6b', marginTop: '0.2in', paddingTop: '0.08in', fontSize: '8pt', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
        <span>SAM.gov Registered · Active</span>
        <span>Capability Statement · {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '0.18in' }}>
      <div style={{ background: '#1a3a6b', color: '#fff', padding: '0.03in 0.1in', fontSize: '9pt', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: '2px', marginBottom: '0.08in' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function CapabilityStatementPage({ profile }) {
  const allSkills = [
    ...profile.skills,
    ...(profile.customSkills ? profile.customSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
  ]

  const naicsDisplay = profile.naicsCodes.join(', ')

  const [cs, setCs] = useState({
    businessName: '',
    contactName: profile.name || '',
    email: profile.email || '',
    phone: '',
    website: '',
    location: profile.location || '',
    tagline: 'Serving Federal Agencies with Expertise in Insurance, Training & Technology',
    entityType: 'Sole Proprietor',
    uei: '',
    cageCode: '',
    ein: '',
    founded: '',
    naicsCodes: naicsDisplay,
    certifications: ['Small Business'],
    coreCompetencies: allSkills.length > 0 ? allSkills : [''],
    differentiators: [
      'Cross-industry experience spanning insurance, coaching, and software development',
      'Rapid deployment — sole proprietor means no overhead, fast turnaround',
      'Proven track record building technology tools and process improvements',
    ],
    pastPerformance: [
      { client: '', title: '', description: '', year: '', value: '' },
    ],
  })

  const [view, setView] = useState('form') // 'form' | 'preview'

  function updateCs(key, val) { setCs(c => ({ ...c, [key]: val })) }

  function toggleCert(cert) {
    setCs(c => ({
      ...c,
      certifications: c.certifications.includes(cert)
        ? c.certifications.filter(x => x !== cert)
        : [...c.certifications, cert],
    }))
  }

  function updatePerf(i, val) {
    setCs(c => {
      const next = [...c.pastPerformance]
      next[i] = val
      return { ...c, pastPerformance: next }
    })
  }

  function addPerf() {
    setCs(c => ({ ...c, pastPerformance: [...c.pastPerformance, { client: '', title: '', description: '', year: '', value: '' }] }))
  }

  function removePerf(i) {
    setCs(c => ({ ...c, pastPerformance: c.pastPerformance.filter((_, idx) => idx !== i) }))
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>Capability Statement</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
        A one-page document you send to contracting officers to introduce yourself. Fill in the form, then preview and print to PDF.
      </p>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.4rem' }}>
        <button className={view === 'form' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('form')}>
          ✏️ Edit
        </button>
        <button className={view === 'preview' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('preview')}>
          👁 Preview
        </button>
        {view === 'preview' && (
          <button className="btn-secondary" onClick={() => window.print()} style={{ marginLeft: 'auto' }}>
            🖨 Print / Save PDF
          </button>
        )}
      </div>

      {view === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.8rem' }}>Identity &amp; Contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label>Business name (or your name)</label>
                  <input value={cs.businessName} onChange={e => updateCs('businessName', e.target.value)} placeholder="e.g. Smith Consulting LLC or John Smith" />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label>Your name (point of contact)</label>
                  <input value={cs.contactName} onChange={e => updateCs('contactName', e.target.value)} placeholder="First Last" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label>Email</label>
                  <input type="email" value={cs.email} onChange={e => updateCs('email', e.target.value)} placeholder="you@example.com" />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label>Phone</label>
                  <input value={cs.phone} onChange={e => updateCs('phone', e.target.value)} placeholder="(555) 555-5555" />
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label>Website (optional)</label>
                  <input value={cs.website} onChange={e => updateCs('website', e.target.value)} placeholder="yoursite.com" />
                </div>
              </div>
              <div>
                <label>Tagline (appears under your name)</label>
                <input value={cs.tagline} onChange={e => updateCs('tagline', e.target.value)} placeholder="e.g. Serving Federal Agencies with Expertise in..." />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.8rem' }}>Company Data</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label>Entity type</label>
                  <select value={cs.entityType} onChange={e => updateCs('entityType', e.target.value)}>
                    <option>Sole Proprietor</option>
                    <option>LLC</option>
                    <option>S-Corp</option>
                    <option>C-Corp</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label>Year founded</label>
                  <input value={cs.founded} onChange={e => updateCs('founded', e.target.value)} placeholder="e.g. 2021" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label>UEI (from SAM.gov)</label>
                  <input value={cs.uei} onChange={e => updateCs('uei', e.target.value)} placeholder="18-char alphanumeric" />
                </div>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <label>CAGE Code (after SAM.gov)</label>
                  <input value={cs.cageCode} onChange={e => updateCs('cageCode', e.target.value)} placeholder="5-char code" />
                </div>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <label>EIN / SSN last 4</label>
                  <input value={cs.ein} onChange={e => updateCs('ein', e.target.value)} placeholder="Last 4 digits only" maxLength={4} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>Shown as ••••XXXX on statement</p>
                </div>
              </div>
              <div>
                <label>NAICS Codes</label>
                <input value={cs.naicsCodes} onChange={e => updateCs('naicsCodes', e.target.value)} placeholder="524210, 541511, 611430..." />
              </div>
              <div>
                <label>Location</label>
                <input value={cs.location} onChange={e => updateCs('location', e.target.value)} placeholder="City, ST" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Certifications &amp; Set-Asides</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: '0.7rem' }}>Select all that apply or that you plan to pursue.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {CERT_OPTIONS.map(cert => (
                <button
                  key={cert}
                  type="button"
                  className={`tag${cs.certifications.includes(cert) ? ' selected' : ''}`}
                  onClick={() => toggleCert(cert)}
                >
                  {cs.certifications.includes(cert) ? '✓ ' : ''}{cert}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <EditableList
              label="Core Competencies (your key services/skills)"
              items={cs.coreCompetencies}
              onChange={val => updateCs('coreCompetencies', val)}
              placeholder="e.g. Insurance program management"
            />
          </div>

          <div className="card">
            <EditableList
              label="Differentiators (what sets you apart)"
              items={cs.differentiators}
              onChange={val => updateCs('differentiators', val)}
              placeholder="e.g. Agile delivery with direct owner access"
            />
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Past Performance</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: '0.7rem' }}>
              Include private-sector work — federal agencies accept it, especially for new contractors. Focus on outcomes and scale.
            </p>
            {cs.pastPerformance.map((p, i) => (
              <PastPerfItem key={i} item={p} onChange={val => updatePerf(i, val)} onRemove={() => removePerf(i)} />
            ))}
            <button type="button" className="btn-secondary" onClick={addPerf} style={{ fontSize: '0.85rem' }}>
              + Add Project
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" style={{ fontSize: '1rem', padding: '0.7rem 2rem' }} onClick={() => setView('preview')}>
              Preview Statement →
            </button>
          </div>
        </div>
      )}

      {view === 'preview' && (
        <div>
          <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue)', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--blue-dark)' }}>
            <strong>Tip:</strong> Click "Print / Save PDF" → change destination to "Save as PDF" → set paper to Letter, margins to Minimum.
            The preview below is what will print.
          </div>
          <StatementPreview cs={cs} />
        </div>
      )}
    </div>
  )
}
