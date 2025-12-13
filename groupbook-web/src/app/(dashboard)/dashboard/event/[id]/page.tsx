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
import { getEvent, listGuests, Event, Guest } from '@/lib/api';

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch event and guests when authenticated
  useEffect(() => {
    if (user && eventId) {
      fetchEventData();
    }
  }, [user, eventId]);

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

  // Show loading state while checking auth
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
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
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              &larr; Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
                &larr; Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{event.event_name}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Event Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Date & Time</dt>
                <dd className="text-gray-900">{formatDateTime(event.event_date_time)}</dd>
              </div>
              {event.cutoff_datetime && (
                <div>
                  <dt className="text-sm text-gray-500">Guest Cutoff</dt>
                  <dd className="text-gray-900">{formatDateTime(event.cutoff_datetime)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Restaurant</dt>
                <dd className="text-gray-900">{event.restaurant_name}</dd>
              </div>
            </dl>
          </div>

          {/* Party Lead Card */}
          {(event.party_lead_name || event.party_lead_email || event.party_lead_phone) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Party Lead</h2>
              <dl className="space-y-3">
                {event.party_lead_name && (
                  <div>
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="text-gray-900">{event.party_lead_name}</dd>
                  </div>
                )}
                {event.party_lead_email && (
                  <div>
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="text-gray-900">
                      <a href={`mailto:${event.party_lead_email}`} className="text-blue-600 hover:text-blue-800">
                        {event.party_lead_email}
                      </a>
                    </dd>
                  </div>
                )}
                {event.party_lead_phone && (
                  <div>
                    <dt className="text-sm text-gray-500">Phone</dt>
                    <dd className="text-gray-900">
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shareable Link</h2>
            <p className="text-sm text-gray-500 mb-3">
              Share this link with the organiser or guests:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={getShareableLink()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
              >
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Guest List */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Guest List</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {guests.length} {guests.length === 1 ? 'guest' : 'guests'}
              </span>
            </div>
          </div>

          {guests.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No guests have joined yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Share the link above to invite guests.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {guests.map((guest, index) => (
                <li key={guest.id} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400 w-8">{index + 1}.</span>
                    <span className="text-gray-900">{guest.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(guest.created_at).toLocaleDateString('en-GB')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
