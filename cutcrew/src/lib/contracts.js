import { jsPDF } from 'jspdf'

export function buildContractTerms({ job, bid, property, customer, provider }) {
  const serviceList = job.services
    .map((s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(', ')
  const totalFmt = `$${Number(bid.amount).toFixed(2)}`
  const customerTotalFmt = `$${(bid.amount * 1.04).toFixed(2)}`
  const providerPayoutFmt = `$${(bid.amount * 0.92).toFixed(2)}`

  return `CUTCREW SERVICE AGREEMENT

Date: ${new Date().toLocaleDateString()}

PARTIES
Customer: ${customer.full_name}
Provider: ${provider.business_name} (${provider.full_name})

PROPERTY
${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Type: ${property.property_type} | Approx. ${property.lot_size_sqft?.toLocaleString() ?? 'unknown'} sq ft

SERVICES
${serviceList}

Scheduled Date: ${job.preferred_date ?? 'Flexible'}
${job.description ? `Details: ${job.description}` : ''}

FEES
Service price:      ${totalFmt}
Customer total:     ${customerTotalFmt}  (includes 4% platform booking fee)
Provider payout:    ${providerPayoutFmt} (after 8% platform commission)

TERMS & CONDITIONS
1. Provider guarantees completion of all listed services on the scheduled date or a mutually agreed alternative.
2. Customer agrees to provide reasonable access to the property.
3. Provider is an independent contractor. CutCrew is a technology platform only and is not a party to the service.
4. Provider represents they carry valid general liability insurance of at least $1,000,000 per occurrence.
5. Payment is held in escrow by CutCrew and released to the provider upon Customer confirmation of completion, or automatically 48 hours after job status is set to in_progress.
6. Disputes must be filed within 48 hours of job completion through the CutCrew platform.
7. Either party may cancel up to 24 hours before the scheduled date without penalty.
8. This agreement is governed by the laws of the state in which the property is located.

By signing below, both parties agree to these terms.`
}

export async function generateContractPdf({ terms, customerName, providerName }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 60
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - margin * 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CutCrew Service Agreement', margin, 60)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const lines = doc.splitTextToSize(terms, maxWidth)
  let y = 90
  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage()
      y = 60
    }
    doc.text(line, margin, y)
    y += 14
  }

  y += 30
  doc.setFont('helvetica', 'bold')
  doc.text('Customer Signature', margin, y)
  doc.text('Provider Signature', pageWidth / 2 + 20, y)
  doc.setFont('helvetica', 'normal')
  y += 20
  doc.text(`${customerName} — accepted electronically`, margin, y)
  doc.text(`${providerName} — accepted electronically`, pageWidth / 2 + 20, y)

  return doc.output('blob')
}

export async function hashTerms(terms) {
  const encoder = new TextEncoder()
  const data = encoder.encode(terms)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
