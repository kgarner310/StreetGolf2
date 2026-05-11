import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProperties } from '../../hooks/useProfile'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PropertyForm } from '../../components/forms/PropertyForm'
import { Badge } from '../../components/ui/Badge'

export default function Properties() {
  const { profile } = useAuth()
  const { properties, loading, fetchProperties, addProperty, deleteProperty } = useProperties(profile?.id)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchProperties() }, [profile?.id])

  async function handleAdd(values) {
    setAdding(true)
    await addProperty(values)
    setAdding(false)
    setShowForm(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <Button onClick={() => setShowForm(true)}>+ Add property</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : properties.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">
          <p className="mb-4">No properties yet.</p>
          <Button variant="secondary" onClick={() => setShowForm(true)}>Add your first property</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <Card key={p.id}>
              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  {p.nickname && <p className="font-semibold text-gray-900">{p.nickname}</p>}
                  <p className="text-sm text-gray-700">{p.address}</p>
                  <p className="text-sm text-gray-500">{p.city}, {p.state} {p.zip_code}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge label={p.property_type} />
                    {p.lot_size_sqft && <span className="text-xs text-gray-400">{p.lot_size_sqft.toLocaleString()} sq ft</span>}
                  </div>
                  {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
                </div>
                <button
                  onClick={() => deleteProperty(p.id)}
                  className="text-gray-300 hover:text-red-400 flex-shrink-0"
                  title="Remove property"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add a property">
        <PropertyForm onSubmit={handleAdd} loading={adding} />
      </Modal>
    </div>
  )
}
