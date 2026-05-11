import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProperties(customerId) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchProperties = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at')
    setProperties(data ?? [])
    setLoading(false)
  }, [customerId])

  const addProperty = useCallback(async (values) => {
    const { data, error } = await supabase
      .from('properties')
      .insert({ ...values, customer_id: customerId })
      .select()
      .single()
    if (!error) setProperties((prev) => [...prev, data])
    return { data, error }
  }, [customerId])

  const deleteProperty = useCallback(async (id) => {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (!error) setProperties((prev) => prev.filter((p) => p.id !== id))
    return { error }
  }, [])

  return { properties, loading, fetchProperties, addProperty, deleteProperty }
}

export async function saveProviderProfile(userId, values) {
  const { data: existing } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) {
    return supabase.from('provider_profiles').update(values).eq('id', userId)
  }
  return supabase.from('provider_profiles').insert({ id: userId, ...values })
}

export async function uploadCOI(providerId, file) {
  const ext = file.name.split('.').pop()
  const path = `${providerId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('coi-documents')
    .upload(path, file, { upsert: false })
  if (uploadError) return { error: uploadError }

  const { data: { publicUrl } } = supabase.storage.from('coi-documents').getPublicUrl(path)
  return { url: publicUrl }
}

export async function saveInsuranceCertificate(providerId, { url, insurer_name, policy_number, coverage_amount, expiry_date }) {
  await supabase.from('insurance_certificates').update({ is_active: false }).eq('provider_id', providerId)
  return supabase
    .from('insurance_certificates')
    .insert({ provider_id: providerId, document_url: url, insurer_name, policy_number, coverage_amount, expiry_date, is_active: true })
    .select()
    .single()
}
