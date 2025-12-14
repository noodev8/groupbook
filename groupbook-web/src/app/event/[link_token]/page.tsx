'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPublicEvent, addGuest, editGuest, removeGuest, PublicEvent, Guest } from '@/lib/api';

export default function PublicEventPage() {
  const params = useParams();
  const linkToken = params.link_token as string;

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
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

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError('');

    const result = await getPublicEvent(linkToken);

    if (result.success && result.data) {
      setEvent(result.data.event);
      setGuests(result.data.guests);
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
      setSubmitError('Please enter your name');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-500 text-sm md:text-base">Loading event...</p>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow p-6 md:p-8 text-center max-w-sm md:max-w-md w-full">
          <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-500 text-sm md:text-base">
            This event link may be invalid or the event may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4 md:py-6 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
          {isOwner && (
            <div className="mb-2 md:mb-3">
              <Link
                href={`/dashboard/event/${event.id}`}
                className="text-sm md:text-base text-blue-600 hover:text-blue-800"
              >
                ← Back to Event
              </Link>
            </div>
          )}
          <p className="text-sm md:text-base text-gray-500 text-center">{event.restaurant_name}</p>
          <p className="text-xs md:text-sm text-gray-400 text-center">Group Booking Coordination</p>
        </div>
      </header>

      <main className="px-4 py-4 md:py-6 lg:py-8 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Event Info */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{event.event_name}</h1>
          <p className="text-gray-700 md:text-lg">{formatDateTime(event.event_date_time)}</p>

          {event.menu_link && (
            <a
              href={event.menu_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 md:mt-4 text-blue-600 text-sm md:text-base font-medium hover:underline"
            >
              View Menu (PDF) →
            </a>
          )}
        </div>

        {/* Registration Status - only show for non-owners when closed */}
        {!isOwner && isClosedForGuests() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-5">
            <p className="text-red-800 text-sm md:text-base font-medium">
              {event.is_locked ? 'Registration is locked' : 'Registration has closed'}
            </p>
            {event.cutoff_datetime && !event.is_locked && (
              <p className="text-red-600 text-xs md:text-sm mt-1">
                Cut-off was {formatDateTime(event.cutoff_datetime)}
              </p>
            )}
          </div>
        )}

        {/* Add/Edit Form */}
        {canEdit() && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-1">
              {editingGuestId ? 'Update Entry' : 'Add / Update Entry'}
            </h2>
            {event.cutoff_datetime && (
              <p className="text-xs md:text-sm text-gray-500 mb-4">
                Cut-off: {formatDateTime(event.cutoff_datetime)}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* On larger screens, put name and dietary in a row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="dietaryNotes" className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                    Dietary requirements / allergies
                  </label>
                  <input
                    type="text"
                    id="dietaryNotes"
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    placeholder="e.g. Vegetarian, nut allergy"
                    className="w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="foodOrder" className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                  What would you like to order?
                </label>
                <textarea
                  id="foodOrder"
                  value={foodOrder}
                  onChange={(e) => setFoodOrder(e.target.value)}
                  placeholder="e.g. Steak pie + chips"
                  rows={2}
                  className="w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={submitting}
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm md:text-base">
                  {submitError}
                </div>
              )}

              <div className="flex gap-2 md:gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 bg-blue-600 text-white rounded-md text-sm md:text-base font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingGuestId ? 'Update Entry' : 'Add Entry'}
                </button>
                {editingGuestId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 md:px-6 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-md text-sm md:text-base font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Guest List */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-3 md:mb-4">
            Current Group ({guests.length} attending)
          </h2>

          {guests.length === 0 ? (
            <p className="text-gray-500 text-sm md:text-base">No guests yet. Be the first to join!</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {guests.map((guest, index) => (
                <li key={guest.id} className="py-3 md:py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base">
                        {index + 1}. {guest.name}
                      </p>
                      {guest.food_order && (
                        <p className="text-gray-600 text-sm md:text-base mt-1">{guest.food_order}</p>
                      )}
                      {guest.dietary_notes && (
                        <p className="text-amber-600 text-xs md:text-sm mt-1 flex items-center gap-1">
                          <span>⚠️</span> {guest.dietary_notes}
                        </p>
                      )}
                    </div>
                    {canEdit() && (
                      <div className="flex gap-3 md:gap-4 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(guest)}
                          className="text-blue-600 text-xs md:text-sm font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(guest.id)}
                          className="text-red-600 text-xs md:text-sm font-medium hover:underline"
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

        {/* Footer Note - only show for non-owners when closed */}
        {!isOwner && isClosedForGuests() && (
          <p className="text-center text-gray-500 text-xs md:text-sm px-4">
            Editing is closed. Please contact the restaurant directly for changes.
          </p>
        )}
      </main>
    </div>
  );
}
