import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCustomerJobs } from '../../hooks/useJobs'
import { JobCard } from '../../components/jobs/JobCard'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function CustomerDashboard() {
  const { profile } = useAuth()
  const { jobs, loading, refetch } = useCustomerJobs(profile?.id)

  useEffect(() => { refetch() }, [profile?.id])

  const active = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status))
  const past = jobs.filter((j) => ['completed', 'cancelled'].includes(j.status))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500">Hi, {profile?.full_name?.split(' ')[0]}</p>
        </div>
        <Link to="/customer/post-job"><Button>+ Post a job</Button></Link>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active ({active.length})</h2>
            {active.length === 0 ? (
              <Card className="p-8 text-center text-gray-400">
                <p className="mb-4">No active jobs.</p>
                <Link to="/customer/post-job"><Button variant="secondary">Post your first job</Button></Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {active.map((j) => <JobCard key={j.id} job={j} linkTo={`/jobs/${j.id}`} />)}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past ({past.length})</h2>
              <div className="space-y-3">
                {past.map((j) => <JobCard key={j.id} job={j} linkTo={`/jobs/${j.id}`} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
