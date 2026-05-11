import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { serviceLabel } from './ServiceSelector'

export function JobCard({ job, linkTo }) {
  const propertyLabel = job.properties
    ? `${job.properties.city}, ${job.properties.state}`
    : job.city
      ? `${job.city}, ${job.state}`
      : '—'

  const bidCount = job.bids?.[0]?.count ?? job.bid_count ?? 0

  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-medium text-gray-900">{propertyLabel}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {job.preferred_date
                ? new Date(job.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Date flexible'
              }
            </p>
          </div>
          <Badge label={job.status?.replace('_', ' ')} color={job.status} />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(job.services ?? []).map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{serviceLabel(s)}</span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{bidCount} bid{bidCount !== 1 ? 's' : ''}</span>
          {job.customer_budget && <span>Budget: ${Number(job.customer_budget).toFixed(0)}</span>}
          {job.lot_size_sqft && <span>{job.lot_size_sqft.toLocaleString()} sq ft</span>}
        </div>
      </div>
    </Card>
  )

  if (linkTo) {
    return <Link to={linkTo} className="block">{content}</Link>
  }
  return content
}
