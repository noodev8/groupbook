'use client';

/*
=======================================================================================================================================
Public Event Page
=======================================================================================================================================
Purpose: Public-facing page for guests to view event details and join.
         Accessible via shareable link without authentication.
=======================================================================================================================================
*/

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPublicEvent, addGuest, PublicEvent } from '@/lib/api';

export default function PublicEventPage() {
  const params = useParams();
  const linkToken = params.link_token as string;

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  // Fetch event details on mount
  useEffect(() => {
    if (linkToken) {
      fetchEvent();
    }
  }, [linkToken]);

  const fetchEvent = async () => {
    setLoading(true);
    setError('');

    const result = await getPublicEvent(linkToken);

    if (result.success && result.data) {
      setEvent(result.data.event);
    } else {
      setError(result.error || 'Event not found');
    }

    setLoading(false);
  };

  // Handle guest registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      setSubmitError('Please enter your name');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const result = await addGuest(linkToken, guestName.trim());

    if (result.success) {
      setRegistered(true);
      setRegisteredName(guestName.trim());
      setGuestName('');
      // Refresh event to update guest count
      fetchEvent();
    } else {
      setSubmitError(result.error || 'Failed to register');
    }

    setSubmitting(false);
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if cutoff has passed
  const isCutoffPassed = () => {
    if (!event?.cutoff_datetime) return false;
    return new Date(event.cutoff_datetime) < new Date();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading event...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-500">
              This event link may be invalid or the event may have been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 mb-1">{event.restaurant_name}</p>
          <h1 className="text-2xl font-bold text-gray-900">{event.event_name}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Date & Time</dt>
              <dd className="text-gray-900 font-medium">{formatDateTime(event.event_date_time)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Venue</dt>
              <dd className="text-gray-900">{event.restaurant_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Guests Attending</dt>
              <dd className="text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {event.guest_count} {event.guest_count === 1 ? 'guest' : 'guests'}
                </span>
              </dd>
            </div>
            {event.cutoff_datetime && (
              <div>
                <dt className="text-sm text-gray-500">Registration Closes</dt>
                <dd className={`${isCutoffPassed() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDateTime(event.cutoff_datetime)}
                  {isCutoffPassed() && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Closed
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Join Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Join This Event</h2>

          {isCutoffPassed() ? (
            <div className="text-center py-4">
              <p className="text-gray-500">
                Registration for this event has closed.
              </p>
            </div>
          ) : registered ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                You&apos;re registered!
              </h3>
              <p className="text-gray-500">
                Thanks {registeredName}, you&apos;ve been added to the guest list.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
              </div>

              {submitError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding you to the list...' : 'Confirm Attendance'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
