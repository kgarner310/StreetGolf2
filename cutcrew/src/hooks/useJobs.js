import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCustomerJobs(customerId) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    const { data } = await supabase
      .from('jobs')
      .select('*, properties(*), bids(count)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    setJobs(data ?? [])
    setLoading(false)
  }, [customerId])

  useEffect(() => {
    fetchJobs()
    const channel = supabase
      .channel('customer-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `customer_id=eq.${customerId}` }, fetchJobs)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [customerId, fetchJobs])

  return { jobs, loading, refetch: fetchJobs }
}

export function useOpenJobs(providerZips = []) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('open_jobs_view')
      .select('*')
      .order('created_at', { ascending: false })

    if (providerZips.length > 0) {
      query = query.in('zip_code', providerZips)
    }

    const { data } = await query
    setJobs(data ?? [])
    setLoading(false)
  }, [providerZips.join(',')])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  return { jobs, loading, refetch: fetchJobs }
}

export function useJob(jobId) {
  const [job, setJob] = useState(null)
  const [bids, setBids] = useState([])
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchJob = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    const [{ data: jobData }, { data: bidsData }, { data: contractData }] = await Promise.all([
      supabase.from('jobs').select('*, properties(*)').eq('id', jobId).single(),
      supabase.from('bids').select('*, provider_profiles(*, profiles(*))').eq('job_id', jobId).order('created_at'),
      supabase.from('contracts').select('*, payments(*)').eq('job_id', jobId).maybeSingle(),
    ])
    setJob(jobData)
    setBids(bidsData ?? [])
    setContract(contractData)
    setLoading(false)
  }, [jobId])

  useEffect(() => { fetchJob() }, [fetchJob])

  return { job, bids, contract, loading, refetch: fetchJob }
}

export async function createJob({ property_id, customer_id, services, preferred_date, description, customer_budget }) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({ property_id, customer_id, services, preferred_date, description, customer_budget, status: 'open' })
    .select()
    .single()
  return { data, error }
}

import { buildContractTerms, hashTerms } from '../lib/contracts'

export async function acceptBid({ jobId, bidId, customerId, providerId, bidAmount, job, property, customerProfile, providerProfile }) {

  const terms = buildContractTerms({
    job,
    bid: { amount: bidAmount },
    property,
    customer: customerProfile,
    provider: providerProfile,
  })
  const termsHash = await hashTerms(terms)

  const providerPayout = +(bidAmount * 0.92).toFixed(2)
  const customerTotal = +(bidAmount * 1.04).toFixed(2)
  const platformFee = +(customerTotal - providerPayout).toFixed(2)

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      job_id: jobId,
      bid_id: bidId,
      customer_id: customerId,
      provider_id: providerId,
      total_amount: bidAmount,
      provider_payout: providerPayout,
      customer_total: customerTotal,
      platform_fee: platformFee,
      service_details: { services: job.services, preferred_date: job.preferred_date, description: job.description },
      terms_hash: termsHash,
    })
    .select()
    .single()

  if (contractError) return { error: contractError }

  await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId)
  await supabase.from('bids').update({ status: 'rejected' }).eq('job_id', jobId).neq('id', bidId)
  await supabase.from('jobs').update({ status: 'contracted' }).eq('id', jobId)

  return { data: contract, terms }
}
