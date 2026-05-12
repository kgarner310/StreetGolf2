import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { serviceLabel } from './ServiceSelector'

export function CoverageJobCard({ job, linkTo, showClaims }) {
  const claimCount = job.coverage_claims?.length ?? job.claim_count ?? 0
  const dateStr = job.coverage_date
    ? new Date(job.coverage_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '—'

  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-slate-900">{job.city}, {job.state} · {job.zip_code}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {dateStr}{job.time_window ? ` · ${job.time_window}` : ''}
              {job.property_count > 1 ? ` · ${job.property_count} stops` : ''}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-slate-900">${Number(job.pay_rate).toFixed(0)}</p>
            {job.estimated_hours && <p className="text-xs text-slate-400">~{job.estimated_hours}h</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(job.services ?? []).map((s) => (
            <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{serviceLabel(s)}</span>
          ))}
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{job.property_type}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          {job.primary_business && <span>by {job.primary_business}</span>}
          {job.primary_score && <span>⭐ {Number(job.primary_score).toFixed(1)}</span>}
          <div className="flex items-center gap-3 ml-auto">
            {showClaims && <span>{claimCount} claim{claimCount !== 1 ? 's' : ''}</span>}
            {job.status && <Badge label={job.status} color={job.status} />}
          </div>
        </div>
      </div>
    </Card>
  )

  return linkTo ? <Link to={linkTo} className="block">{content}</Link> : content
}
