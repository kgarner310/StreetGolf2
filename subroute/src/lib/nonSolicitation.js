import { jsPDF } from 'jspdf'

export function buildNonSolicitationTerms({ job, primaryBusiness, fillinBusiness, fillinOwner }) {
  const serviceList = (job.services ?? [])
    .map((s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(', ')

  return `SUBROUTE NON-SOLICITATION AGREEMENT

Date: ${new Date().toLocaleDateString()}
Agreement ID: ${job.id.slice(0, 8).toUpperCase()}

PARTIES
Primary Contractor:  ${primaryBusiness}
Fill-in Contractor:  ${fillinBusiness} (${fillinOwner})

COVERAGE JOB
Location:   ${job.city}, ${job.state} ${job.zip_code}
Date:       ${job.coverage_date}
Services:   ${serviceList}
Properties: ${job.property_count} stop${job.property_count !== 1 ? 's' : ''}

AGREEMENT

In consideration of receiving access to the specific property addresses, gate codes,
and client instructions for the above coverage job, the Fill-in Contractor agrees:

1. NON-SOLICITATION
   Fill-in Contractor shall not, directly or indirectly, solicit, contact, accept
   business from, or establish any service relationship with the clients or property
   owners encountered during this coverage assignment for a period of 24 months
   following the coverage date.

2. CONFIDENTIALITY
   All property addresses, client names, gate codes, and operational details disclosed
   after signing this agreement are strictly confidential. Fill-in Contractor shall
   not share this information with any third party.

3. CLIENT RELATIONSHIP OWNERSHIP
   The Primary Contractor retains full ownership of the client relationship. This
   coverage assignment does not create any right, interest, or claim by the Fill-in
   Contractor over any property or client.

4. CONDUCT
   Fill-in Contractor agrees to perform services in a professional manner and
   represent the Primary Contractor's business standards to any property owner
   they encounter.

5. REMEDIES
   Breach of this agreement entitles the Primary Contractor to seek injunctive relief
   and damages. The prevailing party in any dispute shall be entitled to attorney's fees.

6. GOVERNING LAW
   This agreement is governed by the laws of the state of ${job.state}.

By signing electronically, Fill-in Contractor acknowledges they have read, understood,
and agree to be bound by these terms.`
}

export async function hashTerms(terms) {
  const data = new TextEncoder().encode(terms)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function generateAgreementPdf({ terms, fillinName, primaryName }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 60
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('SubRoute Non-Solicitation Agreement', margin, 60)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(terms, maxWidth)
  let y = 90
  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); y = 60 }
    doc.text(line, margin, y)
    y += 14
  }

  y += 30
  doc.setFont('helvetica', 'bold')
  doc.text('Signed electronically by:', margin, y)
  y += 18
  doc.setFont('helvetica', 'normal')
  doc.text(`${fillinName} (Fill-in Contractor)`, margin, y)
  y += 14
  doc.text(`Accepted terms on ${new Date().toLocaleString()}`, margin, y)

  return doc.output('blob')
}

export function buildCoverageContractTerms({ job, contract, primaryProfile, fillinProfile }) {
  const serviceList = (job.services ?? [])
    .map((s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(', ')

  return `SUBROUTE COVERAGE SERVICE CONTRACT

Date: ${new Date().toLocaleDateString()}

PARTIES
Primary Contractor:  ${primaryProfile.business_name}
Fill-in Contractor:  ${fillinProfile.business_name}

JOB DETAILS
Location:   ${job.full_address ?? `${job.city}, ${job.state} ${job.zip_code}`}
Date:       ${job.coverage_date}${job.time_window ? ` · ${job.time_window}` : ''}
Services:   ${serviceList}
Properties: ${job.property_count} stop${job.property_count !== 1 ? 's' : ''}
Est. hours: ${job.estimated_hours ?? 'TBD'}

PAYMENT
Fill-in receives:  $${Number(contract.agreed_pay).toFixed(2)}
Platform fee:      $${Number(contract.platform_fee).toFixed(2)} (10%)
Primary pays:      $${Number(contract.primary_total).toFixed(2)}

Payment is held in escrow and released to the fill-in contractor upon the primary
contractor confirming satisfactory completion, or automatically 24 hours after
the coverage date if no dispute is filed.

TERMS
1. Fill-in Contractor is an independent contractor, not an employee.
2. Fill-in Contractor must carry valid general liability insurance during the job.
3. A separate Non-Solicitation Agreement is in effect for all properties covered.
4. Cancellations within 12 hours of the job forfeit escrow deposit.
5. Quality disputes must be filed within 24 hours of job completion.

Both parties agree to these terms by electronic signature below.`
}
