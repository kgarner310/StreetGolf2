import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { saveContractorProfile, uploadCOI, saveInsuranceCertificate } from '../hooks/useProfile'
import { Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const STEPS = ['Service Area', 'Insurance', 'Ready']

export default function Onboarding() {
  const { profile, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [areaForm, setAreaForm] = useState({ service_zip_codes_raw: '', years_in_business: '', bio: '' })
  const [coiForm, setCoiForm]   = useState({ file: null, insurer_name: '', policy_number: '', coverage_amount: '', expiry_date: '' })
  const [coiError, setCoiError] = useState('')

  function setArea(f, v) { setAreaForm((a) => ({ ...a, [f]: v })) }
  function setCoi(f, v)  { setCoiForm((c) => ({ ...c, [f]: v })) }

  async function saveArea(e) {
    e.preventDefault()
    if (!areaForm.service_zip_codes_raw) return
    setSaving(true)
    const zips = areaForm.service_zip_codes_raw.split(/[\s,]+/).map((z) => z.trim()).filter((z) => /^\d{5}$/.test(z))
    await saveContractorProfile(profile.id, {
      service_zip_codes: zips,
      years_in_business: areaForm.years_in_business ? Number(areaForm.years_in_business) : null,
      bio: areaForm.bio,
    })
    setSaving(false)
    setStep(1)
  }

  async function saveCOI(e) {
    e.preventDefault()
    if (!coiForm.file) { setCoiError('Please upload your COI document'); return }
    setSaving(true)
    const { url, error: uploadErr } = await uploadCOI(profile.id, coiForm.file)
    if (uploadErr) { setCoiError(uploadErr.message); setSaving(false); return }
    const { error } = await saveInsuranceCertificate(profile.id, { url, insurer_name: coiForm.insurer_name, policy_number: coiForm.policy_number, coverage_amount: coiForm.coverage_amount, expiry_date: coiForm.expiry_date })
    if (error) { setCoiError(error.message); setSaving(false); return }
    await refetchProfile()
    setSaving(false)
    setStep(2)
  }

  const inputCls = '[&_label]:text-slate-300 [&_input]:bg-slate-700 [&_input]:border-slate-600 [&_input]:text-white [&_input]:placeholder-slate-500 [&_textarea]:bg-slate-700 [&_textarea]:border-slate-600 [&_textarea]:text-white'

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-8">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-white font-medium' : 'text-slate-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-700" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Your service area</h2>
            <p className="text-sm text-slate-400 mb-5">You'll only see coverage jobs in these ZIP codes.</p>
            <form onSubmit={saveArea} className="space-y-4">
              <Input label="Service ZIP codes" value={areaForm.service_zip_codes_raw} onChange={(e) => setArea('service_zip_codes_raw', e.target.value)} placeholder="75001, 75002, 75010" hint="Comma or space separated" required className={inputCls} />
              <Input label="Years in business" type="number" min="0" value={areaForm.years_in_business} onChange={(e) => setArea('years_in_business', e.target.value)} className={inputCls} />
              <Textarea label="Bio (optional)" value={areaForm.bio} onChange={(e) => setArea('bio', e.target.value)} placeholder="Equipment you use, specialties, etc." rows={3} className={inputCls} />
              <Button type="submit" loading={saving} variant="accent" className="w-full">Continue</Button>
            </form>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Insurance certificate</h2>
            <p className="text-sm text-slate-400 mb-5">Required for all members. General liability min. $1,000,000.</p>
            <form onSubmit={saveCOI} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">COI Document (PDF or image)</label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setCoi('file', e.target.files[0])} className="block w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600" />
              </div>
              <Input label="Insurance company" value={coiForm.insurer_name} onChange={(e) => setCoi('insurer_name', e.target.value)} required className={inputCls} />
              <Input label="Policy number" value={coiForm.policy_number} onChange={(e) => setCoi('policy_number', e.target.value)} required className={inputCls} />
              <Input label="Coverage amount ($)" type="number" min="1000" placeholder="1000000" value={coiForm.coverage_amount} onChange={(e) => setCoi('coverage_amount', e.target.value)} required className={inputCls} />
              <Input label="Expiry date" type="date" value={coiForm.expiry_date} onChange={(e) => setCoi('expiry_date', e.target.value)} required className={inputCls} />
              {coiError && <p className="text-sm text-red-400">{coiError}</p>}
              <Button type="submit" loading={saving} variant="accent" className="w-full">Upload & Continue</Button>
            </form>
          </>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">You're in</h2>
            <p className="text-slate-400 mb-2">Your account is under review — typically approved within 24 hours.</p>
            <p className="text-slate-500 text-sm mb-6">You can browse the job board now. You'll need verification to claim or post jobs.</p>
            <Button variant="accent" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  )
}
