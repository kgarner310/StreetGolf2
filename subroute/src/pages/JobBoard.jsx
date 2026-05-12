import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useOpenJobs, claimJob } from '../hooks/useCoverageJobs'
import { CoverageJobCard } from '../components/jobs/CoverageJobCard'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { serviceLabel } from '../components/jobs/ServiceSelector'

export default function JobBoard() {
  const { profile, isVerified, hasActiveCOI } = useAuth()
  const { jobs, loading, refetch } = useOpenJobs(profile?.service_zip_codes ?? [])
  const [claiming, setClaiming] = useState(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClaim() {
    setSubmitting(true)
    await claimJob(claiming.id, profile.id, message)
    setSubmitting(false)
    setDone(true)
    setTimeout(() => { setClaiming(null); setDone(false); setMessage(''); refetch() }, 1500)
  }

  const canClaim = isVerified && hasActiveCOI

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Job Board</h1>
      <p className="text-sm text-slate-500 mb-6">Open coverage jobs in your service area. Sign a non-solicitation agreement to unlock full details.</p>

      {!canClaim && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6">
          {!isVerified ? 'Your account is pending verification — you can browse but not claim jobs yet.' : 'Upload a valid COI to start claiming jobs.'}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : jobs.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <p>No open jobs in your service ZIPs right now.</p>
          <p className="text-xs mt-2">Update your profile to expand your service area.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="relative">
              <CoverageJobCard job={job} />
              <div className="px-4 pb-4">
                <Button size="sm" disabled={!canClaim} onClick={() => { setClaiming(job); setMessage('') }}>
                  Claim this job
                </Button>
                <p className="text-xs text-slate-400 mt-1.5">Full address revealed only after signing non-solicitation agreement.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!claiming} onClose={() => setClaiming(null)} title="Claim coverage job">
        {claiming && !done && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p className="font-medium">{claiming.city}, {claiming.state} · {claiming.zip_code}</p>
              <p className="text-slate-500">{new Date(claiming.coverage_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <p className="text-slate-500">{(claiming.services ?? []).map(serviceLabel).join(', ')} · {claiming.property_count} stop{claiming.property_count !== 1 ? 's' : ''}</p>
              <p className="font-semibold text-slate-900 mt-2">${Number(claiming.pay_rate).toFixed(2)} pay rate</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Next step:</strong> If your claim is approved, you'll be asked to sign a non-solicitation agreement before receiving the property address, gate code, and client notes.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message to primary contractor (optional)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Your availability, equipment, experience with similar properties…" className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none" />
            </div>

            <Button loading={submitting} onClick={handleClaim} className="w-full">Send claim request</Button>
          </div>
        )}
        {done && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-slate-900">Claim sent!</p>
            <p className="text-sm text-slate-500 mt-1">The primary contractor will review and respond.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
