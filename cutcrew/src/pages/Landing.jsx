import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const FEATURES = [
  { icon: '🌿', title: 'Mowing, Edging & More', desc: 'Residential and commercial. Mowing, weed eating, edging, and blowing on demand.' },
  { icon: '📋', title: 'Digital Contracts', desc: 'Auto-generated service agreement for every job. Both parties sign electronically before work begins.' },
  { icon: '🛡️', title: 'Insurance Verified', desc: 'Every provider must upload a valid Certificate of Insurance before taking jobs. Automatically flagged when it expires.' },
  { icon: '🔒', title: 'Escrow Payments', desc: 'Your money is held safely until you confirm the job is complete. Providers get paid the same day.' },
  { icon: '💰', title: 'Fair Fees for Both', desc: 'Customers pay a 4% booking fee. Providers pay 8% commission — less than half of competitors.' },
  { icon: '📊', title: 'Bid Marketplace', desc: 'Post your job, get competing bids, and choose the best provider for the price.' },
]

const STEPS_CUSTOMER = [
  { n: '1', label: 'Post a job', desc: 'Describe what you need, set a date, and optionally set a budget.' },
  { n: '2', label: 'Review bids', desc: 'Verified, insured providers bid on your job. Pick the best offer.' },
  { n: '3', label: 'Pay securely', desc: 'Funds held in escrow. Released only when you confirm the work is done.' },
]

const STEPS_PROVIDER = [
  { n: '1', label: 'Create your profile', desc: 'Upload your COI and connect your bank via Stripe.' },
  { n: '2', label: 'Browse the job board', desc: 'See open jobs in your service area. Submit competitive bids.' },
  { n: '3', label: 'Get paid fast', desc: 'Payout same day once the customer confirms completion.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-700">CutCrew</span>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/register"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Lawn care, done right.
            <br /><span className="text-brand-600">On demand.</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            CutCrew connects residential and commercial property owners with verified, insured lawn care professionals. Post a job in minutes, get competitive bids, and pay securely.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register?role=customer"><Button size="lg">Post a job — free</Button></Link>
            <Link to="/register?role=provider"><Button size="lg" variant="secondary">Join as a provider</Button></Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">No subscription. 4% customer booking fee · 8% provider commission.</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Everything you need, built in</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-brand-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Customer */}
            <div>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-4">For Property Owners</p>
              <div className="space-y-5">
                {STEPS_CUSTOMER.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{s.n}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.label}</p>
                      <p className="text-sm text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link to="/register?role=customer"><Button>Post my first job</Button></Link>
              </div>
            </div>
            {/* Provider */}
            <div>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-4">For Lawn Care Pros</p>
              <div className="space-y-5">
                {STEPS_PROVIDER.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{s.n}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.label}</p>
                      <p className="text-sm text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link to="/register?role=provider"><Button variant="secondary">Join as a pro</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Why CutCrew vs. the competition</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Feature</th>
                  <th className="py-2 px-4 font-semibold text-brand-700">CutCrew</th>
                  <th className="py-2 px-4 font-medium text-gray-400">LawnStarter</th>
                  <th className="py-2 px-4 font-medium text-gray-400">GreenPal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Provider commission', '8%', '~20%', '~5%'],
                  ['Customer booking fee', '4%', 'None', 'None'],
                  ['Insurance verification', '✅ Built-in', '❌', '❌'],
                  ['Digital contracts', '✅ Per job', '❌', '❌'],
                  ['Escrow payments', '✅', '❌', '❌'],
                  ['Bid marketplace', '✅', '❌ Assigned', '✅'],
                  ['Commercial support', '✅', 'Limited', 'Limited'],
                ].map(([feat, cc, ls, gp]) => (
                  <tr key={feat}>
                    <td className="py-2.5 pr-4 text-gray-700">{feat}</td>
                    <td className="py-2.5 px-4 text-center font-medium text-brand-700">{cc}</td>
                    <td className="py-2.5 px-4 text-center text-gray-400">{ls}</td>
                    <td className="py-2.5 px-4 text-center text-gray-400">{gp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-brand-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-brand-100 mb-8 max-w-md mx-auto">Post your first job free. No subscription, no hidden fees.</p>
        <Link to="/register"><Button variant="secondary" size="lg">Create your account</Button></Link>
      </section>

      <footer className="py-8 text-center text-xs text-gray-400 border-t border-gray-100">
        <p>© {new Date().getFullYear()} CutCrew. All rights reserved. · <Link to="/login" className="underline">Sign in</Link></p>
      </footer>
    </div>
  )
}
