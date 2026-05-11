import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { useProperties } from '../../hooks/useProfile'
import { createJob } from '../../hooks/useJobs'
import { ServiceSelector } from '../../components/jobs/ServiceSelector'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PropertyForm } from '../../components/forms/PropertyForm'

const schema = z.object({
  property_id:    z.string().uuid('Select a property'),
  services:       z.array(z.string()).min(1, 'Select at least one service'),
  preferred_date: z.string().optional(),
  description:    z.string().optional(),
  customer_budget: z.coerce.number().positive().optional().or(z.literal('')),
})

export default function PostJob() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { properties, loading: propsLoading, fetchProperties, addProperty } = useProperties(profile?.id)

  const [form, setForm] = useState({ property_id: '', services: [], preferred_date: '', description: '', customer_budget: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [addingProperty, setAddingProperty] = useState(false)
  const [addingPropLoading, setAddingPropLoading] = useState(false)

  useEffect(() => { fetchProperties() }, [profile?.id])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleAddProperty(values) {
    setAddingPropLoading(true)
    const { data, error } = await addProperty(values)
    setAddingPropLoading(false)
    if (error) return
    setForm((f) => ({ ...f, property_id: data.id }))
    setAddingProperty(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const result = schema.safeParse(form)
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach((i) => { fieldErrors[i.path[0]] = i.message })
      setErrors(fieldErrors)
      return
    }
    setLoading(true)
    const payload = { ...result.data, customer_id: profile.id }
    if (!payload.customer_budget) delete payload.customer_budget
    const { data, error } = await createJob(payload)
    setLoading(false)
    if (error) { setErrors({ property_id: error.message }); return }
    navigate(`/jobs/${data.id}`)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Post a job</h1>
      <p className="text-sm text-gray-500 mb-6">Providers in your area will bid on it</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Property</label>
            <button type="button" onClick={() => setAddingProperty(true)} className="text-xs text-brand-600 hover:underline">+ Add new</button>
          </div>
          {propsLoading ? (
            <p className="text-sm text-gray-400">Loading properties…</p>
          ) : properties.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-2">No properties yet</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddingProperty(true)}>Add a property</Button>
            </div>
          ) : (
            <Select value={form.property_id} onChange={(e) => set('property_id', e.target.value)} error={errors.property_id}>
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname ? `${p.nickname} — ` : ''}{p.address}, {p.city}
                </option>
              ))}
            </Select>
          )}
          {errors.property_id && <p className="mt-1 text-xs text-red-600">{errors.property_id}</p>}
        </div>

        {/* Services */}
        <div>
          <ServiceSelector selected={form.services} onChange={(v) => set('services', v)} />
          {errors.services && <p className="mt-1 text-xs text-red-600">{errors.services}</p>}
        </div>

        <Input
          label="Preferred date (optional)"
          type="date"
          value={form.preferred_date}
          onChange={(e) => set('preferred_date', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />

        <Textarea
          label="Additional details (optional)"
          placeholder="Gate code, specific areas to focus on, equipment preferences…"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
        />

        <Input
          label="Budget (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="Leave blank to get market-rate bids"
          value={form.customer_budget}
          onChange={(e) => set('customer_budget', e.target.value)}
          hint="Providers can still bid above your budget. You're not obligated to accept."
        />

        <Button type="submit" loading={loading} size="lg" className="w-full">Post job</Button>
      </form>

      <Modal open={addingProperty} onClose={() => setAddingProperty(false)} title="Add a property">
        <PropertyForm onSubmit={handleAddProperty} loading={addingPropLoading} />
      </Modal>
    </div>
  )
}
