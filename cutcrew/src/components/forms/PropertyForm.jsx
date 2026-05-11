import { useState } from 'react'
import { z } from 'zod'
import { Input, Select, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'

const schema = z.object({
  nickname:       z.string().optional(),
  address:        z.string().min(5, 'Required'),
  city:           z.string().min(1, 'Required'),
  state:          z.string().length(2, 'Use 2-letter state code'),
  zip_code:       z.string().regex(/^\d{5}$/, 'Enter 5-digit ZIP'),
  property_type:  z.enum(['residential', 'commercial']),
  lot_size_sqft:  z.coerce.number().positive().optional().or(z.literal('')),
  notes:          z.string().optional(),
})

export function PropertyForm({ onSubmit, loading }) {
  const [values, setValues] = useState({ nickname: '', address: '', city: '', state: '', zip_code: '', property_type: 'residential', lot_size_sqft: '', notes: '' })
  const [errors, setErrors] = useState({})

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
    const data = { ...result.data }
    if (!data.lot_size_sqft) delete data.lot_size_sqft
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nickname (optional)" placeholder="Home, Office, Rental #1" value={values.nickname} onChange={(e) => set('nickname', e.target.value)} error={errors.nickname} />
      <Input label="Street address" placeholder="123 Main St" value={values.address} onChange={(e) => set('address', e.target.value)} error={errors.address} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="City" value={values.city} onChange={(e) => set('city', e.target.value)} error={errors.city} required />
        <Input label="State" placeholder="TX" maxLength={2} value={values.state} onChange={(e) => set('state', e.target.value.toUpperCase())} error={errors.state} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="ZIP code" placeholder="75001" value={values.zip_code} onChange={(e) => set('zip_code', e.target.value)} error={errors.zip_code} required />
        <Select label="Property type" value={values.property_type} onChange={(e) => set('property_type', e.target.value)} error={errors.property_type}>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </Select>
      </div>
      <Input label="Lot size (sq ft, optional)" type="number" placeholder="5000" value={values.lot_size_sqft} onChange={(e) => set('lot_size_sqft', e.target.value)} error={errors.lot_size_sqft} />
      <Textarea label="Notes for providers (optional)" placeholder="Gate code, dog in backyard, etc." value={values.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
      <Button type="submit" loading={loading} className="w-full">Save Property</Button>
    </form>
  )
}
