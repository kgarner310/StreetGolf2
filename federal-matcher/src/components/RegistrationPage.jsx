import { useState } from 'react'

const SAM_STEPS = [
  {
    id: 'uei',
    title: 'Get a Unique Entity ID (UEI)',
    detail: 'The UEI is your permanent federal identifier — it replaced the old DUNS number. You get it by registering on SAM.gov. It\'s free and takes about 10 minutes to fill out, then 24–48 hours to process.',
    link: 'https://sam.gov/content/entity-registration',
    linkLabel: 'Start SAM.gov Registration',
    time: '10 min + 1-2 days processing',
  },
  {
    id: 'sam_reg',
    title: 'Complete Full SAM.gov Registration',
    detail: 'After getting your UEI, complete your entity registration. You\'ll need: EIN or SSN (sole proprietor), NAICS codes describing your work, banking info for direct deposit, and a point of contact. Registration must be renewed every year.',
    link: 'https://sam.gov/content/entity-registration',
    linkLabel: 'Complete Registration',
    time: '30–60 min',
  },
  {
    id: 'naics',
    title: 'Choose Your NAICS Codes',
    detail: 'NAICS codes define what kind of work you do. Pick the primary one that best fits your main service, plus secondaries. For insurance consulting: 524210. For training/coaching: 611430. For software/IT services: 541511, 541512, 541519.',
    link: 'https://www.census.gov/naics/',
    linkLabel: 'Browse NAICS Codes',
    time: '15 min',
  },
  {
    id: 'small_biz',
    title: 'Check Small Business Size Standards',
    detail: 'SBA has size standards for each NAICS code (usually by revenue or employees). If you qualify, many contracts are set aside exclusively for small businesses — this is a huge advantage. For most service NAICS codes the threshold is $8M–$20M annual revenue.',
    link: 'https://www.sba.gov/federal-contracting/contracting-guide/size-standards',
    linkLabel: 'Check Size Standards',
    time: '10 min',
  },
  {
    id: 'certifications',
    title: 'Consider Set-Aside Certifications (optional but powerful)',
    detail: 'Federal agencies are required to award a % of contracts to certified small businesses. Certifications worth considering: 8(a) Business Development (SBA), HUBZone, SDVOSB (service-disabled veteran), WOSB (woman-owned). Each opens exclusive contract pools.',
    link: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs',
    linkLabel: 'SBA Certification Programs',
    time: 'Varies by program',
  },
  {
    id: 'sam_api_key',
    title: 'Get SAM.gov API Key',
    detail: 'To use the contract search in this tool, you need a free API key from the GSA. Register your account on SAM.gov first, then request a System Account API key. You\'ll use the "Opportunities API" key.',
    link: 'https://open.gsa.gov/api/sam/',
    linkLabel: 'SAM.gov API Docs',
    time: '5 min (after SAM.gov account)',
  },
  {
    id: 'usajobs_key',
    title: 'Get USAJobs API Key',
    detail: 'USAJobs (federal employment) has a separate free API for searching job listings. Register with your email at developer.usajobs.gov and you\'ll receive a key by email within a few minutes.',
    link: 'https://developer.usajobs.gov/APIRequest/',
    linkLabel: 'Request USAJobs API Key',
    time: '2 min',
  },
  {
    id: 'sources_sought',
    title: 'Respond to Sources Sought Notices',
    detail: 'Before agencies publish a full solicitation, they often post a "Sources Sought" or "RFI" to gauge market interest. Responding (even as a small business) gets you on their radar, helps shape the requirements, and can lead to direct outreach. No registration required to respond.',
    link: 'https://sam.gov/search/?index=opp&keywords=sources+sought&sort=relevance&sfm%5Bstatus%5D%5Bis_active%5D=true',
    linkLabel: 'Browse Sources Sought on SAM.gov',
    time: 'Ongoing',
  },
]

