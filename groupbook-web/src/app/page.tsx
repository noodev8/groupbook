'use client';

/*
=======================================================================================================================================
Landing Page
=======================================================================================================================================
Purpose: Marketing landing page for Kitchen Ready - converts visitors to signups.
=======================================================================================================================================
*/

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Icon components
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                <span className="text-white font-bold">K</span>
              </div>
              <span className="font-semibold text-white text-lg">Kitchen Ready</span>
            </div>
            <nav className="flex items-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
                  >
                    It's Free
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />

        {/* Decorative blobs */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-slate-300 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              For restaurants with group bookings
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
              Guest lists,{' '}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                sorted
              </span>
            </h1>

            <p className="mt-6 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Save hours on group booking coordination and avoid the chaos.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition-all shadow-xl shadow-violet-500/25"
              >
                Get Started
                <ArrowRightIcon />
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Always free for one active booking
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="relative py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Create', desc: 'Add your group event', color: 'from-violet-500 to-violet-600' },
              { num: '2', title: 'Share', desc: 'Send the link', color: 'from-fuchsia-500 to-fuchsia-600' },
              { num: '3', title: 'Collect', desc: 'Guests add themselves', color: 'from-pink-500 to-pink-600' },
              { num: '4', title: 'Done', desc: 'Print for the kitchen', color: 'from-violet-500 to-violet-600' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                  {step.num}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Clean Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Everything you need
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'One link per booking', desc: 'Share once. Done.' },
              { title: 'Food orders & dietary', desc: 'All in one place.' },
              { title: 'Auto cutoff', desc: 'Form closes on deadline.' },
              { title: 'Lock anytime', desc: 'No last-minute surprises.' },
              { title: 'Kitchen summary', desc: 'Print-ready report.' },
              { title: 'Your branding', desc: 'Logo & hero image.' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white mb-4">
                  <CheckIcon />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">{feature.title}</h3>
                <p className="mt-1 text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Two Cards */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Simple pricing
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="p-8 rounded-3xl border-2 border-slate-200 bg-white">
              <h3 className="text-xl font-semibold text-slate-900">Free</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold text-slate-900">£0</span>
              </div>
              <ul className="mt-8 space-y-4">
                {['1 active event', 'Unlimited guests', 'All features'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <CheckIcon />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full py-3 text-center border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-xl shadow-violet-500/25">
              <div className="absolute -top-3 right-8">
                <span className="px-3 py-1 bg-emerald-400 text-emerald-950 text-xs font-bold rounded-full uppercase">
                  Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">£35</span>
                <span className="text-white/70">/mo</span>
              </div>
              <p className="mt-1 text-white/70 text-sm">or £299/year (save 29%)</p>
              <ul className="mt-8 space-y-4">
                {['Unlimited events', 'Unlimited guests', 'Priority support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/90">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckIcon />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full py-3 text-center bg-white text-violet-600 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to ditch the spreadsheets?
          </h2>
          <p className="mt-4 text-xl text-white/80">
            Join restaurants already saving hours on group bookings.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center px-8 py-4 bg-white text-violet-600 rounded-xl text-lg font-semibold hover:bg-white/90 transition-all shadow-xl"
          >
            Get Started Free
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-semibold text-white">Kitchen Ready</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <a href="mailto:noodev8@gmail.com" className="hover:text-white transition-colors">
                noodev8@gmail.com
              </a>
              <a href="tel:07818443886" className="hover:text-white transition-colors">
                07818 443886
              </a>
              <a href="https://noodev8.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="https://noodev8.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Kitchen Ready by{' '}
              <a href="https://noodev8.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                noodev8
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
