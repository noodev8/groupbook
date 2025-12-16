'use client';

/*
=======================================================================================================================================
Dashboard Page
=======================================================================================================================================
Purpose: Main page for restaurant staff after login.
         Shows list of events and allows creating new ones.
=======================================================================================================================================
*/

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { listEvents, Event } from '@/lib/api';

// Icons
const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function DashboardContent() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle billing redirect params
  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      setSuccessMessage('Welcome to Kitchen Ready Pro! You can now create unlimited events.');
      // Clear the URL param
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');

    const result = await listEvents();

    if (result.success && result.data) {
      setEvents(result.data.events);
    } else {
      // If token is invalid/expired, logout and redirect to login
      if (result.return_code === 'UNAUTHORIZED') {
        logout();
        return;
      }
      setEventsError(result.error || 'Failed to load events');
    }

    setEventsLoading(false);
  }, [logout]);

  // Fetch events when user is authenticated
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

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

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with gradient accent */}
      <header className="bg-white border-b-2 border-transparent" style={{ borderImage: 'linear-gradient(to right, #8b5cf6, #d946ef) 1' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
              <span className="text-white font-bold">K</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Kitchen Ready</h1>
              <p className="text-sm text-slate-500 truncate">{user.restaurant_name}</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/settings"
              className="text-sm text-slate-600 hover:text-violet-600 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="text-sm text-slate-600 hover:text-violet-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-3 rounded-xl text-sm flex justify-between items-center shadow-lg shadow-violet-500/25">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your Events</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your group bookings</p>
          </div>
          <Link
            href="/dashboard/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
          >
            <PlusIcon />
            Create New Event
          </Link>
        </div>

        {/* Error Message */}
        {eventsError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {eventsError}
          </div>
        )}

        {/* Loading State */}
        {eventsLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-slate-500">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading events...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!eventsLoading && events.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-violet-500">
              <CalendarIcon />
            </div>
            <p className="text-slate-900 font-semibold text-lg">No events yet</p>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Create your first group booking to get started
            </p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
            >
              <PlusIcon />
              Create Your First Event
            </Link>
          </div>
        )}

        {/* Events List */}
        {!eventsLoading && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/event/${event.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 hover:shadow-md hover:shadow-violet-500/5 hover:border-violet-200 transition-all group"
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                      <CalendarIcon />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 truncate group-hover:text-violet-600 transition-colors">
                        {event.event_name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatDateTime(event.event_date_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700">
                      <UsersIcon />
                      {event.guest_count || 0} guests
                    </span>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Support Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>
            Need help?{' '}
            <a href="mailto:noodev8@gmail.com" className="text-violet-500 hover:text-violet-700 transition-colors">
              noodev8@gmail.com
            </a>
            {' | '}
            <a href="tel:07818443886" className="text-violet-500 hover:text-violet-700 transition-colors">
              07818 443886
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
