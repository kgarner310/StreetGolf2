import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const STEPS = [
  { n: '1', title: 'Post coverage needed', desc: 'Sick day, vacation, overbooked? Post what you need covered — ZIP, date, services, and pay rate. Takes 2 minutes.' },
  { n: '2', title: 'Fill-in signs non-solicitation', desc: 'Before they see your address or client notes, they sign a legally binding non-solicitation agreement. Your client relationship stays yours.' },
  { n: '3', title: 'Job gets covered', desc: 'Fill-in shows up, does the work. You get notified. Your client never misses a cut — and never knows the difference.' },
  { n: '4', title: 'Pay through escrow', desc: 'You fund the job upfront. Fill-in gets paid when you confirm completion. No Venmo, no awkward invoices.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold tracking-tight">SubRoute</span>
            <span className="ml-2 text-xs text-slate-500 font-medium uppercase tracking-widest">B2B</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">Sign in</Button></Link>
            <Link to="/register"><Button variant="accent" size="sm">Get started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
            Pro-to-pro. B2B only. No consumers.
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            When you can't run<br />
            <span className="text-brand-400">your route,</span><br />
            someone else does.
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto">
            SubRoute is the coverage network for lawn care businesses. Post your jobs when you're sick, on vacation, or overbooked. Verified pros cover for you — under a signed non-solicitation agreement.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register?role=primary"><Button variant="accent" size="lg">I need coverage</Button></Link>
            <Link to="/register?role=fillin"><Button variant="secondary" size="lg">I can fill in</Button></Link>
          </div>
          <p className="mt-4 text-xs text-slate-600">Both sides must be licensed, insured businesses. No individual operators.</p>
        </div>
      </section>

      {/* The non-solicitation angle */}
      <section className="py-16 px-4 bg-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-3">Your clients stay yours.</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Before any fill-in contractor sees your property address, gate code, or client notes — they sign a legally binding non-solicitation agreement. 24-month non-compete. SHA-256 hashed for integrity. Violation is an enforceable breach of contract.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 p-5 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm font-bold">{s.n}</div>
                <div>
                  <p className="font-semibold text-white mb-1">{s.title}</p>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-slate-800 border-t border-slate-700">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Simple pricing</h2>
          <p className="text-slate-400 mb-8">Primary contractor pays a 10% platform fee on each coverage job. Fill-in pays nothing — they keep 100% of the agreed pay rate.</p>
          <div className="bg-slate-900 rounded-2xl p-6 text-left space-y-3">
            {[
              ['Agreed pay rate', '$100'],
              ['Platform fee (10%)', '+$10'],
              ['Primary contractor pays', '$110'],
              ['Fill-in contractor receives', '$100'],
            ].map(([label, val], i) => (
              <div key={label} className={`flex justify-between text-sm ${i === 2 ? 'border-t border-slate-700 pt-3 font-bold' : ''} ${i === 3 ? 'text-brand-400' : 'text-slate-300'}`}>
                <span>{label}</span><span>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center border-t border-slate-800">
        <h2 className="text-3xl font-bold mb-3">Stop losing clients when life happens.</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Join the coverage network built for lawn care professionals, by lawn care professionals.</p>
        <Link to="/register"><Button variant="accent" size="lg">Create your account free</Button></Link>
      </section>

      <footer className="py-8 text-center text-xs text-slate-600 border-t border-slate-800">
        © {new Date().getFullYear()} SubRoute · Pro coverage network for lawn care businesses
      </footer>
    </div>
  )
}
