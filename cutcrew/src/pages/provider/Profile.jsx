import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { saveProviderProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { InsuranceUploadForm } from '../../components/forms/InsuranceUploadForm'

export default function ProviderProfile() {
  const { profile, refetchProfile } = useAuth()
  const pp = profile?.provider_profiles

  const [form, setForm] = useState({
    business_name: pp?.business_name ?? '',
    business_address: pp?.business_address ?? '',
    service_zip_codes_raw: (pp?.service_zip_codes ?? []).join(', '),
    bio: pp?.bio ?? '',
    years_experience: pp?.years_experience ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [coi, setCoi] = useState(null)
  const [showCOIForm, setShowCOIForm] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  useEffect(() => {
    if (!pp?.id) return
    supabase
      .from('insurance_certificates')
      .select('*')
      .eq('provider_id', pp.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setCoi(data))
  }, [pp?.id])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const zips = form.service_zip_codes_raw
      .split(/[\s,]+/)
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z))
    await saveProviderProfile(profile.id, {
      business_name: form.business_name,
      business_address: form.business_address,
      service_zip_codes: zips,
      bio: form.bio,
      years_experience: form.years_experience ? Number(form.years_experience) : null,
    })
    await refetchProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const coiExpired = coi && new Date(coi.expiry_date) < new Date()

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>

      {/* Verification status */}
      <Card>
        <CardHeader
          title="Account status"
          subtitle="Verification is required to bid on jobs"
          action={<Badge label={pp?.is_verified ? 'Verified' : 'Pending'} color={pp?.is_verified ? 'completed' : 'pending'} />}
        />
      </Card>

      {/* Insurance */}
      <Card>
        <CardHeader
          title="Insurance Certificate"
          action={<button onClick={() => setShowCOIForm(true)} className="text-sm text-brand-600 hover:underline">{coi ? 'Update' : 'Upload'}</button>}
        />
        <div className="px-6 py-4">
          {coi ? (
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{coi.insurer_name}</span>
                {coiExpired ? <Badge label="Expired" color="disputed" /> : <Badge label="Active" color="completed" />}
              </div>
              <p className="text-gray-500">Policy: {coi.policy_number}</p>
              <p className="text-gray-500">Coverage: ${Number(coi.coverage_amount).toLocaleString()}</p>
              <p className={coiExpired ? 'text-red-600 font-medium' : 'text-gray-500'}>
                Expires: {new Date(coi.expiry_date).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No insurance certificate on file. Upload one to start bidding.</p>
          )}
        </div>
      </Card>

      {/* Business info form */}
      <Card>
        <CardHeader title="Business Info" />
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <Input label="Business name" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} required />
          <Input label="Business address" value={form.business_address} onChange={(e) => set('business_address', e.target.value)} />
          <Input
            label="Service area ZIP codes"
            value={form.service_zip_codes_raw}
            onChange={(e) => set('service_zip_codes_raw', e.target.value)}
            hint="Comma or space separated 5-digit ZIPs"
          />
          <Input label="Years of experience" type="number" min="0" value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} />
          <Textarea label="Bio" value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} />
          <Button type="submit" loading={saving} className="w-full">
            {saved ? 'Saved!' : 'Save changes'}
          </Button>
        </form>
      </Card>

      <Modal open={showCOIForm} onClose={() => setShowCOIForm(false)} title="Upload Insurance Certificate">
        <InsuranceUploadForm
          providerId={profile?.id}
          onSuccess={async () => {
            const { data } = await supabase.from('insurance_certificates').select('*').eq('provider_id', pp?.id).eq('is_active', true).maybeSingle()
            setCoi(data)
            setShowCOIForm(false)
          }}
        />
      </Modal>
    </div>
  )
}
