'use client';

/*
=======================================================================================================================================
Create Event Wizard
=======================================================================================================================================
Purpose: Multi-step wizard for restaurant staff to create a new group booking event.
         Features premium visuals with gradient backgrounds, progress indicator, and smooth transitions.
=======================================================================================================================================
*/

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createEvent, getBillingStatus } from '@/lib/api';
import UpgradeModal from '@/components/UpgradeModal';

// Form data interface
interface FormData {
  event_name: string;
  event_date_time: string;
  cutoff_datetime: string;
  menu_link: string;
  party_lead_name: string;
  party_lead_email: string;
  party_lead_phone: string;
}

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    event_name: '',
    event_date_time: '',
    cutoff_datetime: '',
    menu_link: '',
    party_lead_name: '',
    party_lead_email: '',
    party_lead_phone: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Billing state
  const [checkingBilling, setCheckingBilling] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Animation state for step transitions
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Check billing status on mount
  useEffect(() => {
    const checkBilling = async () => {
      const result = await getBillingStatus();
      if (result.success && result.data) {
        const { billing } = result.data;
        if (billing.event_limit !== null && billing.event_count >= billing.event_limit) {
          setShowUpgradeModal(true);
        }
      }
      setCheckingBilling(false);
    };

    if (user) {
      checkBilling();
    }
  }, [user]);

  // Update form data helper
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Step navigation with animation
  const goToStep = (newStep: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 150);
  };

  // Validate step 1 (required fields)
  const canProceedStep1 = () => {
    return formData.event_name.trim() !== '' && formData.event_date_time !== '';
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    const result = await createEvent({
      event_name: formData.event_name,
      event_date_time: formData.event_date_time,
      cutoff_datetime: formData.cutoff_datetime || undefined,
      party_lead_name: formData.party_lead_name || undefined,
      party_lead_email: formData.party_lead_email || undefined,
      party_lead_phone: formData.party_lead_phone || undefined,
      menu_link: formData.menu_link || undefined,
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to create event');
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth or billing
  if (isLoading || checkingBilling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Step configuration
  const steps = [
    { number: 1, title: 'Event Details', subtitle: 'Name & Date' },
    { number: 2, title: 'Guest Settings', subtitle: 'Optional' },
    { number: 3, title: 'Party Lead', subtitle: 'Optional' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.push('/dashboard');
        }}
      />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-900/10 to-fuchsia-900/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex items-center justify-center gap-3">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    step > s.number
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                      : step === s.number
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white ring-4 ring-violet-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step > s.number ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.number
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${step >= s.number ? 'text-white' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${
                    step > s.number ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Step Content with Transition */}
        <div
          className={`transition-all duration-150 ${
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Step 1: Event Basics */}
          {step === 1 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">What&apos;s the occasion?</h1>
                <p className="text-slate-400">Let&apos;s start with the basics</p>
              </div>

              <div className="space-y-6">
                {/* Event Name */}
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-slate-300 mb-2">
                    Event Name
                  </label>
                  <input
                    id="eventName"
                    type="text"
                    value={formData.event_name}
                    onChange={(e) => updateField('event_name', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    placeholder="e.g. Sarah's Birthday Dinner"
                    autoFocus
                  />
                </div>

                {/* Event Date & Time */}
                <div>
                  <label htmlFor="eventDateTime" className="block text-sm font-medium text-slate-300 mb-2">
                    Event Date & Time
                  </label>
                  <input
                    id="eventDateTime"
                    type="datetime-local"
                    value={formData.event_date_time}
                    onChange={(e) => updateField('event_date_time', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
                <Link
                  href="/dashboard"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </Link>
                <button
                  onClick={() => goToStep(2)}
                  disabled={!canProceedStep1()}
                  className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Guest Settings */}
          {step === 2 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Set up your guests</h1>
                <p className="text-slate-400">These settings are optional - skip if you&apos;re not sure yet</p>
              </div>

              <div className="space-y-6">
                {/* Cutoff Date & Time */}
                <div>
                  <label htmlFor="cutoffDatetime" className="block text-sm font-medium text-slate-300 mb-2">
                    Guest Registration Cutoff <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="cutoffDatetime"
                    type="datetime-local"
                    value={formData.cutoff_datetime}
                    onChange={(e) => updateField('cutoff_datetime', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all [color-scheme:dark]"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    After this time, guests will not be able to join, exit or change food options
                  </p>
                </div>

                {/* Menu Link */}
                <div>
                  <label htmlFor="menuLink" className="block text-sm font-medium text-slate-300 mb-2">
                    Menu Link <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="menuLink"
                    type="url"
                    value={formData.menu_link}
                    onChange={(e) => updateField('menu_link', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                    placeholder="https://yourrestaurant.com/menu"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Guests can view your menu to help them decide what to order
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
                <button
                  onClick={() => goToStep(1)}
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => goToStep(3)}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => goToStep(3)}
                    className="px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-fuchsia-500/25"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Party Lead */}
          {step === 3 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Who&apos;s organising?</h1>
                <p className="text-slate-400">These details are optional - you can add them later</p>
              </div>

              <div className="space-y-6">
                {/* Party Lead Name */}
                <div>
                  <label htmlFor="partyLeadName" className="block text-sm font-medium text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    id="partyLeadName"
                    type="text"
                    value={formData.party_lead_name}
                    onChange={(e) => updateField('party_lead_name', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="e.g. Sarah Jones"
                  />
                </div>

                {/* Party Lead Email */}
                <div>
                  <label htmlFor="partyLeadEmail" className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    id="partyLeadEmail"
                    type="email"
                    value={formData.party_lead_email}
                    onChange={(e) => updateField('party_lead_email', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="e.g. sarah@example.com"
                  />
                </div>

                {/* Party Lead Phone */}
                <div>
                  <label htmlFor="partyLeadPhone" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    id="partyLeadPhone"
                    type="tel"
                    value={formData.party_lead_phone}
                    onChange={(e) => updateField('party_lead_phone', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="e.g. 07700 900123"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
                <button
                  onClick={() => goToStep(2)}
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/25"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
