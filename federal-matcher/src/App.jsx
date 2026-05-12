import { useState } from 'react'
import ProfilePage from './components/ProfilePage.jsx'
import ContractsPage from './components/ContractsPage.jsx'
import JobsPage from './components/JobsPage.jsx'
import RegistrationPage from './components/RegistrationPage.jsx'
import CapabilityStatementPage from './components/CapabilityStatement.jsx'

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  summary: 'Insurance professional with experience in risk, claims, and client management. Also coach teams and individuals. Building software tools and AI applications. Familiar with systems analysis, CRM platforms, and process improvement.',
  location: '',
  remote: 'both',
  skills: ['Insurance', 'Risk Assessment', 'Coaching / Training', 'Systems Analysis', 'Software Development', 'Program Management', 'Customer Success'],
  customSkills: '',
  naicsCodes: ['524210', '611430', '541511', '541990'],
  samApiKey: import.meta.env.VITE_SAM_API_KEY || '',
  usajobsApiKey: import.meta.env.VITE_USAJOBS_API_KEY || '',
}

const TABS = [
  { id: 'contracts', label: '📋 Contracts', title: 'SAM.gov Contracts' },
  { id: 'jobs', label: '💼 Jobs', title: 'USAJobs' },
  { id: 'capability', label: '📄 Cap Statement', title: 'Capability Statement' },
  { id: 'register', label: '✅ Registration', title: 'Checklist' },
  { id: 'profile', label: '👤 Profile', title: 'My Profile' },
]

export default function App() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [tab, setTab] = useState('contracts')
  const [profileSaved, setProfileSaved] = useState(false)

  function handleSaveProfile(updated) {
    setProfile(updated)
    setProfileSaved(true)
    setTab('contracts')
    setTimeout(() => setProfileSaved(false), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '0.9rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <div style={{ background: 'var(--blue)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
            🏛
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>Federal Opportunity Matcher</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Find contracts &amp; jobs that match your skills</p>
          </div>
          {profileSaved && (
            <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--green)', fontWeight: 600 }}>
              ✓ Profile saved
            </span>
          )}
        </div>
      </header>

      {/* Nav tabs */}
      <nav style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container" style={{ display: 'flex', gap: '0' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: tab === t.id ? '3px solid var(--blue)' : '3px solid transparent',
                borderRadius: 0,
                padding: '0.75rem 1.1rem',
                fontSize: '0.88rem',
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? 'var(--blue)' : 'var(--gray-600)',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="container">
        {tab === 'profile' && <ProfilePage profile={profile} onSave={handleSaveProfile} />}
        {tab === 'contracts' && <ContractsPage profile={profile} />}
        {tab === 'jobs' && <JobsPage profile={profile} />}
        {tab === 'capability' && <CapabilityStatementPage profile={profile} />}
        {tab === 'register' && <RegistrationPage />}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '2rem' }}>
        Data from <a href="https://sam.gov" target="_blank" rel="noreferrer" style={{ color: 'var(--gray-400)' }}>SAM.gov</a> and <a href="https://usajobs.gov" target="_blank" rel="noreferrer" style={{ color: 'var(--gray-400)' }}>USAJobs.gov</a> — public data, free to use.
      </footer>
    </div>
  )
}
