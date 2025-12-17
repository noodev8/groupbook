'use client';

/*
=======================================================================================================================================
Dashboard Page
=======================================================================================================================================
Purpose: Main page for restaurant staff after login.
         Shows list of events and allows creating new ones.
         Features premium dark gradient header with light content area.
=======================================================================================================================================
*/

import { useEffect, useState, Suspense } from 'react';
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
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function DashboardContent() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [successMessage, setSuccessMessage] = useState('');

  // Fetch events on mount
  useEffect(() => {
    if (!user) return;

    listEvents().then((result) => {
      if (result.success && result.data) {
        setEvents(result.data.events);
      } else {
        setEventsError(result.error || 'Failed to load events');
      }
      setEventsLoading(false);
    });
  }, [user]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
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

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Premium Gradient Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        </div>

        {/* Header Content */}
        <div className="relative z-10">
          {/* Top Bar */}
          <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-white font-semibold text-lg hidden sm:block">Kitchen Ready</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/settings"
                  className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title="Settings"
                >
                  <SettingsIcon />
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="text-violet-300 text-sm font-medium mb-2">Welcome back</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {user.restaurant_name}
                </h1>
                <p className="text-slate-400">
                  {events.length === 0
                    ? 'Get started by creating your first event'
                    : `You have ${events.length} event${events.length === 1 ? '' : 's'}`
                  }
                </p>
              </div>
              <Link
                href="/dashboard/create"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-base font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25 flex-shrink-0"
              >
                <PlusIcon />
                Create Event
              </Link>
            </div>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 60V0C240 40 480 60 720 60C960 60 1200 40 1440 0V60H0Z" fill="#f1f5f9" />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pb-12 sm:px-6 lg:px-8 -mt-14">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-4 rounded-2xl text-sm flex justify-between items-center shadow-lg shadow-violet-500/25">
            <span className="font-medium">{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-white/70 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Error Message */}
        {eventsError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
            {eventsError}
          </div>
        )}

        {/* Events Section */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 rounded-xl">
                <CalendarIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Your Events</h2>
                <p className="text-sm text-slate-500">Manage your group bookings</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {eventsLoading && (
            <div className="p-12 text-center">
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
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-violet-500">
                <CalendarIcon />
              </div>
              <p className="text-slate-900 font-semibold text-xl mb-2">No events yet</p>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Create your first group booking to start managing guest lists
              </p>
              <Link
                href="/dashboard/create"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
              >
                <PlusIcon />
                Create Your First Event
              </Link>
            </div>
          )}

          {/* Events List */}
          {!eventsLoading && events.length > 0 && (
            <div className="divide-y divide-slate-100">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/event/${event.id}`}
                  className="block p-5 sm:p-6 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-violet-500/20">
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <UsersIcon />
                        {event.guest_count || 0}
                      </span>
                      <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Support Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>
            Need help?{' '}
            <a href="mailto:noodev8@gmail.com" className="text-violet-500 hover:text-violet-700 transition-colors">
              noodev8@gmail.com
            </a>
            {' · '}
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="flex items-center gap-3 text-slate-400">
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
