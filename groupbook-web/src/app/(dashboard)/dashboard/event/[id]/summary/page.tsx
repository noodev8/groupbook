'use client';

/*
=======================================================================================================================================
Event Summary Report Page
=======================================================================================================================================
Purpose: Displays a printable summary report of event details and guest list with food orders.
=======================================================================================================================================
*/

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEvent, listGuests, Event, Guest } from '@/lib/api';

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

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 print:hidden">
          <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href={`/dashboard/event/${eventId}`} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              ← Back to Event
            </Link>
          </div>
        </header>
        <main className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const guestsWithDietary = guests.filter(g => g.dietary_notes && g.dietary_notes.trim()).length;
  const guestsWithOrders = guests.filter(g => g.food_order && g.food_order.trim()).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Print page margin styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Header - hidden when printing */}
      <header className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href={`/dashboard/event/${eventId}`} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                ← Back to Event
              </Link>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">Summary Report</h1>
            </div>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Print Report
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="print-container max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 print:max-w-none">
        {/* Event Header */}
        <div className="mb-8 print:mb-4">
          <h2 className="text-2xl font-semibold text-slate-900 print:text-xl">{event.event_name}</h2>
          <p className="text-slate-600 mt-1">{event.restaurant_name}</p>
          <p className="text-slate-600">{formatDateTime(event.event_date_time)}</p>
          {event.party_lead_name && (
            <p className="text-slate-600 mt-2">
              <span className="font-medium">Party Lead:</span> {event.party_lead_name}
              {event.party_lead_phone && ` - ${event.party_lead_phone}`}
            </p>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 print:mb-4 print:gap-2">
          <div className="bg-slate-50 rounded-lg p-4 text-center print:bg-slate-100 print:p-2">
            <div className="text-3xl font-semibold text-slate-900 print:text-2xl">{guests.length}</div>
            <div className="text-sm text-slate-600">Total Guests</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center print:bg-slate-100 print:p-2">
            <div className="text-3xl font-semibold text-slate-900 print:text-2xl">{guestsWithOrders}</div>
            <div className="text-sm text-slate-600">Food Orders</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center print:bg-slate-100 print:p-2">
            <div className="text-3xl font-semibold text-slate-900 print:text-2xl">{guestsWithDietary}</div>
            <div className="text-sm text-slate-600">Dietary Notes</div>
          </div>
        </div>

        {/* Guest List */}
        <div className="mb-8 print:mb-4">
          <h3 className="text-base font-semibold text-slate-900 mb-4 print:text-base print:mb-2">Guest List</h3>
          {guests.length === 0 ? (
            <p className="text-slate-500 text-sm">No guests have joined yet.</p>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden print:shadow-none print:border print:border-slate-300">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-2 print:py-2">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-2 print:py-2">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-2 print:py-2">
                      Food Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-2 print:py-2">
                      Dietary Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {guests.map((guest, index) => (
                    <tr key={guest.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-sm text-slate-500 print:px-2 print:py-1">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium print:px-2 print:py-1">
                        {guest.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 print:px-2 print:py-1">
                        {guest.food_order || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 print:px-2 print:py-1">
                        {guest.dietary_notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer - visible on print */}
        <div className="text-center text-xs text-slate-400 mt-8 print:mt-4">
          Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </main>
    </div>
  );
}
