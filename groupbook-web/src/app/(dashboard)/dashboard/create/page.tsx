'use client';

/*
=======================================================================================================================================
Create Event Page
=======================================================================================================================================
Purpose: Form for restaurant staff to create a new group booking event.
=======================================================================================================================================
*/

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createEvent, getBillingStatus } from '@/lib/api';
import UpgradeModal from '@/components/UpgradeModal';

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [eventName, setEventName] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [cutoffDatetime, setCutoffDatetime] = useState('');
  const [partyLeadName, setPartyLeadName] = useState('');
  const [partyLeadEmail, setPartyLeadEmail] = useState('');
  const [partyLeadPhone, setPartyLeadPhone] = useState('');
  const [menuLink, setMenuLink] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Billing state
  const [checkingBilling, setCheckingBilling] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
        // If free user and already at limit, show upgrade modal
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Call the create event API
    const result = await createEvent({
      event_name: eventName,
      event_date_time: eventDateTime,
      cutoff_datetime: cutoffDatetime || undefined,
      party_lead_name: partyLeadName || undefined,
      party_lead_email: partyLeadEmail || undefined,
      party_lead_phone: partyLeadPhone || undefined,
      menu_link: menuLink || undefined,
    });

    if (result.success) {
      // Redirect to dashboard on success
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to create event');
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth or billing
  if (isLoading || checkingBilling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 text-slate-500">
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.push('/dashboard');
        }}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">Create New Event</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Event Details Section */}
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-slate-900">Event Details</h2>

              {/* Event Name - Full Width */}
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Event Name *
                </label>
                <input
                  id="eventName"
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                  placeholder="e.g. Sarah's Birthday Dinner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Event Date & Time */}
                <div>
                  <label htmlFor="eventDateTime" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Event Date & Time *
                  </label>
                  <input
                    id="eventDateTime"
                    type="datetime-local"
                    required
                    value={eventDateTime}
                    onChange={(e) => setEventDateTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                  />
                </div>

                {/* Cutoff Date & Time (Optional) */}
                <div>
                  <label htmlFor="cutoffDatetime" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Guest Cutoff <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="cutoffDatetime"
                    type="datetime-local"
                    value={cutoffDatetime}
                    onChange={(e) => setCutoffDatetime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    After this time, guests can&apos;t add themselves
                  </p>
                </div>
              </div>

              {/* Menu Link (Optional) - Full Width */}
              <div>
                <label htmlFor="menuLink" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Menu Link <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="menuLink"
                  type="url"
                  value={menuLink}
                  onChange={(e) => setMenuLink(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                  placeholder="https://yourrestaurant.com/menu"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Guests will see this link when adding their food order
                </p>
              </div>
            </div>

            {/* Party Lead Section */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-base font-semibold text-slate-900 mb-5">
                Party Lead <span className="text-slate-400 font-normal text-sm">(optional)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Party Lead Name */}
                <div>
                  <label htmlFor="partyLeadName" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Name
                  </label>
                  <input
                    id="partyLeadName"
                    type="text"
                    value={partyLeadName}
                    onChange={(e) => setPartyLeadName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                    placeholder="e.g. Sarah Jones"
                  />
                </div>

                {/* Party Lead Email */}
                <div>
                  <label htmlFor="partyLeadEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="partyLeadEmail"
                    type="email"
                    value={partyLeadEmail}
                    onChange={(e) => setPartyLeadEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                    placeholder="e.g. sarah@example.com"
                  />
                </div>

                {/* Party Lead Phone */}
                <div>
                  <label htmlFor="partyLeadPhone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    id="partyLeadPhone"
                    type="tel"
                    value={partyLeadPhone}
                    onChange={(e) => setPartyLeadPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                    placeholder="e.g. 07700 900123"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-slate-200">
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
