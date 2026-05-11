import { useAuth } from '../../hooks/useAuth'
import { useOpenJobs } from '../../hooks/useJobs'
import { JobCard } from '../../components/jobs/JobCard'
import { Modal } from '../../components/ui/Modal'
import { BidForm } from '../../components/forms/BidForm'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { serviceLabel } from '../../components/jobs/ServiceSelector'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'

export default function JobBoard() {
  const { profile } = useAuth()
  const providerProfile = profile?.provider_profiles
  const zips = providerProfile?.service_zip_codes ?? []

  const { jobs, loading, refetch } = useOpenJobs(zips)
  const [bidding, setBidding] = useState(null)

  const isVerified = providerProfile?.is_verified
  const hasCOI = profile?.provider_profiles?.id  // simplified check

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Job Board</h1>
      <p className="text-sm text-gray-500 mb-6">Open jobs in your service area</p>

      {!isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
          Your account is pending verification. Complete your <a href="/provider/onboarding" className="underline font-medium">provider onboarding</a> to start bidding.
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">
          <p>No open jobs in your service area right now.</p>
          <p className="text-xs mt-2">Update your service ZIP codes in your profile to see more jobs.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{job.city}, {job.state} {job.zip_code}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {job.preferred_date
                          ? new Date(job.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Date flexible'
                        }
                        {job.lot_size_sqft && ` · ${job.lot_size_sqft.toLocaleString()} sq ft`}
                        {` · ${job.property_type}`}
                      </p>
                    </div>
                    <Badge label={`${job.bid_count} bid${job.bid_count !== 1 ? 's' : ''}`} />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(job.services ?? []).map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{serviceLabel(s)}</span>
                    ))}
                  </div>

                  {job.customer_budget && (
                    <p className="text-xs text-gray-500 mb-3">Customer budget: ${Number(job.customer_budget).toFixed(0)}</p>
                  )}

                  <Button
                    size="sm"
                    disabled={!isVerified}
                    onClick={() => setBidding(job)}
                  >
                    Submit Bid
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!bidding} onClose={() => setBidding(null)} title="Submit your bid">
        {bidding && (
          <>
            <p className="text-sm text-gray-500 mb-4">{bidding.city}, {bidding.state} · {(bidding.services ?? []).map(serviceLabel).join(', ')}</p>
            <BidForm
              jobId={bidding.id}
              providerId={providerProfile?.id}
              onSuccess={() => { setBidding(null); refetch() }}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
