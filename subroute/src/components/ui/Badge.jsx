const map = {
  open:       'bg-blue-100 text-blue-700',
  claimed:    'bg-yellow-100 text-yellow-700',
  active:     'bg-orange-100 text-orange-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-slate-100 text-slate-500',
  disputed:   'bg-red-100 text-red-700',
  pending:    'bg-yellow-100 text-yellow-700',
  approved:   'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
  signed:     'bg-green-100 text-green-700',
  escrowed:   'bg-purple-100 text-purple-700',
  released:   'bg-green-100 text-green-700',
}

export function Badge({ label, color }) {
  const cls = color ? map[color] : (map[label?.toLowerCase()] ?? 'bg-slate-100 text-slate-600')
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}
