'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicEvent, addGuest, editGuest, removeGuest, PublicEvent, Guest, Branding } from '@/lib/api';

// Cloudinary transformation URLs
const getLogoUrl = (url: string) => {
  return url.replace('/upload/', '/upload/w_400,h_150,c_fit/');
};

const getHeroUrl = (url: string) => {
  return url.replace('/upload/', '/upload/w_1200,h_400,c_fill/');
};

export default function PublicEventPage() {
  const params = useParams();
  const linkToken = params.link_token as string;

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [foodOrder, setFoodOrder] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [editingGuestId, setEditingGuestId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Check if branding is enabled (has logo or hero image)
  const hasBranding = branding?.hero_image_url || branding?.logo_url;

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError('');

    const result = await getPublicEvent(linkToken);

    if (result.success && result.data) {
      setEvent(result.data.event);
      setGuests(result.data.guests);
      setBranding(result.data.branding);
      setIsOwner(result.data.is_owner);
    } else {
      setError(result.error || 'Event not found');
    }

    setLoading(false);
  }, [linkToken]);

  useEffect(() => {
    if (linkToken) {
      fetchEvent();
    }
  }, [linkToken, fetchEvent]);

  const resetForm = () => {
    setName('');
    setFoodOrder('');
    setDietaryNotes('');
    setEditingGuestId(null);
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setSubmitError('Please enter a name');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    if (editingGuestId) {
      // Update existing guest
      const result = await editGuest(linkToken, editingGuestId, name.trim(), foodOrder.trim(), dietaryNotes.trim());
      if (result.success) {
        resetForm();
        fetchEvent();
      } else {
        setSubmitError(result.error || 'Failed to update');
      }
    } else {
      // Add new guest
      const result = await addGuest(linkToken, name.trim(), foodOrder.trim(), dietaryNotes.trim());
      if (result.success) {
        resetForm();
        fetchEvent();
      } else {
        setSubmitError(result.error || 'Failed to add');
      }
    }

    setSubmitting(false);
  };

  const handleEdit = (guest: Guest) => {
    setName(guest.name);
    setFoodOrder(guest.food_order || '');
    setDietaryNotes(guest.dietary_notes || '');
    setEditingGuestId(guest.id);
    setSubmitError('');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemove = async (guestId: number) => {
    if (!confirm('Remove this guest from the list?')) return;

    const result = await removeGuest(linkToken, guestId);
    if (result.success) {
      fetchEvent();
      if (editingGuestId === guestId) {
        resetForm();
      }
    } else {
      alert(result.error || 'Failed to remove guest');
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if guest can add/edit entries
  // Owners can always edit, even when locked
  const canEdit = () => {
    if (!event) return false;
    if (isOwner) return true; // Owners bypass lock and cutoff
    if (event.is_locked) return false;
    if (event.cutoff_datetime) {
      return new Date(event.cutoff_datetime) > new Date();
    }
    return true;
  };

  // Check if registration is closed for guests (used for messaging)
  const isClosedForGuests = () => {
    if (!event) return true;
    if (event.is_locked) return true;
    if (event.cutoff_datetime) {
      return new Date(event.cutoff_datetime) <= new Date();
    }
    return false;
  };

  // Loading state
  if (loading) {
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

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 mb-2">Event Not Found</h1>
          <p className="text-slate-500 text-sm">
            This event link may be invalid or the event may have been removed.
          </p>
        </div>
      </div>
    );
  }

  // Shared form component
  const renderForm = () => (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">
        {editingGuestId ? 'Update Guest' : 'Add Guest'}
      </h2>
      {event.cutoff_datetime && (
        <p className="text-xs text-slate-500 mb-4">
          Cut-off: {formatDateTime(event.cutoff_datetime)}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="dietaryNotes" className="block text-sm font-medium text-slate-700 mb-1.5">
              Dietary requirements / allergies
            </label>
            <input
              type="text"
              id="dietaryNotes"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder="e.g. Vegetarian, nut allergy"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="foodOrder" className="block text-sm font-medium text-slate-700 mb-1.5">
            Food order
          </label>
          <textarea
            id="foodOrder"
            value={foodOrder}
            onChange={(e) => setFoodOrder(e.target.value)}
            placeholder="e.g. Steak pie + chips"
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none transition-shadow"
            disabled={submitting}
          />
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {submitError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
          >
            {submitting ? 'Saving...' : editingGuestId ? 'Update' : 'Add'}
          </button>
          {editingGuestId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );

  // Shared guest list component
  const renderGuestList = () => (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-4">
        Current Group ({guests.length} attending)
      </h2>

      {guests.length === 0 ? (
        <p className="text-slate-500 text-sm">No guests added yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {guests.map((guest, index) => (
            <li key={guest.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900 text-sm">{guest.name}</span>
                      {guest.dietary_notes && (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 text-xs px-2 py-0.5 rounded-full">
                          {guest.dietary_notes}
                        </span>
                      )}
                    </div>
                    {guest.food_order && (
                      <p className="text-slate-500 text-sm mt-0.5">{guest.food_order}</p>
                    )}
                  </div>
                </div>
                {canEdit() && (
                  <div className="flex gap-4 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(guest)}
                      className="text-slate-500 text-xs font-medium hover:text-slate-900 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemove(guest.id)}
                      className="text-slate-500 text-xs font-medium hover:text-slate-900 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Shared closed notice
  const renderClosedNotice = () => (
    !isOwner && isClosedForGuests() && (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm font-medium">
          {event.is_locked ? 'Registration is locked' : 'Registration has closed'}
        </p>
        {event.cutoff_datetime && !event.is_locked && (
          <p className="text-amber-700 text-xs mt-1">
            Cut-off was {formatDateTime(event.cutoff_datetime)}
          </p>
        )}
      </div>
    )
  );

  // =============================================================================
  // BRANDED VERSION - Shows when restaurant has uploaded logo or hero image
  // =============================================================================
  if (hasBranding) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header - with hero image or logo-only */}
        <header className="relative">
          {branding.hero_image_url ? (
            /* Hero Image Header */
            <div className="relative h-40 md:h-52 lg:h-64 overflow-hidden">
              <Image
                src={getHeroUrl(branding.hero_image_url)}
                alt={event.restaurant_name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

              {/* Back Button - for owners */}
              {isOwner && (
                <div className="absolute top-4 left-4 z-10">
                  <Link
                    href={`/dashboard/event/${event.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white/90 text-slate-700 hover:bg-white transition-colors"
                  >
                    ← Back to Event
                  </Link>
                </div>
              )}

              {/* Logo positioned on the image (if uploaded) */}
              {branding.logo_url && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Image
                    src={getLogoUrl(branding.logo_url)}
                    alt={event.restaurant_name}
                    width={120}
                    height={60}
                    className="max-h-16 md:max-h-20 w-auto drop-shadow-lg"
                    unoptimized
                  />
                </div>
              )}
            </div>
          ) : (
            /* Logo-only Header (no hero image) */
            <div className="bg-white border-b border-slate-200">
              <div className="px-4 py-4 md:py-6 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
                {isOwner && (
                  <div className="mb-3">
                    <Link
                      href={`/dashboard/event/${event.id}`}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      ← Back to Event
                    </Link>
                  </div>
                )}
                <div className="flex justify-center">
                  <Image
                    src={getLogoUrl(branding.logo_url!)}
                    alt={event.restaurant_name}
                    width={200}
                    height={80}
                    className="max-h-16 md:max-h-20 w-auto"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="px-4 py-6 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-4">
          {/* Event Info */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h1 className="text-xl font-semibold text-slate-900 mb-1">{event.event_name}</h1>
            <p className="text-slate-600">{formatDateTime(event.event_date_time)}</p>

            {event.menu_link && (
              <a
                href={event.menu_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Menu
              </a>
            )}
          </div>

          {/* Registration Status */}
          {renderClosedNotice()}

          {/* Add/Edit Form */}
          {canEdit() && renderForm()}

          {/* Guest List */}
          {renderGuestList()}

          {/* Footer Note - only show for non-owners when closed */}
          {!isOwner && isClosedForGuests() && (
            <p className="text-center text-slate-400 text-xs px-4">
              Editing is closed. Please contact the restaurant or your booking lead for changes.
            </p>
          )}

          {/* Terms Notice */}
          {branding?.terms_link && (
            <p className="text-center text-slate-400 text-xs px-4">
              Please remove any guests who can no longer attend. Remaining on the list at cutoff confirms attendance and acceptance of our{' '}
              <a
                href={branding.terms_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-700 underline transition-colors"
              >
                booking terms
              </a>.
            </p>
          )}
        </main>
      </div>
    );
  }

  // =============================================================================
  // ORIGINAL PLAIN VERSION
  // =============================================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-4 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
          {isOwner && (
            <div className="mb-2">
              <Link
                href={`/dashboard/event/${event.id}`}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back to Event
              </Link>
            </div>
          )}
          <p className="text-sm text-slate-500 text-center">{event.restaurant_name}</p>
          <p className="text-xs text-slate-400 text-center">Group Booking</p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-4">
        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">{event.event_name}</h1>
          <p className="text-slate-600">{formatDateTime(event.event_date_time)}</p>

          {event.menu_link && (
            <a
              href={event.menu_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Menu
            </a>
          )}
        </div>

        {/* Registration Status */}
        {renderClosedNotice()}

        {/* Add/Edit Form */}
        {canEdit() && renderForm()}

        {/* Guest List */}
        {renderGuestList()}

        {/* Footer Note - only show for non-owners when closed */}
        {!isOwner && isClosedForGuests() && (
          <p className="text-center text-slate-400 text-xs px-4">
            Editing is closed. Please contact the restaurant or your booking lead for changes.
          </p>
        )}

        {/* Terms Notice */}
        {branding?.terms_link && (
          <p className="text-center text-slate-400 text-xs px-4">
            Please remove any guests who can no longer attend. Remaining on the list at cutoff confirms attendance and acceptance of our{' '}
            <a
              href={branding.terms_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 underline transition-colors"
            >
              booking terms
            </a>.
          </p>
        )}
      </main>
    </div>
  );
}
