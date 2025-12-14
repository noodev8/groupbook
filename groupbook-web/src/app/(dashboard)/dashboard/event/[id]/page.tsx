'use client';

/*
=======================================================================================================================================
Event Management Page
=======================================================================================================================================
Purpose: Displays event details, guest list, and shareable link for restaurant staff.
=======================================================================================================================================
*/

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEvent, listGuests, deleteEvent, toggleEventLock, Event, Guest } from '@/lib/api';

export default function EventManagementPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch event and guests when authenticated
  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setError('');

      // Fetch event details
      const eventResult = await getEvent(eventId);
      if (!eventResult.success) {
        setError(eventResult.error || 'Failed to load event');
        setLoading(false);
        return;
      }
      setEvent(eventResult.data!.event);

      // Fetch guests
      const guestsResult = await listGuests(eventId);
      if (guestsResult.success && guestsResult.data) {
        setGuests(guestsResult.data.guests);
      }

      setLoading(false);
    };

    if (user && eventId) {
      fetchEventData();
    }
  }, [user, eventId]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Generate the public shareable link
  const getShareableLink = () => {
    if (!event) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/event/${event.link_token}`;
  };

  // Copy link to clipboard
  const copyLink = async () => {
    const link = getShareableLink();
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Handle event deletion
  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteEvent(eventId);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to delete event');
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  // Handle lock toggle
  const handleToggleLock = async () => {
    if (!event) return;
    setIsTogglingLock(true);
    const result = await toggleEventLock(eventId, !event.is_locked);

    if (result.success && result.data) {
      setEvent({ ...event, is_locked: result.data.event.is_locked });
    } else {
      setError(result.error || 'Failed to update lock status');
    }
    setIsTogglingLock(false);
  };

  // Show loading state while checking auth
  if (isLoading || loading) {
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

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="text-sm md:text-base text-blue-600 hover:text-blue-800">
              &larr; Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-sm md:text-base">
            {error}
          </div>
        </main>
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
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <Link href="/dashboard" className="text-sm md:text-base text-blue-600 hover:text-blue-800 flex-shrink-0">
                &larr; Back
              </Link>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{event.event_name}</h1>
            </div>
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <button
                onClick={handleToggleLock}
                disabled={isTogglingLock}
                className="text-sm md:text-base text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
              >
                {isTogglingLock ? '...' : event.is_locked ? 'Unlock' : 'Lock'}
              </button>
              <Link
                href={`/dashboard/event/${eventId}/edit`}
                className="text-sm md:text-base text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm md:text-base text-red-600 hover:text-red-800 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {/* Event Details Card */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Event Details</h2>
              {event.is_locked && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  Locked
                </span>
              )}
            </div>
            <dl className="space-y-2 md:space-y-3">
              <div>
                <dt className="text-xs md:text-sm text-gray-500">Date & Time</dt>
                <dd className="text-sm md:text-base text-gray-900">{formatDateTime(event.event_date_time)}</dd>
              </div>
              {event.cutoff_datetime && (
                <div>
                  <dt className="text-xs md:text-sm text-gray-500">Guest Cutoff</dt>
                  <dd className="text-sm md:text-base text-gray-900">{formatDateTime(event.cutoff_datetime)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs md:text-sm text-gray-500">Restaurant</dt>
                <dd className="text-sm md:text-base text-gray-900">{event.restaurant_name}</dd>
              </div>
            </dl>
          </div>

          {/* Party Lead Card */}
          {(event.party_lead_name || event.party_lead_email || event.party_lead_phone) && (
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Party Lead</h2>
              <dl className="space-y-2 md:space-y-3">
                {event.party_lead_name && (
                  <div>
                    <dt className="text-xs md:text-sm text-gray-500">Name</dt>
                    <dd className="text-sm md:text-base text-gray-900">{event.party_lead_name}</dd>
                  </div>
                )}
                {event.party_lead_email && (
                  <div>
                    <dt className="text-xs md:text-sm text-gray-500">Email</dt>
                    <dd className="text-sm md:text-base text-gray-900">
                      <a href={`mailto:${event.party_lead_email}`} className="text-blue-600 hover:text-blue-800 break-all">
                        {event.party_lead_email}
                      </a>
                    </dd>
                  </div>
                )}
                {event.party_lead_phone && (
                  <div>
                    <dt className="text-xs md:text-sm text-gray-500">Phone</dt>
                    <dd className="text-sm md:text-base text-gray-900">
                      <a href={`tel:${event.party_lead_phone}`} className="text-blue-600 hover:text-blue-800">
                        {event.party_lead_phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Shareable Link Card */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Shareable Link</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-3">
              Share this link with the organiser or guests:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={getShareableLink()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-xs md:text-sm text-gray-600"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm flex-shrink-0"
              >
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Guest List */}
        <div className="mt-4 md:mt-6 bg-white rounded-lg shadow">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Guests</h2>
              <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                {guests.length} {guests.length === 1 ? 'guest' : 'guests'}
              </span>
            </div>
          </div>

          {guests.length === 0 ? (
            <div className="p-4 md:p-6 text-center">
              <p className="text-gray-500 text-sm md:text-base">No guests have joined yet.</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                Share the link above to invite guests.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {guests.map((guest, index) => (
                <li key={guest.id} className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3">
                  <span className="text-xs md:text-sm text-gray-400 w-5 md:w-6 flex-shrink-0">{index + 1}.</span>
                  <span className="text-sm md:text-base text-gray-900 truncate">{guest.name}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200">
            <Link
              href={`/event/${event.link_token}`}
              className="inline-flex items-center text-sm md:text-base text-blue-600 hover:text-blue-800 font-medium"
            >
              View &amp; Edit Orders →
            </Link>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete <strong>{event.event_name}</strong> and all {guests.length} guest{guests.length !== 1 ? 's' : ''}.
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
