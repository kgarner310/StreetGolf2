import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useJob, acceptBid } from '../../hooks/useJobs'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { BidCard } from '../../components/jobs/BidCard'
import { serviceLabel } from '../../components/jobs/ServiceSelector'
import ContractView from './ContractView'

export default function JobDetail() {
  const { id } = useParams()
  const { profile, role } = useAuth()
  const { job, bids, contract, loading, refetch } = useJob(id)
  const [accepting, setAccepting] = useState(false)
  const [completing, setCompleting] = useState(false)

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!job) return <div className="p-8 text-center text-gray-400">Job not found.</div>

  const isCustomer = role === 'customer' && profile?.id === job.customer_id
  const isProvider = role === 'provider' && bids.some((b) => b.provider_id === profile?.provider_profiles?.id && b.status === 'accepted')

  const property = job.properties

  async function handleAcceptBid(bid) {
    if (!window.confirm(`Accept ${bid.provider_profiles?.business_name}'s bid of $${bid.amount}?`)) return
    setAccepting(true)

    const { data: provProfile } = await supabase
      .from('provider_profiles')
      .select('*, profiles(*)')
      .eq('id', bid.provider_id)
      .single()

    await acceptBid({
      jobId: job.id,
      bidId: bid.id,
      customerId: profile.id,
      providerId: bid.provider_id,
      bidAmount: Number(bid.amount),
      job,
      property,
      customerProfile: profile,
      providerProfile: { ...provProfile, full_name: provProfile.profiles.full_name },
    })
    setAccepting(false)
    refetch()
  }

  async function handleMarkComplete() {
    if (!window.confirm('Mark this job as complete? This will release payment to the provider.')) return
    setCompleting(true)
    await supabase.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id)
    if (contract?.payments?.[0]) {
      await supabase.from('payments').update({ status: 'released', released_at: new Date().toISOString() }).eq('contract_id', contract.id)
    }
    setCompleting(false)
    refetch()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {property?.city}, {property?.state}
          </h1>
          <p className="text-sm text-gray-500">{property?.address}</p>
        </div>
        <Badge label={job.status.replace('_', ' ')} color={job.status} />
      </div>

      {/* Job details */}
      <Card>
        <CardHeader title="Job Details" />
        <div className="p-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {job.services.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{serviceLabel(s)}</span>
              ))}
            </div>
          </div>
          {job.preferred_date && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
              <p>{new Date(job.preferred_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
          {job.description && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Details</p>
              <p className="text-gray-700">{job.description}</p>
            </div>
          )}
          {job.customer_budget && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Customer budget</p>
              <p>${Number(job.customer_budget).toFixed(2)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Payment summary */}
      {contract && (
        <Card>
          <CardHeader title="Payment Summary" />
          <div className="p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Service price</span>
              <span>${Number(contract.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-brand-600">
              <span>Platform fee (4%)</span>
              <span>+${(Number(contract.total_amount) * 0.04).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Customer total</span>
              <span>${Number(contract.customer_total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Provider payout (after 8% fee)</span>
              <span>${Number(contract.provider_payout).toFixed(2)}</span>
            </div>
            {contract.payments?.[0] && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Payment</span>
                <Badge label={contract.payments[0].status} color={contract.payments[0].status} />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Contract */}
      {contract && (
        <Card>
          <CardHeader title="Service Agreement" />
          <div className="p-4">
            <ContractView
              contract={contract}
              job={job}
              property={property}
              customerProfile={profile}
              providerProfile={profile?.provider_profiles}
              onSigned={refetch}
            />
          </div>
        </Card>
      )}

      {/* Bids */}
      {isCustomer && job.status === 'open' || job.status === 'bidding' ? (
        <Card>
          <CardHeader title={`Bids (${bids.length})`} />
          <div className="p-4 space-y-3">
            {bids.length === 0 ? (
              <p className="text-sm text-gray-400">No bids yet. Providers in your area will see this job and submit quotes.</p>
            ) : (
              bids.map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  canAccept={isCustomer && job.status !== 'contracted'}
                  onAccept={handleAcceptBid}
                />
              ))
            )}
          </div>
        </Card>
      ) : null}

      {/* Actions */}
      {isCustomer && job.status === 'in_progress' && (
        <Button loading={completing} onClick={handleMarkComplete} className="w-full">
          Mark Job Complete & Release Payment
        </Button>
      )}
    </div>
  )
}
