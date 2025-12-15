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
import { createEvent } from '@/lib/api';

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-500 text-sm md:text-base">Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/dashboard" className="text-sm md:text-base text-blue-600 hover:text-blue-800 flex-shrink-0">
              &larr; Back
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Create New Event</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 md:py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-sm md:text-base">
                {error}
              </div>
            )}

            {/* Event Name */}
            <div>
              <label htmlFor="eventName" className="block text-xs md:text-sm font-medium text-gray-700">
                Event Name
              </label>
              <input
                id="eventName"
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm md:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Sarah's Birthday Dinner"
              />
            </div>

            {/* Event Date & Time */}
            <div>
              <label htmlFor="eventDateTime" className="block text-xs md:text-sm font-medium text-gray-700">
                Event Date & Time
              </label>
              <input
                id="eventDateTime"
                type="datetime-local"
                required
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm md:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Cutoff Date & Time (Optional) */}
            <div>
              <label htmlFor="cutoffDatetime" className="block text-xs md:text-sm font-medium text-gray-700">
                Guest Cutoff Date & Time <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="cutoffDatetime"
                type="datetime-local"
                value={cutoffDatetime}
                onChange={(e) => setCutoffDatetime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm md:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                After this time, guests won&apos;t be able to add themselves
              </p>
            </div>

            {/* Menu Link (Optional) */}
            <div>
              <label htmlFor="menuLink" className="block text-xs md:text-sm font-medium text-gray-700">
                Menu Link <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="menuLink"
                type="url"
                value={menuLink}
                onChange={(e) => setMenuLink(e.target.value)}
                className="mt-1 block w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm md:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://yourrestaurant.com/menu"
              />
              <p className="mt-1 text-xs text-gray-500">
                Guests will see this link when adding their food order
              </p>
            </div>

            {/* Party Lead Section */}
            <div className="border-t border-gray-200 pt-4 md:pt-6">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-3 md:mb-4">
                Party Lead Details <span className="text-gray-400 font-normal">(optional)</span>
              </h3>

              <div className="space-y-3 md:space-y-4">
                {/* Party Lead Name */}
                <div>
                  <label htmlFor="partyLeadName" className="block text-xs md:text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    id="partyLeadName"
                    type="text"
                    value={partyLeadName}
                    onChange={(e) => setPartyLeadName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm md:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Sarah Jones"
                  />
                </div>

                {/* Party Lead Email */}
                <div>
                  <label htmlFor="partyLeadEmail" className="block text-xs md:text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="partyLeadEmail"
                    type="email"
                    value={partyLeadEmail}
                    onChange={(e) => setPartyLeadEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm md:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. sarah@example.com"
                  />
                </div>

                {/* Party Lead Phone */}
                <div>
                  <label htmlFor="partyLeadPhone" className="block text-xs md:text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    id="partyLeadPhone"
                    type="tel"
                    value={partyLeadPhone}
                    onChange={(e) => setPartyLeadPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm md:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 07700 900123"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 pt-4">
              <Link
                href="/dashboard"
                className="flex-1 py-2 md:py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 md:py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm md:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
