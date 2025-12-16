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
import { getEvent, listGuests, deleteEvent, toggleEventLock, sendEventInvite, updateEvent, Event, Guest } from '@/lib/api';

const MAX_NOTES_LENGTH = 500;

// Simple icon components for visual polish
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const NotesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UnlockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

export default function EventManagementPage() {
  const { user, isLoading, logout } = useAuth();
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
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [staffNotes, setStaffNotes] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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
      const notes = eventResult.data!.event.staff_notes || '';
      setStaffNotes(notes);
      setOriginalNotes(notes);

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

  // Handle send invite
  const handleSendInvite = async () => {
    if (!event?.party_lead_email) return;
    setIsSendingInvite(true);
    setError('');

    const result = await sendEventInvite(eventId);

    if (result.success) {
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 3000);
    } else {
      setError(result.error || 'Failed to send invitation');
    }
    setIsSendingInvite(false);
  };

  // Save notes to database
  const handleSaveNotes = async () => {
    if (!event) return;

    setIsSavingNotes(true);
    setError('');

    const result = await updateEvent({
      event_id: event.id,
      event_name: event.event_name,
      event_date_time: event.event_date_time,
      cutoff_datetime: event.cutoff_datetime,
      party_lead_name: event.party_lead_name,
      party_lead_email: event.party_lead_email,
      party_lead_phone: event.party_lead_phone,
      staff_notes: staffNotes.trim() || null,
    });

    if (result.success) {
      setOriginalNotes(staffNotes.trim());
    } else {
      setError(result.error || 'Failed to save notes');
    }
    setIsSavingNotes(false);
  };

  const notesHaveChanged = staffNotes.trim() !== originalNotes;

  // Show loading state while checking auth
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading event...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Show error state
  if (error && !event) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar with back link */}
          <div className="py-3 border-b border-slate-100">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Event title and actions */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 truncate">{event.event_name}</h1>
              {event.is_locked && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 flex-shrink-0">
                  <LockIcon />
                  Locked
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleToggleLock}
                disabled={isTogglingLock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {isTogglingLock ? '...' : event.is_locked ? <><UnlockIcon /> Unlock</> : <><LockIcon /> Lock</>}
              </button>
              <Link
                href={`/dashboard/event/${eventId}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Event Details Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarIcon />
              </div>
              <h2 className="font-semibold text-slate-900">Event Details</h2>
            </div>
            <div className="px-5 pb-5">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date & Time</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDateTime(event.event_date_time)}</dd>
                </div>
                {event.cutoff_datetime && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Guest Cutoff</dt>
                    <dd className="mt-1 text-sm text-slate-900">{formatDateTime(event.cutoff_datetime)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Party Lead Card */}
          {(event.party_lead_name || event.party_lead_email || event.party_lead_phone) && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UserIcon />
                </div>
                <h2 className="font-semibold text-slate-900">Party Lead</h2>
              </div>
              <div className="px-5 pb-5">
                <dl className="space-y-4">
                  {event.party_lead_name && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</dt>
                      <dd className="mt-1 text-sm text-slate-900">{event.party_lead_name}</dd>
                    </div>
                  )}
                  {event.party_lead_email && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</dt>
                      <dd className="mt-1 text-sm">
                        <a href={`mailto:${event.party_lead_email}`} className="text-blue-600 hover:text-blue-800 hover:underline break-all transition-colors">
                          {event.party_lead_email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {event.party_lead_phone && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</dt>
                      <dd className="mt-1 text-sm">
                        <a href={`tel:${event.party_lead_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                          {event.party_lead_phone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Shareable Link Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <LinkIcon />
              </div>
              <h2 className="font-semibold text-slate-900">Shareable Link</h2>
            </div>
            <div className="px-5 pb-5">
              <p className="text-sm text-slate-500 mb-3">
                Share this link with the organiser or guests:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareableLink()}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={copyLink}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                    linkCopied
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {event.party_lead_email && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSendInvite}
                    disabled={isSendingInvite}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {isSendingInvite ? 'Sending...' : inviteSent ? 'Sent!' : `Send to ${event.party_lead_email}`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Staff Notes Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <NotesIcon />
              </div>
              <h2 className="font-semibold text-slate-900">Staff Notes</h2>
            </div>
            <div className="px-5 pb-5">
              <p className="text-sm text-slate-500 mb-3">
                Internal notes visible only to staff (e.g., VIP, deposit paid).
              </p>
              <textarea
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
                placeholder="Add notes about this event..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-400">
                  {staffNotes.length}/{MAX_NOTES_LENGTH}
                </span>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || !notesHaveChanged}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    notesHaveChanged
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 shadow-lg shadow-violet-500/25'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSavingNotes ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Guest List */}
        <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UsersIcon />
                </div>
                <h2 className="font-semibold text-slate-900">Guests</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {guests.length}
                </span>
              </div>
              <Link
                href={`/dashboard/event/${eventId}/summary`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summary Report
              </Link>
            </div>
          </div>

          {guests.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <UsersIcon />
              </div>
              <p className="text-slate-600 font-medium">No guests yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Share the link above to invite guests
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {guests.map((guest, index) => (
                <li key={guest.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-900 font-medium">{guest.name}</span>
                  {guest.dietary_notes && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      {guest.dietary_notes}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
            <Link
              href={`/event/${event.link_token}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              View & Edit Orders
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Delete Event?</h3>
            <p className="text-sm text-slate-600 text-center mb-2">
              This will permanently delete <strong>{event.event_name}</strong> and all {guests.length} guest{guests.length !== 1 ? 's' : ''}.
            </p>
            <p className="text-sm text-red-600 text-center mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
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
