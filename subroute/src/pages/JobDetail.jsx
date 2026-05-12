import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useJobDetail, approveClaim, signNonSolicitation, markComplete } from '../hooks/useCoverageJobs'
import { supabase } from '../lib/supabase'
import { generateAgreementPdf } from '../lib/nonSolicitation'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ClaimCard } from '../components/jobs/ClaimCard'
import { serviceLabel } from '../components/jobs/ServiceSelector'

export default function JobDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { job, claims, contract, hasSigned, loading, refetch } = useJobDetail(id, profile?.id)

  const [signing, setSigning]       = useState(false)
  const [agreed, setAgreed]         = useState(false)
  const [approving, setApproving]   = useState(false)
  const [completing, setCompleting] = useState(false)
  const [signErr, setSignErr]       = useState('')

  if (loading) return <div className="p-8 text-center text-slate-400">Loading…</div>
  if (!job)    return <div className="p-8 text-center text-slate-400">Job not found.</div>

  const isPrimary    = profile?.id === job.primary_id
  const myClaimData  = claims.find((c) => c.fillin_id === profile?.id)
  const myClaim      = !isPrimary ? myClaimData : null
  const myClaimApproved = myClaim?.status === 'approved'

  const showAddress  = isPrimary || (myClaimApproved && hasSigned)
  const showSignGate = !isPrimary && myClaimApproved && !hasSigned

  async function handleSign() {
    if (!agreed) return
    setSigning(true)
    setSignErr('')
    const { data: primaryProfile } = await supabase.from('contractor_profiles').select('*').eq('id', job.primary_id).single()
    const { error } = await signNonSolicitation({
      job,
      fillinId:       profile.id,
      primaryId:      job.primary_id,
      fillinProfile:  profile,
      primaryProfile,
    })
    setSigning(false)
    if (error) { setSignErr(error.message); return }
    refetch()
  }

  async function handleApprove(claim) {
    setApproving(true)
    const { data: fillinProfile } = await supabase.from('contractor_profiles').select('*').eq('id', claim.fillin_id).single()
    await approveClaim({ job, claim, primaryProfile: profile, fillinProfile })
    setApproving(false)
    refetch()
  }

  async function downloadAgreement() {
    const blob = await generateAgreementPdf({
      terms: `Non-Solicitation Agreement\nJob: ${job.city}, ${job.state} ${job.zip_code}\nDate: ${job.coverage_date}`,
      fillinName: profile.business_name,
      primaryName: '',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subroute-nsa-${id.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.city}, {job.state} {job.zip_code}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {job.coverage_date ? new Date(job.coverage_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
            {job.time_window ? ` · ${job.time_window}` : ''}
          </p>
        </div>
        <Badge label={job.status} color={job.status} />
      </div>

      {/* Job details */}
      <Card>
        <CardHeader title="Job Details" />
        <div className="p-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {job.services.map((s) => <span key={s} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{serviceLabel(s)}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-slate-500 uppercase tracking-wide">Stops</p><p>{job.property_count}</p></div>
            <div><p className="text-xs text-slate-500 uppercase tracking-wide">Type</p><p className="capitalize">{job.property_type}</p></div>
            {job.estimated_hours && <div><p className="text-xs text-slate-500 uppercase tracking-wide">Est. hours</p><p>{job.estimated_hours}h</p></div>}
            <div><p className="text-xs text-slate-500 uppercase tracking-wide">Pay rate</p><p className="font-semibold text-slate-900">${Number(job.pay_rate).toFixed(2)}</p></div>
          </div>
          {job.notes_public && <div><p className="text-xs text-slate-500 uppercase tracking-wide">Public notes</p><p className="text-slate-700">{job.notes_public}</p></div>}
        </div>
      </Card>

      {/* Private details — shown only to primary OR approved+signed fill-in */}
      {showAddress && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader title="🔒 Private Details" subtitle={isPrimary ? "Visible to you (primary)" : "Revealed after signing non-solicitation"} />
          <div className="p-4 space-y-2 text-sm">
            {job.full_address && <div><p className="text-xs text-amber-700 uppercase tracking-wide">Full address</p><p className="font-medium text-slate-900">{job.full_address}</p></div>}
            {job.gate_code    && <div><p className="text-xs text-amber-700 uppercase tracking-wide">Gate code</p><p>{job.gate_code}</p></div>}
            {job.client_notes && <div><p className="text-xs text-amber-700 uppercase tracking-wide">Client notes</p><p className="text-slate-700">{job.client_notes}</p></div>}
          </div>
          {!isPrimary && hasSigned && (
            <div className="px-4 pb-4">
              <Button variant="ghost" size="sm" onClick={downloadAgreement}>Download non-solicitation agreement PDF</Button>
            </div>
          )}
        </Card>
      )}

      {/* Non-solicitation sign gate (fill-in, claim approved, not yet signed) */}
      {showSignGate && (
        <Card className="border-2 border-slate-800">
          <CardHeader title="Sign Non-Solicitation Agreement" subtitle="Required before receiving address and client details" />
          <div className="p-4 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-xs font-mono text-slate-700 max-h-48 overflow-y-auto border border-slate-200">
              {`SUBROUTE NON-SOLICITATION AGREEMENT\n\nYou agree not to solicit, contact, or accept business from any property or client encountered during this coverage assignment for 24 months. All property information disclosed is strictly confidential. Violation is an enforceable breach of contract.\n\nJob: ${job.city}, ${job.state} ${job.zip_code} · ${job.coverage_date}\nServices: ${job.services.map(serviceLabel).join(', ')}`}
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded border-slate-300 focus:ring-slate-500" />
              <span className="text-sm text-slate-700">I agree to the non-solicitation terms. I understand this is a legally binding agreement and violation is enforceable.</span>
            </label>
            {signErr && <p className="text-xs text-red-600">{signErr}</p>}
            <Button loading={signing} disabled={!agreed} onClick={handleSign} className="w-full">
              Sign & Unlock Job Details
            </Button>
          </div>
        </Card>
      )}

      {/* Fill-in: not yet claimed */}
      {!isPrimary && !myClaim && job.status === 'open' && (
        <Card className="p-4 text-center text-sm text-slate-500">
          Go to the <a href="/board" className="underline text-slate-700">job board</a> to claim this job.
        </Card>
      )}

      {/* Fill-in: pending claim */}
      {!isPrimary && myClaim?.status === 'pending' && (
        <Card className="p-4 text-center">
          <Badge label="Claim pending" color="pending" />
          <p className="text-sm text-slate-500 mt-2">The primary contractor will review your claim and respond.</p>
        </Card>
      )}

      {/* Contract summary */}
      {contract && (
        <Card>
          <CardHeader title="Coverage Contract" />
          <div className="p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">Fill-in receives</span><span className="font-semibold">${Number(contract.agreed_pay).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Platform fee (10%)</span><span>${Number(contract.platform_fee).toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold"><span>Primary pays</span><span>${Number(contract.primary_total).toFixed(2)}</span></div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <p className="text-xs text-slate-500 mb-1">Primary</p>
                {contract.primary_signed_at ? <><Badge label="Signed" color="approved" /><p className="text-xs text-slate-400 mt-1">{new Date(contract.primary_signed_at).toLocaleDateString()}</p></> : <Badge label="Pending" color="pending" />}
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <p className="text-xs text-slate-500 mb-1">Fill-in</p>
                {contract.fillin_signed_at ? <><Badge label="Signed" color="approved" /><p className="text-xs text-slate-400 mt-1">{new Date(contract.fillin_signed_at).toLocaleDateString()}</p></> : <Badge label="Pending" color="pending" />}
              </div>
            </div>
            {contract.payments?.[0] && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Payment</span>
                <Badge label={contract.payments[0].status} color={contract.payments[0].status} />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Primary: claims list */}
      {isPrimary && claims.length > 0 && (
        <Card>
          <CardHeader title={`Claims (${claims.length})`} />
          <div className="p-4 space-y-3">
            {claims.map((c) => (
              <ClaimCard key={c.id} claim={c} canApprove={job.status === 'open'} onApprove={handleApprove} />
            ))}
          </div>
          {approving && <p className="text-xs text-center text-slate-400 pb-4">Processing…</p>}
        </Card>
      )}

      {/* Primary: mark complete */}
      {isPrimary && job.status === 'active' && (
        <Button loading={completing} onClick={async () => { setCompleting(true); await markComplete(job.id, contract?.id); setCompleting(false); refetch() }} className="w-full">
          Confirm job complete — release payment
        </Button>
      )}
    </div>
  )
}
