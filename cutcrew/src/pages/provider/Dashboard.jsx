import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCustomerJobs } from '../../hooks/useJobs'
import { supabase } from '../../lib/supabase'
import { useState } from 'react'
import { JobCard } from '../../components/jobs/JobCard'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function ProviderDashboard() {
  const { profile } = useAuth()
  const providerId = profile?.provider_profiles?.id ?? profile?.id
  const [jobs, setJobs] = useState([])
  const [earnings, setEarnings] = useState({ total: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!providerId) return
    async function load() {
      setLoading(true)
      const { data: bidData } = await supabase
        .from('bids')
        .select('job_id, status, amount, jobs(*, properties(*))')
        .eq('provider_id', providerId)
        .in('status', ['accepted', 'pending'])
        .order('created_at', { ascending: false })

      setJobs(bidData?.map((b) => ({ ...b.jobs, bid_status: b.status, bid_amount: b.amount })) ?? [])

      const { data: payData } = await supabase
        .from('payments')
        .select('provider_payout, status, contracts!inner(provider_id)')
        .eq('contracts.provider_id', providerId)

      const released = payData?.filter((p) => p.status === 'released').reduce((s, p) => s + Number(p.provider_payout), 0) ?? 0
      const pending = payData?.filter((p) => p.status === 'escrowed').reduce((s, p) => s + Number(p.provider_payout), 0) ?? 0
      setEarnings({ total: released, pending })
      setLoading(false)
    }
    load()
  }, [providerId])

  const active = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status))
  const past = jobs.filter((j) => ['completed', 'cancelled'].includes(j.status))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{profile?.provider_profiles?.business_name ?? profile?.full_name}</p>
        </div>
        <Link to="/provider/jobs"><Button variant="secondary">Browse Jobs</Button></Link>
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-brand-700">${earnings.total.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Total earned</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">${earnings.pending.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">In escrow</p>
        </Card>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Jobs ({active.length})</h2>
            {active.length === 0 ? (
              <Card className="p-6 text-center text-gray-400">
                <p className="mb-3">No active jobs. Start bidding!</p>
                <Link to="/provider/jobs"><Button variant="secondary">View Job Board</Button></Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {active.map((j) => <JobCard key={j.id} job={j} linkTo={`/jobs/${j.id}`} />)}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past Jobs ({past.length})</h2>
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
