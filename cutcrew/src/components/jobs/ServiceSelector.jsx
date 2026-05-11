const SERVICES = [
  { id: 'mowing',      label: 'Mowing',      icon: '🌿' },
  { id: 'weed_eating', label: 'Weed Eating',  icon: '🌾' },
  { id: 'edging',      label: 'Edging',       icon: '📐' },
  { id: 'blowing',     label: 'Blowing',      icon: '💨' },
]

export function ServiceSelector({ selected = [], onChange }) {
  function toggle(id) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Services needed</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SERVICES.map((s) => {
          const active = selected.includes(s.id)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'
              }`}
            >
              <span className="text-2xl">{s.icon}</span>
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function serviceLabel(id) {
  return SERVICES.find((s) => s.id === id)?.label ?? id
}
