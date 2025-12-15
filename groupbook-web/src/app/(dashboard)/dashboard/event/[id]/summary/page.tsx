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
        <header className="bg-white shadow print:hidden">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href={`/dashboard/event/${eventId}`} className="text-sm md:text-base text-blue-600 hover:text-blue-800">
              &larr; Back to Event
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

  const guestsWithDietary = guests.filter(g => g.dietary_notes && g.dietary_notes.trim()).length;
  const guestsWithOrders = guests.filter(g => g.food_order && g.food_order.trim()).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Print page margin styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Header - hidden when printing */}
      <header className="bg-white shadow print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <Link href={`/dashboard/event/${eventId}`} className="text-sm md:text-base text-blue-600 hover:text-blue-800">
              &larr; Back to Event
            </Link>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
            >
              Print Report
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="print-container max-w-4xl mx-auto px-4 py-6 md:py-8 sm:px-6 lg:px-8 print:max-w-none">
        {/* Event Header */}
        <div className="mb-6 print:mb-4">
          <h1 className="text-2xl font-bold text-gray-900 print:text-xl">{event.event_name}</h1>
          <p className="text-gray-600 mt-1">{event.restaurant_name}</p>
          <p className="text-gray-600">{formatDateTime(event.event_date_time)}</p>
          {event.party_lead_name && (
            <p className="text-gray-600 mt-2">
              <span className="font-medium">Party Lead:</span> {event.party_lead_name}
              {event.party_lead_phone && ` - ${event.party_lead_phone}`}
            </p>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 print:mb-4 print:gap-2">
          <div className="bg-gray-50 rounded-lg p-4 text-center print:bg-gray-100 print:p-2">
            <div className="text-3xl font-bold text-gray-900 print:text-2xl">{guests.length}</div>
            <div className="text-sm text-gray-600">Total Guests</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center print:bg-gray-100 print:p-2">
            <div className="text-3xl font-bold text-gray-900 print:text-2xl">{guestsWithOrders}</div>
            <div className="text-sm text-gray-600">Food Orders</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center print:bg-gray-100 print:p-2">
            <div className="text-3xl font-bold text-gray-900 print:text-2xl">{guestsWithDietary}</div>
            <div className="text-sm text-gray-600">Dietary Notes</div>
          </div>
        </div>

        {/* Guest List */}
        <div className="mb-6 print:mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Guest List</h2>
          {guests.length === 0 ? (
            <p className="text-gray-500 text-sm">No guests have joined yet.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden print:border-gray-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
                      Food Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
                      Dietary Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guests.map((guest, index) => (
                    <tr key={guest.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-500 print:px-2 print:py-1">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium print:px-2 print:py-1">
                        {guest.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 print:px-2 print:py-1">
                        {guest.food_order || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 print:px-2 print:py-1">
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
        <div className="text-center text-xs text-gray-400 mt-8 print:mt-4">
          Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </main>
    </div>
  );
}
