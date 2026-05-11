import { useState } from 'react'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { uploadCOI, saveInsuranceCertificate } from '../../hooks/useProfile'

const schema = z.object({
  insurer_name:    z.string().min(2, 'Required'),
  policy_number:   z.string().min(2, 'Required'),
  coverage_amount: z.coerce.number().min(1000, 'Minimum $1,000 coverage'),
  expiry_date:     z.string().min(1, 'Required'),
})

export function InsuranceUploadForm({ providerId, onSuccess }) {
  const [file, setFile] = useState(null)
  const [values, setValues] = useState({ insurer_name: '', policy_number: '', coverage_amount: '', expiry_date: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setErrors((e) => ({ ...e, file: 'Please upload your COI document' })); return }

    const result = schema.safeParse(values)
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach((i) => { fieldErrors[i.path[0]] = i.message })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    const { url, error: uploadErr } = await uploadCOI(providerId, file)
    if (uploadErr) { setErrors({ file: uploadErr.message }); setLoading(false); return }

    const { error } = await saveInsuranceCertificate(providerId, { url, ...result.data })
    setLoading(false)

    if (error) { setErrors({ insurer_name: error.message }); return }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">COI Document (PDF or image)</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => { setFile(e.target.files[0]); setErrors((err) => ({ ...err, file: undefined })) }}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
        />
        {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
      </div>
      <Input label="Insurance company" placeholder="State Farm, Nationwide, etc." value={values.insurer_name} onChange={(e) => set('insurer_name', e.target.value)} error={errors.insurer_name} required />
      <Input label="Policy number" value={values.policy_number} onChange={(e) => set('policy_number', e.target.value)} error={errors.policy_number} required />
      <Input label="Coverage amount ($)" type="number" min="1000" placeholder="1000000" value={values.coverage_amount} onChange={(e) => set('coverage_amount', e.target.value)} error={errors.coverage_amount} required hint="Minimum $1,000,000 for commercial jobs" />
      <Input label="Policy expiry date" type="date" value={values.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} error={errors.expiry_date} required />
      <Button type="submit" loading={loading} className="w-full">Upload Insurance Certificate</Button>
    </form>
  )
}
