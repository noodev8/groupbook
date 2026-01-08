'use client';

/*
=======================================================================================================================================
Public Event Page (Guest View)
=======================================================================================================================================
Purpose: Public page where guests can view event details, see the guest list, and add themselves.
         Uses modal for add/edit form. Premium styling matching dashboard.
=======================================================================================================================================
*/

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { addGuest, editGuest, removeGuest, getPublicEvent, PublicEvent, Guest, Branding } from '@/lib/api';

// Cloudinary transformation URLs
const getLogoUrl = (url: string) => {
  return url.replace('/upload/', '/upload/w_400,h_150,c_fit/');
};

const getHeroUrl = (url: string) => {
  return url.replace('/upload/', '/upload/w_1200,h_400,c_fill/');
};

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

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function PublicEventPage() {
  const params = useParams();
  const linkToken = params.link_token as string;

  // Event state
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [branding, setBranding] = useState<Branding>({ logo_url: null, hero_image_url: null, terms_link: null });
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch public event on mount
  useEffect(() => {
    if (!linkToken) return;

    getPublicEvent(linkToken).then((result) => {
      if (result.success && result.data) {
        setEvent(result.data.event);
        setGuests(result.data.guests);
        setBranding(result.data.branding);
        setIsOwner(result.data.is_owner);
      } else {
        setError(result.error || 'Failed to load event');
      }
      setLoading(false);
    });
  }, [linkToken]);

  // Refetch data helper
  const refetchData = async () => {
    if (!linkToken) return;
    const result = await getPublicEvent(linkToken);
    if (result.success && result.data) {
      setEvent(result.data.event);
      setGuests(result.data.guests);
      setBranding(result.data.branding);
      setIsOwner(result.data.is_owner);
    }
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [foodOrder, setFoodOrder] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [editingGuestId, setEditingGuestId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Check if branding is enabled (has logo or hero image)
  const hasBranding = branding?.hero_image_url || branding?.logo_url;

  const resetForm = () => {
    setName('');
    setFoodOrder('');
    setDietaryNotes('');
    setEditingGuestId(null);
    setSubmitError('');
  };

  const openModal = (guest?: Guest) => {
    if (guest) {
      setName(guest.name);
      setFoodOrder(guest.food_order || '');
      setDietaryNotes(guest.dietary_notes || '');
      setEditingGuestId(guest.id);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
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
        closeModal();
        await refetchData();
      } else {
        setSubmitError(result.error || 'Failed to update');
      }
    } else {
      // Add new guest
      const result = await addGuest(linkToken, name.trim(), foodOrder.trim(), dietaryNotes.trim());
      if (result.success) {
        closeModal();
        await refetchData();
      } else {
        setSubmitError(result.error || 'Failed to add');
      }
    }

    setSubmitting(false);
  };

  const handleRemove = async (guestId: number) => {
    if (!confirm('Remove this guest from the list?')) return;

    const result = await removeGuest(linkToken, guestId);
    if (result.success) {
      closeModal();
      await refetchData();
    } else {
      alert(result.error || 'Failed to remove guest');
    }
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-violet-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Event Not Found</h1>
          <p className="text-slate-500">
            This event link may be invalid or the event may have been removed.
          </p>
        </div>
      </div>
    );
  }

  // Modal component
  const renderModal = () => (
    <div className={`fixed inset-0 z-50 ${isModalOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeModal}
      />

      {/* Modal */}
      <div className={`absolute inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto transition-all duration-300 ${isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-500 to-fuchsia-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <UsersIcon />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {editingGuestId ? 'Update Guest' : 'Add Guest'}
              </h2>
            </div>
            <button
              onClick={closeModal}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Guest Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                disabled={submitting}
                autoFocus
              />
            </div>

            {/* Dietary Requirements */}
            <div>
              <label htmlFor="dietaryNotes" className="block text-sm font-medium text-slate-700 mb-2">
                Dietary Requirements / Allergies
              </label>
              <input
                type="text"
                id="dietaryNotes"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g. Vegetarian, nut allergy"
                className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                disabled={submitting}
              />
            </div>

            {/* Food Order */}
            <div>
              <label htmlFor="foodOrder" className="block text-sm font-medium text-slate-700 mb-2">
                Food Order
              </label>
              <textarea
                id="foodOrder"
                value={foodOrder}
                onChange={(e) => setFoodOrder(e.target.value)}
                placeholder="e.g. Steak pie + chips"
                rows={3}
                className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-shadow"
                disabled={submitting}
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {submitError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-3.5 px-6 border border-slate-200 rounded-xl text-base font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
              >
                {submitting ? 'Saving...' : editingGuestId ? 'Update' : 'Add Guest'}
              </button>
            </div>

            {/* Remove from list - only shown when editing */}
            {editingGuestId && (
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleRemove(editingGuestId)}
                  className="w-full py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Remove from list
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  // Guest list component
  const renderGuestList = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 rounded-xl">
            <UsersIcon />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Guest List</h2>
            <p className="text-sm text-slate-500">{guests.length} attending</p>
          </div>
        </div>
        {canEdit() && (
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
          >
            <PlusIcon />
            <span className="hidden sm:inline">Add Guest</span>
          </button>
        )}
      </div>

      <div className="p-6">
        {guests.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-violet-500">
              <UsersIcon />
            </div>
            <p className="text-slate-900 font-medium">No guests yet</p>
            <p className="text-sm text-slate-500 mt-1">Be the first to join!</p>
            {canEdit() && (
              <button
                onClick={() => openModal()}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
              >
                <PlusIcon />
                Add Guest
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {guests.map((guest, index) => (
              <li
                key={guest.id}
                onClick={() => canEdit() && openModal(guest)}
                className={`p-4 bg-slate-50 rounded-xl transition-colors ${canEdit() ? 'cursor-pointer hover:bg-slate-100' : ''}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{guest.name}</span>
                      {guest.dietary_notes && (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-medium">
                          {guest.dietary_notes}
                        </span>
                      )}
                    </div>
                    {guest.food_order ? (
                      <p className="text-slate-600 mt-1">{guest.food_order}</p>
                    ) : (
                      <p className="text-slate-400 mt-1 italic">No order yet</p>
                    )}
                  </div>
                  {canEdit() && (
                    <svg className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  // Closed notice
  const renderClosedNotice = () => (
    !isOwner && isClosedForGuests() && (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-8.364l-1.414 1.414M21 12h-2m0 0h-2M12 3v2m0 0v2m0-2h2M5.636 5.636l1.414 1.414M3 12h2m0 0h2m9 9l-1.414-1.414M12 21v-2m0 0v-2m0 2h-2" />
            </svg>
          </div>
          <div>
            <p className="text-amber-800 font-semibold">
              {event.is_locked ? 'Registration is locked' : 'Registration has closed'}
            </p>
            {event.cutoff_datetime && !event.is_locked && (
              <p className="text-amber-700 text-sm mt-1">
                Cut-off was {formatDateTime(event.cutoff_datetime)}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  );

  // =============================================================================
  // BRANDED VERSION - Shows when restaurant has uploaded logo or hero image
  // =============================================================================
  if (hasBranding) {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderModal()}

        {/* Header - with hero image or logo-only */}
        <header className="relative">
          {branding.hero_image_url ? (
            /* Hero Image Header */
            <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
              <Image
                src={getHeroUrl(branding.hero_image_url)}
                alt={event.restaurant_name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

              {/* Back Button - for owners */}
              {isOwner && (
                <div className="absolute top-4 left-4 z-10">
                  <Link
                    href={`/dashboard/event/${event.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/90 text-slate-700 hover:bg-white transition-colors shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Event
                  </Link>
                </div>
              )}

              {/* Logo positioned on the image (if uploaded) */}
              {branding.logo_url && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <Image
                    src={getLogoUrl(branding.logo_url)}
                    alt={event.restaurant_name}
                    width={160}
                    height={80}
                    className="max-h-20 md:max-h-24 w-auto drop-shadow-lg"
                    unoptimized
                  />
                </div>
              )}
            </div>
          ) : (
            /* Logo-only Header (no hero image) */
            <div className="bg-white border-b-2 border-transparent" style={{ borderImage: 'linear-gradient(to right, #8b5cf6, #d946ef) 1' }}>
              <div className="px-4 py-6 md:py-8 max-w-3xl mx-auto">
                {isOwner && (
                  <div className="mb-4">
                    <Link
                      href={`/dashboard/event/${event.id}`}
                      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Event
                    </Link>
                  </div>
                )}
                <div className="flex justify-center">
                  <Image
                    src={getLogoUrl(branding.logo_url!)}
                    alt={event.restaurant_name}
                    width={200}
                    height={80}
                    className="max-h-20 md:max-h-24 w-auto"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="px-4 py-8 max-w-3xl mx-auto space-y-6">
          {/* Event Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
              <div className="p-3 bg-gradient-to-br from-fuchsia-100 to-pink-100 text-fuchsia-600 rounded-xl">
                <CalendarIcon />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">{event.event_name}</h1>
                <p className="text-slate-600">{formatDateTime(event.event_date_time)}</p>
              </div>
            </div>
            {(event.menu_link || (event.cutoff_datetime && !isClosedForGuests())) && (
              <div className="px-6 py-4 flex flex-wrap items-center gap-4">
                {event.menu_link && (
                  <a
                    href={event.menu_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    <MenuIcon />
                    View Menu
                  </a>
                )}
                {event.cutoff_datetime && !isClosedForGuests() && (
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Cut-off:</span> {formatDateTime(event.cutoff_datetime)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Registration Status */}
          {renderClosedNotice()}

          {/* Guest List */}
          {renderGuestList()}

          {/* Footer Notes */}
          <div className="space-y-3 pt-4">
            {!isOwner && isClosedForGuests() && (
              <p className="text-center text-slate-400 text-sm">
                Editing is closed. Please contact the restaurant or your booking lead for changes.
              </p>
            )}

            {branding?.terms_link && (
              <p className="text-center text-slate-400 text-sm">
                Please remove any guests who can no longer attend. Remaining on the list at cutoff confirms attendance and acceptance of our{' '}
                <a
                  href={branding.terms_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-500 hover:text-violet-700 underline transition-colors"
                >
                  booking terms
                </a>.
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  // =============================================================================
  // ORIGINAL PLAIN VERSION (without branding)
  // =============================================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {renderModal()}

      {/* Header */}
      <header className="bg-white border-b-2 border-transparent" style={{ borderImage: 'linear-gradient(to right, #8b5cf6, #d946ef) 1' }}>
        <div className="px-4 py-6 max-w-3xl mx-auto">
          {isOwner && (
            <div className="mb-4">
              <Link
                href={`/dashboard/event/${event.id}`}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Event
              </Link>
            </div>
          )}
          <div className="text-center">
            <p className="text-violet-600 font-medium">{event.restaurant_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">Group Booking</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 max-w-3xl mx-auto space-y-6">
        {/* Event Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
            <div className="p-3 bg-gradient-to-br from-fuchsia-100 to-pink-100 text-fuchsia-600 rounded-xl">
              <CalendarIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{event.event_name}</h1>
              <p className="text-slate-600">{formatDateTime(event.event_date_time)}</p>
            </div>
          </div>
          {(event.menu_link || (event.cutoff_datetime && !isClosedForGuests())) && (
            <div className="px-6 py-4 flex flex-wrap items-center gap-4">
              {event.menu_link && (
                <a
                  href={event.menu_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  <MenuIcon />
                  View Menu
                </a>
              )}
              {event.cutoff_datetime && !isClosedForGuests() && (
                <p className="text-sm text-slate-500">
                  <span className="font-medium">Cut-off:</span> {formatDateTime(event.cutoff_datetime)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Registration Status */}
        {renderClosedNotice()}

        {/* Guest List */}
        {renderGuestList()}

        {/* Footer Notes */}
        <div className="space-y-3 pt-4">
          {!isOwner && isClosedForGuests() && (
            <p className="text-center text-slate-400 text-sm">
              Editing is closed. Please contact the restaurant or your booking lead for changes.
            </p>
          )}

          {branding?.terms_link && (
            <p className="text-center text-slate-400 text-sm">
              Please remove any guests who can no longer attend. Remaining on the list at cutoff confirms attendance and acceptance of our{' '}
              <a
                href={branding.terms_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 hover:text-violet-700 underline transition-colors"
              >
                booking terms
              </a>.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
