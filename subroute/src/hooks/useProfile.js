import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export async function saveContractorProfile(userId, values) {
  const { data: existing } = await supabase.from('contractor_profiles').select('id').eq('id', userId).maybeSingle()
  if (existing) {
    return supabase.from('contractor_profiles').update(values).eq('id', userId)
  }
  return supabase.from('contractor_profiles').insert({ id: userId, ...values })
}

export async function uploadCOI(contractorId, file) {
  const ext = file.name.split('.').pop()
  const path = `${contractorId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('subroute-coi').upload(path, file, { upsert: false })
  if (error) return { error }
  const { data: { publicUrl } } = supabase.storage.from('subroute-coi').getPublicUrl(path)
  return { url: publicUrl }
}

export async function saveInsuranceCertificate(contractorId, { url, insurer_name, policy_number, coverage_amount, expiry_date }) {
  await supabase.from('insurance_certificates').update({ is_active: false }).eq('contractor_id', contractorId)
  return supabase
    .from('insurance_certificates')
    .insert({ contractor_id: contractorId, document_url: url, insurer_name, policy_number, coverage_amount, expiry_date, is_active: true })
    .select()
    .single()
}