const USAJOBS_STEPS = [
  {
    id: 'usajobs_acct',
    title: 'Create a USAJobs Account',
    detail: 'Go to usajobs.gov and create a free account with your email. This lets you save jobs, set up email alerts, and upload your resume for federal applications.',
    link: 'https://www.usajobs.gov/',
    linkLabel: 'Create USAJobs Account',
    time: '5 min',
  },
  {
    id: 'resume',
    title: 'Build a Federal-Style Resume',
    detail: 'Federal resumes are much longer and more detailed than private sector ones — typically 3–5 pages. They must include: hours per week for each job, supervisor contact info, exact dates (month/year), GS series/grade equivalents, and detailed duty descriptions. USAJobs has a built-in resume builder.',
    link: 'https://www.usajobs.gov/Help/how-to/account/profile/resume/',
    linkLabel: 'USAJobs Resume Builder',
    time: '2–4 hours',
  },
  {
    id: 'alerts',
    title: 'Set Up Saved Searches & Alerts',
    detail: 'Create saved searches in USAJobs for your keyword/location combos. You\'ll get email alerts when matching positions open — federal jobs often close fast (5–10 business days).',
    link: 'https://www.usajobs.gov/',
    linkLabel: 'Go to USAJobs',
    time: '10 min',
  },
]

function ChecklistItem({ step, checked, onToggle }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card" style={{ marginBottom: '0.6rem', borderLeft: checked ? '4px solid var(--green)' : '4px solid var(--gray-200)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          style={{ marginTop: '0.2rem', flexShrink: 0, accentColor: 'var(--green)', width: '18px', height: '18px' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3
              style={{ fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', textDecoration: checked ? 'line-through' : 'none', color: checked ? 'var(--gray-400)' : 'var(--gray-800)' }}
              onClick={() => setOpen(o => !o)}
            >
              {step.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>⏱ {step.time}</span>
              <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setOpen(o => !o)}>
                {open ? '▲' : '▼'}
              </button>
            </div>
          </div>
          {open && (
            <div style={{ marginTop: '0.6rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.55, marginBottom: '0.6rem' }}>
                {step.detail}
              </p>
              {step.link && (
                <a href={step.link} target="_blank" rel="noreferrer">
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                    {step.linkLabel} ↗
                  </button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RegistrationPage() {
  const [checked, setChecked] = useState({})

  function toggle(id) {
    setChecked(c => ({ ...c, [id]: !c[id] }))
  }

  const samDone = SAM_STEPS.filter(s => checked[s.id]).length
  const jobsDone = USAJOBS_STEPS.filter(s => checked[s.id]).length

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>Registration Checklist</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Check off each step as you complete it. Click any item to see details and direct links.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--blue)' }}>{samDone}/{SAM_STEPS.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>SAM.gov steps done</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--blue)' }}>{jobsDone}/{USAJOBS_STEPS.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>USAJobs steps done</div>
        </div>
      </div>

      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.8rem', marginTop: '1.2rem' }}>
        SAM.gov — Federal Contracting
      </h3>
      <div style={{ background: 'var(--amber-light)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.84rem', color: 'var(--amber)' }}>
        <strong>Note:</strong> You must register as an entity on SAM.gov before you can bid on federal contracts. The UEI is your first step.
      </div>
      {SAM_STEPS.map(s => (
        <ChecklistItem key={s.id} step={s} checked={!!checked[s.id]} onToggle={() => toggle(s.id)} />
      ))}

      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.8rem', marginTop: '1.8rem' }}>
        USAJobs — Federal Employment
      </h3>
      <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue)', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.84rem', color: 'var(--blue-dark)' }}>
        <strong>Note:</strong> Federal jobs don't require SAM.gov registration — just a USAJobs account and a strong federal-format resume.
      </div>
      {USAJOBS_STEPS.map(s => (
        <ChecklistItem key={s.id} step={s} checked={!!checked[s.id]} onToggle={() => toggle(s.id)} />
      ))}
    </div>
  )
}
