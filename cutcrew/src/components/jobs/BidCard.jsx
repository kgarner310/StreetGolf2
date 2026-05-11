import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function BidCard({ bid, onAccept, canAccept }) {
  const provider = bid.provider_profiles
  const profile = provider?.profiles

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-gray-900">{provider?.business_name ?? 'Provider'}</p>
            <p className="text-xs text-gray-500">{profile?.full_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-brand-700">${Number(bid.amount).toFixed(2)}</p>
            {bid.estimated_duration_hours && (
              <p className="text-xs text-gray-500">~{bid.estimated_duration_hours}h</p>
            )}
          </div>
        </div>

        {bid.notes && <p className="text-sm text-gray-600 mb-3">{bid.notes}</p>}

        <div className="flex items-center justify-between">
          <Badge label={bid.status} color={bid.status} />
          {canAccept && bid.status === 'pending' && (
            <Button size="sm" onClick={() => onAccept(bid)}>Accept Bid</Button>
          )}
        </div>
      </div>
    </Card>
  )
}
