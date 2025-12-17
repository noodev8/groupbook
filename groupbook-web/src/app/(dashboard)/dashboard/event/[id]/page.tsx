'use client';

/*
=======================================================================================================================================
Event Management Page
=======================================================================================================================================
Purpose: Displays event details, guest list, and shareable link for restaurant staff.
         Features premium dark gradient header matching dashboard design.
=======================================================================================================================================
*/

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { deleteEvent, toggleEventLock, sendEventInvite, updateEvent, getEvent, listGuests, Event, Guest } from '@/lib/api';

const MAX_NOTES_LENGTH = 500;

// Icon components
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

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function EventManagementPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.id);

  // Event and guests state
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [eventError, setEventError] = useState<string | null>(null);
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

  // Fetch event and guests on mount
  useEffect(() => {
    if (!user || !eventId) return;

    Promise.all([
      getEvent(eventId),
      listGuests(eventId),
    ]).then(([eventResult, guestsResult]) => {
      if (eventResult.success && eventResult.data) {
        setEvent(eventResult.data.event);
      } else {
        setEventError(eventResult.error || 'Failed to load event');
      }
      if (guestsResult.success && guestsResult.data) {
        setGuests(guestsResult.data.guests);
      }
      setLoading(false);
    });
  }, [user, eventId]);

  // Sync staff notes from event data
  useEffect(() => {
    if (event) {
      const notes = event.staff_notes || '';
      setStaffNotes(notes);
      setOriginalNotes(notes);
    }
  }, [event]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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

  const getShareableLink = () => {
    if (!event) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/event/${event.link_token}`;
  };

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

  const handleToggleLock = async () => {
    if (!event) return;
    setIsTogglingLock(true);
    const result = await toggleEventLock(eventId, !event.is_locked);

    if (result.success && result.data) {
      // Update local state with new lock status
      setEvent({ ...event, is_locked: result.data.event.is_locked });
    } else {
      setError(result.error || 'Failed to update lock status');
    }
    setIsTogglingLock(false);
  };

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
      // Update local state with new event data
      if (result.data) {
        setEvent(result.data.event);
      }
    } else {
      setError(result.error || 'Failed to save notes');
    }
    setIsSavingNotes(false);
  };

  const notesHaveChanged = staffNotes.trim() !== originalNotes;

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading event...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Combined error from SWR and local state
  const displayError = eventError || error;

  // Error state (no event loaded)
  if (displayError && !event) {
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
            {displayError}
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
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
          <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Event Title Section */}
          <div className="max-w-6xl mx-auto px-4 pt-8 pb-20 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-violet-300 text-sm font-medium">Event Details</span>
                  {event.is_locked && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <LockIcon />
                      Locked
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {event.event_name}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleLock}
                  disabled={isTogglingLock}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isTogglingLock ? '...' : event.is_locked ? <><UnlockIcon /> Unlock</> : <><LockIcon /> Lock</>}
                </button>
                <Link
                  href={`/dashboard/event/${eventId}/edit`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <EditIcon />
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors"
                >
                  <TrashIcon />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* Content Area with light background */}
      <div className="bg-slate-100 min-h-screen -mt-16 pt-8 relative">
        {/* Error banner */}
        {error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="relative z-10 max-w-6xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Event Details Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 rounded-xl">
                <CalendarIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Event Details</h2>
                <p className="text-sm text-slate-500">Date and timing info</p>
              </div>
            </div>
            <div className="p-6">
              <dl className="space-y-5">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date & Time</dt>
                  <dd className="mt-1.5 text-base text-slate-900 font-medium">{formatDateTime(event.event_date_time)}</dd>
                </div>
                {event.cutoff_datetime && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Guest Cutoff</dt>
                    <dd className="mt-1.5 text-base text-slate-900">{formatDateTime(event.cutoff_datetime)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Party Lead Card */}
          {(event.party_lead_name || event.party_lead_email || event.party_lead_phone) && (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
                <div className="p-3 bg-gradient-to-br from-fuchsia-100 to-pink-100 text-fuchsia-600 rounded-xl">
                  <UserIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Party Lead</h2>
                  <p className="text-sm text-slate-500">Event organiser contact</p>
                </div>
              </div>
              <div className="p-6">
                <dl className="space-y-5">
                  {event.party_lead_name && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</dt>
                      <dd className="mt-1.5 text-base text-slate-900 font-medium">{event.party_lead_name}</dd>
                    </div>
                  )}
                  {event.party_lead_email && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</dt>
                      <dd className="mt-1.5">
                        <a href={`mailto:${event.party_lead_email}`} className="text-violet-600 hover:text-violet-800 hover:underline break-all transition-colors">
                          {event.party_lead_email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {event.party_lead_phone && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</dt>
                      <dd className="mt-1.5">
                        <a href={`tel:${event.party_lead_phone}`} className="text-violet-600 hover:text-violet-800 hover:underline transition-colors">
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
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 rounded-xl">
                <LinkIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Shareable Link</h2>
                <p className="text-sm text-slate-500">Send to organiser or guests</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  readOnly
                  value={getShareableLink()}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <button
                  onClick={copyLink}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                    linkCopied
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              {event.party_lead_email && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <button
                    onClick={handleSendInvite}
                    disabled={isSendingInvite}
                    className="text-sm text-violet-600 hover:text-violet-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {isSendingInvite ? 'Sending...' : inviteSent ? 'Sent!' : `Email to ${event.party_lead_email}`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Staff Notes Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-xl">
                <NotesIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Staff Notes</h2>
                <p className="text-sm text-slate-500">Internal notes (not visible to guests)</p>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
                placeholder="Add notes about this event (e.g., VIP, deposit paid)..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-shadow"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">
                  {staffNotes.length}/{MAX_NOTES_LENGTH}
                </span>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || !notesHaveChanged}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    notesHaveChanged
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 shadow-lg shadow-violet-500/25'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Stats */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-xl shadow-lg shadow-violet-500/25">
              <UsersIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Guests</h2>
              <p className="text-sm text-slate-500">Attendance overview</p>
            </div>
          </div>

          <div className="p-6">
            {guests.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-violet-500">
                  <UsersIcon />
                </div>
                <p className="text-slate-900 font-semibold">No guests yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Share the link above to invite guests
                </p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-bold text-slate-900">{guests.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Total Guests</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-bold text-slate-900">{guests.filter(g => g.food_order?.trim()).length}</div>
                    <div className="text-xs text-slate-500 mt-1">Food Orders</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-bold text-amber-600">{guests.filter(g => g.dietary_notes?.trim()).length}</div>
                    <div className="text-xs text-slate-500 mt-1">Dietary Notes</div>
                  </div>
                </div>

                {/* View Summary Button */}
                <Link
                  href={`/dashboard/event/${eventId}/summary`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-base font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Full Summary
                </Link>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
            <Link
              href={`/event/${event.link_token}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Public Page
            </Link>
          </div>
        </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Event?</h3>
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
                className="flex-1 px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
