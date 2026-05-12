import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { buildNonSolicitationTerms, hashTerms, buildCoverageContractTerms } from '../lib/nonSolicitation'

// ── Primary contractor: my posted jobs ────────────────────────────────────────
export function useMyPostedJobs(primaryId) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!primaryId) return
    setLoading(true)
    const { data } = await supabase
      .from('coverage_jobs')
      .select('*, coverage_claims(id, status, fillin_id, contractor_profiles(business_name, reliability_score))')
      .eq('primary_id', primaryId)
      .order('coverage_date', { ascending: true })
    setJobs(data ?? [])
    setLoading(false)
  }, [primaryId])

  useEffect(() => { fetch() }, [fetch])
  return { jobs, loading, refetch: fetch }
}

// ── Fill-in contractor: open jobs board (public fields only) ──────────────────
export function useOpenJobs(serviceZips = []) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('open_coverage_view')
      .select('*')
      .order('coverage_date', { ascending: true })
    if (serviceZips.length > 0) q = q.in('zip_code', serviceZips)
    const { data } = await q
    setJobs(data ?? [])
    setLoading(false)
  }, [serviceZips.join(',')])

  useEffect(() => { fetch() }, [fetch])
  return { jobs, loading, refetch: fetch }
}

// ── Single job detail (full fields gated by non-solicitation check) ───────────
export function useJobDetail(jobId, viewerId) {
  const [job, setJob] = useState(null)
  const [claims, setClaims] = useState([])
  const [contract, setContract] = useState(null)
  const [hasSigned, setHasSigned] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!jobId || !viewerId) return
    setLoading(true)

    const [{ data: jobData }, { data: claimsData }, { data: contractData }, { data: agreementData }] = await Promise.all([
      supabase.from('coverage_jobs').select('*').eq('id', jobId).single(),
      supabase.from('coverage_claims').select('*, contractor_profiles(business_name, reliability_score, owner_name)').eq('job_id', jobId),
      supabase.from('coverage_contracts').select('*, payments(*)').eq('job_id', jobId).maybeSingle(),
      supabase.from('non_solicitation_agreements').select('id').eq('job_id', jobId).eq('fillin_id', viewerId).maybeSingle(),
    ])

    setJob(jobData)
    setClaims(claimsData ?? [])
    setContract(contractData)
    setHasSigned(!!agreementData)
    setLoading(false)
  }, [jobId, viewerId])

  useEffect(() => { fetch() }, [fetch])
  return { job, claims, contract, hasSigned, loading, refetch: fetch }
}

// ── Create a coverage job (primary) ──────────────────────────────────────────
export async function postCoverageJob(primaryId, values) {
  const { data, error } = await supabase
    .from('coverage_jobs')
    .insert({ primary_id: primaryId, ...values })
    .select()
    .single()
  return { data, error }
}

// ── Claim a job (fill-in) ─────────────────────────────────────────────────────
export async function claimJob(jobId, fillinId, message) {
  const { data, error } = await supabase
    .from('coverage_claims')
    .upsert({ job_id: jobId, fillin_id: fillinId, message }, { onConflict: 'job_id,fillin_id' })
    .select()
    .single()
  return { data, error }
}

// ── Sign non-solicitation agreement ──────────────────────────────────────────
export async function signNonSolicitation({ job, fillinId, primaryId, fillinProfile, primaryProfile }) {
  const terms = buildNonSolicitationTerms({
    job,
    primaryBusiness: primaryProfile.business_name,
    fillinBusiness:  fillinProfile.business_name,
    fillinOwner:     fillinProfile.owner_name,
  })
  const terms_hash = await hashTerms(terms)

  const { data, error } = await supabase
    .from('non_solicitation_agreements')
    .insert({ job_id: job.id, fillin_id: fillinId, primary_id: primaryId, terms_text: terms, terms_hash })
    .select()
    .single()

  return { data, error, terms }
}

// ── Approve claim + create contract (primary) ─────────────────────────────────
export async function approveClaim({ job, claim, primaryProfile, fillinProfile }) {
  const agreedPay   = Number(job.pay_rate)
  const platformFee = +(agreedPay * 0.10).toFixed(2)
  const primaryTotal = +(agreedPay + platformFee).toFixed(2)

  const terms = buildCoverageContractTerms({
    job,
    contract: { agreed_pay: agreedPay, platform_fee: platformFee, primary_total: primaryTotal },
    primaryProfile,
    fillinProfile,
  })
  const termsHash = await hashTerms(terms)

  const { data: contract, error } = await supabase
    .from('coverage_contracts')
    .insert({
      job_id:       job.id,
      claim_id:     claim.id,
      primary_id:   primaryProfile.id,
      fillin_id:    claim.fillin_id,
      agreed_pay:   agreedPay,
      platform_fee: platformFee,
      primary_total: primaryTotal,
      terms_hash:   termsHash,
    })
    .select()
    .single()

  if (error) return { error }

  await supabase.from('coverage_claims').update({ status: 'approved' }).eq('id', claim.id)
  await supabase.from('coverage_claims').update({ status: 'rejected' }).eq('job_id', job.id).neq('id', claim.id)
  await supabase.from('coverage_jobs').update({ status: 'claimed' }).eq('id', job.id)

  return { data: contract, terms }
}

// ── Mark job complete + release payment (primary) ─────────────────────────────
export async function markComplete(jobId, contractId) {
  await supabase.from('coverage_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', jobId)
  await supabase.from('payments').update({ status: 'released', released_at: new Date().toISOString() }).eq('contract_id', contractId)
}
