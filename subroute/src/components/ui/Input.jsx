export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 ${error ? 'border-red-400' : 'border-slate-300'}`} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <select className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${error ? 'border-red-400' : 'border-slate-300'}`} {...props}>{children}</select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <textarea className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none ${error ? 'border-red-400' : 'border-slate-300'}`} rows={4} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
