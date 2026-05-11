import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { buildContractTerms, generateContractPdf } from '../../lib/contracts'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

export default function ContractView({ contract, job, property, customerProfile, providerProfile, onSigned }) {
  const [signing, setSigning] = useState(false)
  const [agreed, setAgreed] = useState(false)

  if (!contract) return null

  const terms = buildContractTerms({
    job,
    bid: { amount: contract.total_amount },
    property,
    customer: customerProfile,
    provider: providerProfile,
  })

  const bothSigned = contract.customer_signed_at && contract.provider_signed_at

  async function handleSign(role) {
    if (!agreed) return
    setSigning(true)

    const updateField = role === 'customer'
      ? { customer_signed_at: new Date().toISOString() }
      : { provider_signed_at: new Date().toISOString() }

    await supabase.from('contracts').update(updateField).eq('id', contract.id)
    setSigning(false)
    onSigned?.()
  }

  async function downloadPdf() {
    const blob = await generateContractPdf({
      terms,
      customerName: customerProfile.full_name,
      providerName: providerProfile.business_name,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cutcrew-contract-${contract.id.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Service Agreement</h3>
        <Button variant="ghost" size="sm" onClick={downloadPdf}>Download PDF</Button>
      </div>

      <pre className="bg-gray-50 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap text-gray-700 max-h-80 overflow-y-auto border border-gray-200">
        {terms}
      </pre>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Customer</p>
          {contract.customer_signed_at
            ? <><Badge label="Signed" color="completed" /><p className="text-xs text-gray-400 mt-1">{new Date(contract.customer_signed_at).toLocaleString()}</p></>
            : <Badge label="Pending" color="pending" />
          }
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Provider</p>
          {contract.provider_signed_at
            ? <><Badge label="Signed" color="completed" /><p className="text-xs text-gray-400 mt-1">{new Date(contract.provider_signed_at).toLocaleString()}</p></>
            : <Badge label="Pending" color="pending" />
          }
        </div>
      </div>

      {!bothSigned && (
        <div className="space-y-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-600">
              I have read and agree to the terms of this service agreement.
            </span>
          </label>
          <Button
            loading={signing}
            disabled={!agreed}
            onClick={() => handleSign(contract.customer_signed_at ? 'provider' : 'customer')}
            className="w-full"
          >
            Sign Agreement
          </Button>
        </div>
      )}

      {bothSigned && (
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <p className="text-sm font-medium text-green-700">Both parties have signed. Job is active.</p>
        </div>
      )}
    </div>
  )
}
