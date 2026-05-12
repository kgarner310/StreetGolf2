import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { postCoverageJob } from '../hooks/useCoverageJobs'
import { ServiceSelector } from '../components/jobs/ServiceSelector'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const schema = z.object({
  zip_code:       z.string().regex(/^\d{5}$/, 'Enter a 5-digit ZIP'),
  city:           z.string().min(1, 'Required'),
  state:          z.string().length(2, 'Use 2-letter code'),
  property_type:  z.enum(['residential', 'commercial', 'hoa', 'municipal']),
  property_count: z.coerce.number().int().positive(),
  services:       z.array(z.string()).min(1, 'Select at least one service'),
  coverage_date:  z.string().min(1, 'Required'),
  time_window:    z.string().optional(),
  estimated_hours: z.coerce.number().positive().optional().or(z.literal('')),
  pay_rate:       z.coerce.number().positive('Enter a pay rate'),
  notes_public:   z.string().optional(),
  full_address:   z.string().min(5, 'Required — only revealed after non-solicitation signed'),
  gate_code:      z.string().optional(),
  client_notes:   z.string().optional(),
})

export default function PostCoverage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    zip_code: '', city: '', state: '', property_type: 'residential', property_count: 1,
    services: [], coverage_date: '', time_window: '', estimated_hours: '', pay_rate: '',
    notes_public: '', full_address: '', gate_code: '', client_notes: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); setErrors((e) => ({ ...e, [f]: undefined })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const result = schema.safeParse(form)
    if (!result.success) {
      const fe = {}
      result.error.issues.forEach((i) => { fe[i.path[0]] = i.message })
      setErrors(fe)
      return
    }
    setLoading(true)
    const payload = { ...result.data }
    if (!payload.estimated_hours) delete payload.estimated_hours
    const { data, error } = await postCoverageJob(profile.id, payload)
    setLoading(false)
    if (error) { setErrors({ zip_code: error.message }); return }
    navigate(`/jobs/${data.id}`)
  }

  const inputCls = ''

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Post coverage needed</h1>
      <p className="text-sm text-slate-500 mb-6">Fill-ins will only see the ZIP, services, and pay — not the address — until they sign the non-solicitation agreement.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Location (public)</legend>
          <div className="grid grid-cols-3 gap-3">
            <Input label="ZIP" placeholder="75001" value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} error={errors.zip_code} required />
            <Input label="City" value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} required className="col-span-1" />
            <Input label="State" placeholder="TX" maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} error={errors.state} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Property type" value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="hoa">HOA</option>
              <option value="municipal">Municipal</option>
            </Select>
            <Input label="# of stops" type="number" min="1" value={form.property_count} onChange={(e) => set('property_count', e.target.value)} error={errors.property_count} />
          </div>
        </fieldset>

        {/* Services */}
        <div>
          <ServiceSelector selected={form.services} onChange={(v) => set('services', v)} />
          {errors.services && <p className="mt-1 text-xs text-red-600">{errors.services}</p>}
        </div>

        {/* Timing */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Timing</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Coverage date" type="date" value={form.coverage_date} onChange={(e) => set('coverage_date', e.target.value)} error={errors.coverage_date} min={new Date().toISOString().split('T')[0]} required />
            <Input label="Time window (optional)" placeholder="7am–12pm" value={form.time_window} onChange={(e) => set('time_window', e.target.value)} />
          </div>
          <Input label="Estimated hours (optional)" type="number" step="0.5" min="0" placeholder="2.5" value={form.estimated_hours} onChange={(e) => set('estimated_hours', e.target.value)} />
        </fieldset>

        {/* Pay */}
        <Input label="Pay rate ($)" type="number" step="0.01" min="0" placeholder="85.00" value={form.pay_rate} onChange={(e) => set('pay_rate', e.target.value)} error={errors.pay_rate} hint="What you'll pay the fill-in for all stops combined. Platform adds 10% on top." required />

        {/* Public notes */}
        <Textarea label="Public notes (optional)" placeholder="Equipment needed, difficulty level, parking info — nothing that identifies the property" value={form.notes_public} onChange={(e) => set('notes_public', e.target.value)} rows={2} />

        {/* Private details */}
        <fieldset className="space-y-3 p-4 border-2 border-dashed border-amber-300 rounded-xl">
          <legend className="text-sm font-semibold text-amber-700 px-2">🔒 Private — revealed only after non-solicitation signed</legend>
          <Input label="Full address" placeholder="123 Main St, Dallas, TX 75001" value={form.full_address} onChange={(e) => set('full_address', e.target.value)} error={errors.full_address} required />
          <Input label="Gate code (optional)" placeholder="1234#" value={form.gate_code} onChange={(e) => set('gate_code', e.target.value)} />
          <Textarea label="Client/property notes (optional)" placeholder="Dogs in backyard, don't cut past the flower bed, preferred mow direction…" value={form.client_notes} onChange={(e) => set('client_notes', e.target.value)} rows={2} />
        </fieldset>

        <Button type="submit" loading={loading} size="lg" className="w-full">Post coverage job</Button>
      </form>
    </div>
  )
}
