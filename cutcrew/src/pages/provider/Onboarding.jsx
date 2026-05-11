import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { saveProviderProfile } from '../../hooks/useProfile'
import { InsuranceUploadForm } from '../../components/forms/InsuranceUploadForm'
import { Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const STEPS = ['Business Info', 'Insurance', 'Done']

export default function ProviderOnboarding() {
  const { profile, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [bizForm, setBizForm] = useState({
    business_name: '',
    business_address: '',
    service_zip_codes_raw: '',
    bio: '',
    years_experience: '',
  })

  function setBiz(field, value) { setBizForm((f) => ({ ...f, [field]: value })) }

  async function saveBizInfo(e) {
    e.preventDefault()
    if (!bizForm.business_name) return
    setSaving(true)
    const zips = bizForm.service_zip_codes_raw
      .split(/[\s,]+/)
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z))

    await saveProviderProfile(profile.id, {
      business_name: bizForm.business_name,
      business_address: bizForm.business_address,
      service_zip_codes: zips,
      bio: bizForm.bio,
      years_experience: bizForm.years_experience ? Number(bizForm.years_experience) : null,
    })
    setSaving(false)
    setStep(1)
  }

  async function handleCOISuccess() {
    await refetchProfile()
    setStep(2)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 w-8" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Business Info</h1>
          <p className="text-sm text-gray-500 mb-6">Tell customers about your business</p>
          <form onSubmit={saveBizInfo} className="space-y-4">
            <Input label="Business name" value={bizForm.business_name} onChange={(e) => setBiz('business_name', e.target.value)} required />
            <Input label="Business address (optional)" value={bizForm.business_address} onChange={(e) => setBiz('business_address', e.target.value)} />
            <div>
              <Input
                label="Service area ZIP codes"
                value={bizForm.service_zip_codes_raw}
                onChange={(e) => setBiz('service_zip_codes_raw', e.target.value)}
                placeholder="75001, 75002, 75010"
                hint="Comma or space separated. You'll only see jobs in these ZIPs."
                required
              />
            </div>
            <Input label="Years of experience (optional)" type="number" min="0" value={bizForm.years_experience} onChange={(e) => setBiz('years_experience', e.target.value)} />
            <Textarea label="Bio (optional)" placeholder="Tell customers about your experience, equipment, and specialties." value={bizForm.bio} onChange={(e) => setBiz('bio', e.target.value)} rows={3} />
            <Button type="submit" loading={saving} className="w-full">Save & Continue</Button>
          </form>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload Insurance</h1>
          <p className="text-sm text-gray-500 mb-6">
            A valid Certificate of Insurance (COI) is required before you can bid on jobs.
            General liability minimum: <strong>$1,000,000</strong> per occurrence.
          </p>
          <InsuranceUploadForm providerId={profile.id} onSuccess={handleCOISuccess} />
        </>
      )}

      {step === 2 && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h1>
          <p className="text-gray-500 mb-2">Your profile is under review. You'll be able to bid on jobs once verified (usually within 24 hours).</p>
          <p className="text-sm text-gray-400 mb-6">In the meantime, explore the job board to see what's available in your area.</p>
          <Button onClick={() => navigate('/provider/jobs')}>Browse Job Board</Button>
        </div>
      )}
    </div>
  )
}
