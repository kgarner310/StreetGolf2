import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMyPostedJobs, useOpenJobs } from '../hooks/useCoverageJobs'
import { CoverageJobCard } from '../components/jobs/CoverageJobCard'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export default function Dashboard() {
  const { profile, isVerified, hasActiveCOI } = useAuth()
  const { jobs: myJobs, loading: myLoading } = useMyPostedJobs(profile?.id)
  const { jobs: openJobs, loading: openLoading } = useOpenJobs(profile?.service_zip_codes ?? [])
  const navigate = useNavigate()

  const activeMyJobs = myJobs.filter((j) => !['completed', 'cancelled'].includes(j.status))
  const availableJobs = openJobs.filter((j) => j.primary_id !== profile?.id || !j.primary_id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile?.business_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge label={isVerified ? 'Verified' : 'Pending verification'} color={isVerified ? 'completed' : 'pending'} />
            {profile?.reliability_score && <span className="text-sm text-slate-500">⭐ {Number(profile.reliability_score).toFixed(1)}</span>}
          </div>
        </div>
        <Button onClick={() => navigate('/post')} disabled={!isVerified}>+ Post coverage needed</Button>
      </div>

      {!hasActiveCOI && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Your insurance certificate is missing or expired. <Link to="/profile" className="underline font-medium">Update your COI</Link> to post or claim jobs.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* My coverage needs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">My Coverage Jobs ({activeMyJobs.length})</h2>
            <Link to="/post" className="text-xs text-slate-500 hover:text-slate-700">+ New</Link>
          </div>
          {myLoading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : activeMyJobs.length === 0 ? (
            <Card className="p-6 text-center text-slate-400 text-sm">
              <p className="mb-3">No active coverage posts.</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/post')} disabled={!isVerified}>Post coverage needed</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeMyJobs.map((j) => <CoverageJobCard key={j.id} job={j} linkTo={`/jobs/${j.id}`} showClaims />)}
            </div>
          )}
        </section>

        {/* Open jobs to fill */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Open in My Area ({availableJobs.length})</h2>
            <Link to="/board" className="text-xs text-slate-500 hover:text-slate-700">View all</Link>
          </div>
          {openLoading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : availableJobs.length === 0 ? (
            <Card className="p-6 text-center text-slate-400 text-sm">No open jobs in your service area right now.</Card>
          ) : (
            <div className="space-y-3">
              {availableJobs.slice(0, 4).map((j) => <CoverageJobCard key={j.id} job={j} linkTo={`/jobs/${j.id}`} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
