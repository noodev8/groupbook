'use client';

/*
=======================================================================================================================================
Edit Event Page
=======================================================================================================================================
Purpose: Form for restaurant staff to edit an existing group booking event.
         Features premium dark gradient header matching dashboard design.
=======================================================================================================================================
*/

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { updateEvent, getEvent, Event } from '@/lib/api';

// Icons
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function EditEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.id);

  // Event state
  const [event, setEvent] = useState<Event | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [eventName, setEventName] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [cutoffDatetime, setCutoffDatetime] = useState('');
  const [partyLeadName, setPartyLeadName] = useState('');
  const [partyLeadEmail, setPartyLeadEmail] = useState('');
  const [partyLeadPhone, setPartyLeadPhone] = useState('');
  const [menuLink, setMenuLink] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Fetch event on mount
  useEffect(() => {
    if (!user || !eventId) return;

    getEvent(eventId).then((result) => {
      if (result.success && result.data) {
        setEvent(result.data.event);
      } else {
        setEventError(result.error || 'Failed to load event');
      }
      setLoading(false);
    });
  }, [user, eventId]);

  const formatDateTimeForInput = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Sync form state from event data (only once when event loads)
  useEffect(() => {
    if (event && !formInitialized) {
      setEventName(event.event_name);
      setEventDateTime(formatDateTimeForInput(event.event_date_time));
      setCutoffDatetime(event.cutoff_datetime ? formatDateTimeForInput(event.cutoff_datetime) : '');
      setPartyLeadName(event.party_lead_name || '');
      setPartyLeadEmail(event.party_lead_email || '');
      setPartyLeadPhone(event.party_lead_phone || '');
      setMenuLink(event.menu_link || '');
      setFormInitialized(true);
    }
  }, [event, formInitialized]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Combine errors
  const displayError = eventError || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await updateEvent({
      event_id: eventId,
      event_name: eventName,
      event_date_time: eventDateTime,
      cutoff_datetime: cutoffDatetime || null,
      party_lead_name: partyLeadName || null,
      party_lead_email: partyLeadEmail || null,
      party_lead_phone: partyLeadPhone || null,
      menu_link: menuLink || null,
    });

    if (result.success) {
      router.push(`/dashboard/event/${eventId}`);
    } else {
      setError(result.error || 'Failed to update event');
      setIsSubmitting(false);
    }
  };

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Premium Gradient Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Top Bar */}
          <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href={`/dashboard/event/${eventId}`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Event
            </Link>
          </div>

          {/* Title Section */}
          <div className="max-w-4xl mx-auto px-4 pt-8 pb-20 sm:px-6 lg:px-8">
            <span className="text-violet-300 text-sm font-medium mb-4 block">Editing</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {eventName || 'Edit Event'}
            </h1>
          </div>
        </div>
      </header>

      {/* Content Area with light background */}
      <div className="bg-slate-100 min-h-screen -mt-16 pt-8 relative">
        <main className="relative z-10 max-w-4xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {displayError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
                {displayError}
              </div>
            )}

            {/* Event Details Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-6">
              <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
                <div className="p-3 bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 rounded-xl">
                  <CalendarIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Event Details</h2>
                  <p className="text-sm text-slate-500">Basic information about the event</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Event Name */}
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-2">
                    Event Name
                  </label>
                  <input
                    id="eventName"
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                    placeholder="e.g. Sarah's Birthday Dinner"
                  />
                </div>

                {/* Event Date & Time */}
                <div>
                  <label htmlFor="eventDateTime" className="block text-sm font-medium text-slate-700 mb-2">
                    Event Date & Time
                  </label>
                  <input
                    id="eventDateTime"
                    type="datetime-local"
                    required
                    value={eventDateTime}
                    onChange={(e) => setEventDateTime(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Guest Settings Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-6">
              <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
                <div className="p-3 bg-gradient-to-br from-fuchsia-100 to-pink-100 text-fuchsia-600 rounded-xl">
                  <UsersIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Guest Settings</h2>
                  <p className="text-sm text-slate-500">Configure how guests interact with the booking</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Cutoff Date & Time */}
                <div>
                  <label htmlFor="cutoffDatetime" className="block text-sm font-medium text-slate-700 mb-2">
                    Registration Cutoff <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="cutoffDatetime"
                    type="datetime-local"
                    value={cutoffDatetime}
                    onChange={(e) => setCutoffDatetime(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-shadow"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    After this time, guests will not be able to join, exit or change food options
                  </p>
                </div>

                {/* Menu Link */}
                <div>
                  <label htmlFor="menuLink" className="block text-sm font-medium text-slate-700 mb-2">
                    Menu Link <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="menuLink"
                    type="url"
                    value={menuLink}
                    onChange={(e) => setMenuLink(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-shadow"
                    placeholder="https://yourrestaurant.com/menu"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    Guests can view your menu to help them decide what to order
                  </p>
                </div>
              </div>
            </div>

            {/* Party Lead Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-8">
              <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
                <div className="p-3 bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 rounded-xl">
                  <UserIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Party Lead</h2>
                  <p className="text-sm text-slate-500">Contact details for the event organiser</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-3">
                  {/* Party Lead Name */}
                  <div>
                    <label htmlFor="partyLeadName" className="block text-sm font-medium text-slate-700 mb-2">
                      Name
                    </label>
                    <input
                      id="partyLeadName"
                      type="text"
                      value={partyLeadName}
                      onChange={(e) => setPartyLeadName(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow"
                      placeholder="e.g. Sarah Jones"
                    />
                  </div>

                  {/* Party Lead Email */}
                  <div>
                    <label htmlFor="partyLeadEmail" className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      id="partyLeadEmail"
                      type="email"
                      value={partyLeadEmail}
                      onChange={(e) => setPartyLeadEmail(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow"
                      placeholder="sarah@example.com"
                    />
                  </div>

                  {/* Party Lead Phone */}
                  <div>
                    <label htmlFor="partyLeadPhone" className="block text-sm font-medium text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      id="partyLeadPhone"
                      type="tel"
                      value={partyLeadPhone}
                      onChange={(e) => setPartyLeadPhone(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow"
                      placeholder="07700 900123"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-4">
              <Link
                href={`/dashboard/event/${eventId}`}
                className="flex-1 py-4 px-6 border border-slate-200 rounded-xl text-base font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
