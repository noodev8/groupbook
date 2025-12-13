'use client';

/*
=======================================================================================================================================
Dashboard Page
=======================================================================================================================================
Purpose: Main page for restaurant staff after login.
         Shows list of events and allows creating new ones.
=======================================================================================================================================
*/

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { listEvents, Event } from '@/lib/api';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch events when user is authenticated
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    setEventsLoading(true);
    setEventsError('');

    const result = await listEvents();

    if (result.success && result.data) {
      setEvents(result.data.events);
    } else {
      setEventsError(result.error || 'Failed to load events');
    }

    setEventsLoading(false);
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.restaurant_name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Actions */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Your Events</h2>
          <Link
            href="/dashboard/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Event
          </Link>
        </div>

        {/* Error Message */}
        {eventsError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {eventsError}
          </div>
        )}

        {/* Loading State */}
        {eventsLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Loading events...</p>
          </div>
        )}

        {/* Empty State */}
        {!eventsLoading && events.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t created any events yet.</p>
            <p className="text-sm text-gray-400">
              Click &quot;Create New Event&quot; to set up your first group booking.
            </p>
          </div>
        )}

        {/* Events List */}
        {!eventsLoading && events.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {events.map((event) => (
                <li key={event.id} className="p-4 hover:bg-gray-50">
                  <Link href={`/dashboard/event/${event.id}`} className="block">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {event.event_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(event.event_date_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {event.guest_count || 0} guests
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
