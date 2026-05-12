import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function ClaimCard({ claim, onApprove, canApprove }) {
  const cp = claim.contractor_profiles
  return (
    <Card>
      <div className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">{cp?.business_name ?? 'Contractor'}</p>
          <div className="flex items-center gap-2 mt-1">
            {cp?.reliability_score && <span className="text-xs text-slate-500">⭐ {Number(cp.reliability_score).toFixed(1)} reliability</span>}
            <Badge label={claim.status} color={claim.status} />
          </div>
          {claim.message && <p className="text-sm text-slate-600 mt-1.5">{claim.message}</p>}
        </div>
        {canApprove && claim.status === 'pending' && (
          <Button size="sm" onClick={() => onApprove(claim)}>Approve</Button>
        )}
      </div>
    </Card>
  )
}
