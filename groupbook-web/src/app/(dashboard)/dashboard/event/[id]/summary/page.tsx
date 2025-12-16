'use client';

/*
=======================================================================================================================================
Event Summary Report Page
=======================================================================================================================================
Purpose: Displays a printable summary report of event details and guest list with food orders.
         Features premium dark gradient header (hidden on print).
=======================================================================================================================================
*/

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEvent, listGuests, Event, Guest } from '@/lib/api';

// Print icon
const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

// Print styles for page margins
const printStyles = `
  @media print {
    @page {
      margin: 10mm;
    }
    .print-container {
      padding: 10mm !important;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

export default function EventSummaryPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        if (eventResult.return_code === 'UNAUTHORIZED') {
          logout();
          return;
        }
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
  }, [user, eventId, logout]);

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

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Show loading state
  if (isLoading || loading) {
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

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 print:hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Link href={`/dashboard/event/${eventId}`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Event
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
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
    <div className="min-h-screen bg-slate-900 print:bg-white">
      {/* Print page margin styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Premium Gradient Header - hidden when printing */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 print:hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Top Bar */}
          <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href={`/dashboard/event/${eventId}`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Event
            </Link>
          </div>

          {/* Title Section */}
          <div className="max-w-5xl mx-auto px-4 pt-8 pb-20 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <span className="text-violet-300 text-sm font-medium mb-4 block">Summary Report</span>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {event.event_name}
                </h1>
              </div>
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-base font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25 flex-shrink-0"
              >
                <PrintIcon />
                Print Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="bg-slate-100 min-h-screen -mt-16 pt-8 relative print:bg-white print:mt-0 print:pt-0">
        <main className="print-container relative z-10 max-w-5xl mx-auto px-4 pb-12 sm:px-6 lg:px-8 print:max-w-none print:px-0">
          {/* Event Header - shown on print */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 mb-6 print:shadow-none print:border-0 print:p-0 print:mb-4">
            <h2 className="text-2xl font-bold text-slate-900 print:text-xl">{event.event_name}</h2>
            <p className="text-slate-600 mt-1">{event.restaurant_name}</p>
            <p className="text-slate-600">{formatDateTime(event.event_date_time)}</p>
            {event.party_lead_name && (
              <p className="text-slate-600 mt-3">
                <span className="font-medium">Party Lead:</span> {event.party_lead_name}
                {event.party_lead_phone && ` · ${event.party_lead_phone}`}
              </p>
            )}
          </div>

          {/* Guest List */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden print:shadow-none print:border print:border-slate-300 print:rounded-lg">
            <div className="px-6 py-4 border-b border-slate-100 print:px-3 print:py-2">
              <h3 className="text-lg font-semibold text-slate-900 print:text-base">Guest List</h3>
            </div>
            {guests.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-slate-500">No guests have joined yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-3 print:py-2">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-3 print:py-2">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-3 print:py-2">
                        Food Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-3 print:py-2">
                        Dietary Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {guests.map((guest, index) => (
                      <tr key={guest.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-6 py-4 text-sm text-slate-500 print:px-3 print:py-2">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium print:px-3 print:py-2">
                          {guest.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 print:px-3 print:py-2">
                          {guest.food_order || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm print:px-3 print:py-2">
                          {guest.dietary_notes ? (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium print:bg-transparent print:border-0 print:px-0 print:text-slate-700">
                              {guest.dietary_notes}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer - visible on print */}
          <div className="text-center text-sm text-slate-400 mt-8 print:mt-4">
            Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </main>
      </div>
    </div>
  );
}
