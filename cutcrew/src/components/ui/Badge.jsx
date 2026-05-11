const colorMap = {
  open:        'bg-blue-100 text-blue-700',
  bidding:     'bg-yellow-100 text-yellow-700',
  contracted:  'bg-purple-100 text-purple-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  disputed:    'bg-red-100 text-red-700',
  cancelled:   'bg-gray-100 text-gray-500',
  pending:     'bg-yellow-100 text-yellow-700',
  accepted:    'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
  escrowed:    'bg-purple-100 text-purple-700',
  released:    'bg-green-100 text-green-700',
}

export function Badge({ label, color }) {
  const cls = color ? colorMap[color] : (colorMap[label?.toLowerCase()] ?? 'bg-gray-100 text-gray-600')
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
