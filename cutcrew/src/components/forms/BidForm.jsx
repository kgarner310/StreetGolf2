import { useState } from 'react'
import { z } from 'zod'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  amount:                   z.coerce.number().positive('Enter a valid price'),
  estimated_duration_hours: z.coerce.number().positive().optional().or(z.literal('')),
  notes:                    z.string().optional(),
})

export function BidForm({ jobId, providerId, onSuccess }) {
  const [values, setValues] = useState({ amount: '', estimated_duration_hours: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const result = schema.safeParse(values)
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach((i) => { fieldErrors[i.path[0]] = i.message })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    const payload = { job_id: jobId, provider_id: providerId, ...result.data }
    if (!payload.estimated_duration_hours) delete payload.estimated_duration_hours

    const { error } = await supabase.from('bids').upsert(payload, { onConflict: 'job_id,provider_id' })
    setLoading(false)

    if (error) { setErrors({ amount: error.message }); return }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Your quote ($)"
        type="number"
        step="0.01"
        min="0"
        placeholder="75.00"
        value={values.amount}
        onChange={(e) => set('amount', e.target.value)}
        error={errors.amount}
        required
      />
      <Input
        label="Estimated time (hours, optional)"
        type="number"
        step="0.5"
        min="0"
        placeholder="1.5"
        value={values.estimated_duration_hours}
        onChange={(e) => set('estimated_duration_hours', e.target.value)}
        error={errors.estimated_duration_hours}
      />
      <Textarea
        label="Notes to customer (optional)"
        placeholder="Equipment I'll use, availability window, etc."
        value={values.notes}
        onChange={(e) => set('notes', e.target.value)}
        rows={3}
      />
      <Button type="submit" loading={loading} className="w-full">Submit Bid</Button>
    </form>
  )
}
