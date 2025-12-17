/*
=======================================================================================================================================
API Client
=======================================================================================================================================
Purpose: Provides functions for making API calls to the backend.
         Follows the API-Rules.md patterns - never throws on API errors, returns structured objects.
         Read functions use withCache() for TTL-based caching.
         Write functions invalidate relevant cache entries.
=======================================================================================================================================
*/

import { withCache, TTL, cacheUtils } from './cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  restaurant_name: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  return_code?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface Event {
  id: number;
  event_name: string;
  event_date_time: string;
  cutoff_datetime: string | null;
  party_lead_name: string | null;
  party_lead_email: string | null;
  party_lead_phone: string | null;
  menu_link: string | null;
  staff_notes: string | null;
  link_token: string;
  restaurant_name?: string;
  guest_count?: number;
  is_locked?: boolean;
  created_at: string;
}

export interface CreateEventResponse {
  event: Event;
}

export interface ListEventsResponse {
  events: Event[];
}

// -----------------------------------------------------------------------
// Base API Call Function
// -----------------------------------------------------------------------

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ return_code: string; message?: string } & T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}

// -----------------------------------------------------------------------
// Auth API Functions
// -----------------------------------------------------------------------

/*
 * Login - Authenticate user with email and password
 * Returns token and user data on success, error info on failure
 */
export async function login(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await apiCall<{ token?: string; user?: User; message?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Login failed',
        return_code: response.return_code,
      };
    }

    return {
      success: true,
      data: {
        token: response.token!,
        user: response.user!,
      },
    };
  } catch (error) {
    // Network errors only reach here
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * Register - Create a new user account
 * Returns token and user data on success, error info on failure
 */
export async function register(
  email: string,
  password: string,
  restaurant_name: string
): Promise<ApiResponse<RegisterResponse>> {
  try {
    const response = await apiCall<{ token?: string; user?: User; message?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, restaurant_name }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Registration failed',
        return_code: response.return_code,
      };
    }

    return {
      success: true,
      data: {
        token: response.token!,
        user: response.user!,
      },
    };
  } catch (error) {
    // Network errors only reach here
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

// -----------------------------------------------------------------------
// Event API Functions
// -----------------------------------------------------------------------

export interface CreateEventParams {
  event_name: string;
  event_date_time: string;
  cutoff_datetime?: string;
  party_lead_name?: string;
  party_lead_email?: string;
  party_lead_phone?: string;
  menu_link?: string;
}

/*
 * Create Event - Create a new group booking event
 * Returns the created event on success, error info on failure
 * Invalidates: events-list, billing (event count changes)
 */
export async function createEvent(
  params: CreateEventParams
): Promise<ApiResponse<CreateEventResponse>> {
  try {
    const response = await apiCall<{ event?: Event; message?: string }>(
      '/api/events/create',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to create event',
        return_code: response.return_code,
      };
    }

    // Invalidate relevant caches
    cacheUtils.invalidate('events-list');
    cacheUtils.invalidate('billing');

    return {
      success: true,
      data: {
        event: response.event!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

export interface UpdateEventParams {
  event_id: number;
  event_name: string;
  event_date_time: string;
  cutoff_datetime?: string | null;
  party_lead_name?: string | null;
  party_lead_email?: string | null;
  party_lead_phone?: string | null;
  menu_link?: string | null;
  staff_notes?: string | null;
}

/*
 * Update Event - Update an existing event's details
 * Returns the updated event on success, error info on failure
 * Invalidates: events-list, event-{id}, public-event-{token}
 */
export async function updateEvent(
  params: UpdateEventParams
): Promise<ApiResponse<{ event: Event }>> {
  try {
    const response = await apiCall<{ event?: Event; message?: string }>(
      '/api/events/update',
      {
        method: 'PUT',
        body: JSON.stringify(params),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to update event',
        return_code: response.return_code,
      };
    }

    // Invalidate relevant caches
    cacheUtils.invalidate('events-list');
    cacheUtils.invalidate(`event-${params.event_id}`);
    // Also invalidate public event if we have the token
    if (response.event?.link_token) {
      cacheUtils.invalidate(`public-event-${response.event.link_token}`);
    }

    return {
      success: true,
      data: {
        event: response.event!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * Delete Event - Permanently delete an event and all its guests
 * Returns success status
 * Invalidates: events-list, event-{id}*, billing (event count changes)
 */
export async function deleteEvent(
  eventId: number
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await apiCall<{ message?: string }>(
      '/api/events/delete',
      {
        method: 'DELETE',
        body: JSON.stringify({ event_id: eventId }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to delete event',
        return_code: response.return_code,
      };
    }

    // Invalidate relevant caches
    cacheUtils.invalidate('events-list');
    cacheUtils.invalidatePattern(`event-${eventId}*`); // event-123, event-123-guests
    cacheUtils.invalidate('billing');

    return {
      success: true,
      data: {
        message: response.message || 'Event deleted successfully',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * Toggle Event Lock - Lock or unlock an event
 * When locked, guests cannot add/edit/remove themselves
 * Returns updated lock status on success, error info on failure
 * Invalidates: events-list, event-{id}
 */
export async function toggleEventLock(
  eventId: number,
  isLocked: boolean
): Promise<ApiResponse<{ event: { id: number; is_locked: boolean } }>> {
  try {
    const response = await apiCall<{ event?: { id: number; is_locked: boolean }; message?: string }>(
      '/api/events/lock',
      {
        method: 'PUT',
        body: JSON.stringify({ event_id: eventId, is_locked: isLocked }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to update event lock status',
        return_code: response.return_code,
      };
    }

    // Invalidate relevant caches
    cacheUtils.invalidate('events-list');
    cacheUtils.invalidate(`event-${eventId}`);

    return {
      success: true,
      data: {
        event: response.event!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * Send Event Invite - Send email invitation to the party organiser
 * Returns success message on success, error info on failure
 */
export async function sendEventInvite(
  eventId: number
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await apiCall<{ message?: string }>(
      '/api/events/sendInvite',
      {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to send invitation',
        return_code: response.return_code,
      };
    }

    return {
      success: true,
      data: {
        message: response.message || 'Invitation sent',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * List Events - Get all events for the authenticated user
 * Returns array of events on success, error info on failure
 * Cached for 5 minutes (TTL.MEDIUM)
 */
export async function listEvents(): Promise<ApiResponse<ListEventsResponse>> {
  return withCache('events-list', TTL.MEDIUM, async () => {
    try {
      const response = await apiCall<{ events?: Event[]; message?: string }>(
        '/api/events/list',
        {
          method: 'GET',
        }
      );

      if (response.return_code !== 'SUCCESS') {
        return {
          success: false,
          error: response.message || 'Failed to load events',
          return_code: response.return_code,
        };
      }

      return {
        success: true,
        data: {
          events: response.events || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    }
  });
}

/*
 * Get Event - Get a single event by ID (auth required)
 * Returns event details on success, error info on failure
 * Cached for 5 minutes (TTL.MEDIUM)
 */
export async function getEvent(eventId: number): Promise<ApiResponse<{ event: Event }>> {
  return withCache(`event-${eventId}`, TTL.MEDIUM, async () => {
    try {
      const response = await apiCall<{ event?: Event; message?: string }>(
        `/api/events/get/${eventId}`,
        {
          method: 'GET',
        }
      );

      if (response.return_code !== 'SUCCESS') {
        return {
          success: false,
          error: response.message || 'Failed to load event',
          return_code: response.return_code,
        };
      }

      return {
        success: true,
        data: {
          event: response.event!,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    }
  });
}

// -----------------------------------------------------------------------
// Guest API Functions
// -----------------------------------------------------------------------

export interface Guest {
  id: number;
  name: string;
  food_order: string | null;
  dietary_notes: string | null;
  created_at: string;
}

/*
 * List Guests - Get all guests for an event (auth required)
 * Returns array of guests on success, error info on failure
 * Cached for 2 minutes (TTL.SHORT)
 */
export async function listGuests(eventId: number): Promise<ApiResponse<{ guests: Guest[] }>> {
  return withCache(`event-${eventId}-guests`, TTL.SHORT, async () => {
    try {
      const response = await apiCall<{ guests?: Guest[]; message?: string }>(
        `/api/guests/list/${eventId}`,
        {
          method: 'GET',
        }
      );

      if (response.return_code !== 'SUCCESS') {
        return {
          success: false,
          error: response.message || 'Failed to load guests',
          return_code: response.return_code,
        };
      }

      return {
        success: true,
        data: {
          guests: response.guests || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    }
  });
}

// -----------------------------------------------------------------------
// Public Event API Functions (No Auth Required)
// -----------------------------------------------------------------------

export interface PublicEvent {
  id: number;
  event_name: string;
  event_date_time: string;
  cutoff_datetime: string | null;
  restaurant_name: string;
  menu_link: string | null;
  is_locked: boolean;
  guest_count: number;
}

/*
 * Get Public Event - Get event details and guests by link_token
 * Auth is optional - if authenticated and owner, is_owner will be true
 * Used by guests to view event and attendee list
 * Includes branding (logo_url, hero_image_url) from the restaurant owner
 * Cached for 2 minutes (TTL.SHORT)
 */
export async function getPublicEvent(linkToken: string): Promise<ApiResponse<{ event: PublicEvent; guests: Guest[]; branding: Branding; is_owner: boolean }>> {
  return withCache(`public-event-${linkToken}`, TTL.SHORT, async () => {
    try {
      const response = await apiCall<{ event?: PublicEvent; guests?: Guest[]; branding?: Branding; is_owner?: boolean; message?: string }>(
        `/api/events/public/${linkToken}`,
        {
          method: 'GET',
        }
      );

      if (response.return_code !== 'SUCCESS') {
        return {
          success: false,
          error: response.message || 'Failed to load event',
          return_code: response.return_code,
        };
      }

      return {
        success: true,
        data: {
          event: response.event!,
          guests: response.guests || [],
          branding: response.branding || { logo_url: null, hero_image_url: null, terms_link: null },
          is_owner: response.is_owner || false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    }
  });
}

/*
 * Add Guest - Add a guest to an event using link_token (no auth required)
 * Used by guests to register themselves for an event
 * Invalidates: public-event-{token}, events-list (guest count changes)
 */
export async function addGuest(
  linkToken: string,
  name: string,
  foodOrder?: string,
  dietaryNotes?: string
): Promise<ApiResponse<{ guest: Guest }>> {
  try {
    const response = await apiCall<{ guest?: Guest; message?: string }>(
      '/api/guests/add',
      {
        method: 'POST',
        body: JSON.stringify({
          link_token: linkToken,
          name,
          food_order: foodOrder || null,
          dietary_notes: dietaryNotes || null,
        }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to add guest',
        return_code: response.return_code,
      };
    }

    // Invalidate relevant caches
    cacheUtils.invalidate(`public-event-${linkToken}`);
    cacheUtils.invalidate('events-list'); // Guest count changes

    return {
      success: true,
      data: {
        guest: response.guest!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * Edit Guest - Edit a guest's details using link_token (no auth required)
 * Used by anyone to update guest information
 * Invalidates: public-event-{token}
 */
export async function editGuest(
  linkToken: string,
  guestId: number,
  name: string,
  foodOrder?: string,
  dietaryNotes?: string
): Promise<ApiResponse<{ guest: Guest }>> {
  try {
    const response = await apiCall<{ guest?: Guest; message?: string }>(
      '/api/guests/edit',
      {
        method: 'PUT',
        body: JSON.stringify({
          link_token: linkToken,
          guest_id: guestId,
          name,
          food_order: foodOrder || null,
          dietary_notes: dietaryNotes || null,
        }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to update guest',
        return_code: response.return_code,
      };
    }

    // Invalidate relevant caches
    cacheUtils.invalidate(`public-event-${linkToken}`);

    return {
      success: true,
      data: {
        guest: response.guest!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * Remove Guest - Remove a guest from an event using link_token (no auth required)
 * Used by anyone to remove a guest
 * Invalidates: public-event-{token}, events-list (guest count changes)
 */
export async function removeGuest(
  linkToken: string,
  guestId: number
): Promise<ApiResponse<void>> {
  try {
    const response = await apiCall<{ message?: string }>(
      '/api/guests/remove',
      {
        method: 'DELETE',
        body: JSON.stringify({
          link_token: linkToken,
          guest_id: guestId,
        }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to remove guest',
        return_code: response.return_code,
      };
    }

    // Invalidate relevant caches
    cacheUtils.invalidate(`public-event-${linkToken}`);
    cacheUtils.invalidate('events-list'); // Guest count changes

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

// -----------------------------------------------------------------------
// User Profile API Functions
// -----------------------------------------------------------------------

/*
 * Update Profile - Update the authenticated user's profile settings
 * Currently supports updating restaurant name
 */
export async function updateProfile(
  restaurantName: string
): Promise<ApiResponse<{ user: User }>> {
  try {
    const response = await apiCall<{ user?: User; message?: string }>(
      '/api/user/updateProfile',
      {
        method: 'PUT',
        body: JSON.stringify({ restaurant_name: restaurantName }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to update profile',
        return_code: response.return_code,
      };
    }

    return {
      success: true,
      data: {
        user: response.user!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

// -----------------------------------------------------------------------
// Branding API Functions
// -----------------------------------------------------------------------

export interface Branding {
  logo_url: string | null;
  hero_image_url: string | null;
  terms_link: string | null;
}

/*
 * Get Branding - Get branding settings for the authenticated user
 * Returns logo and hero image URLs on success
 * Cached for 30 minutes (TTL.VERY_LONG)
 */
export async function getBranding(): Promise<ApiResponse<{ branding: Branding }>> {
  return withCache('branding', TTL.VERY_LONG, async () => {
    try {
      const response = await apiCall<{ branding?: Branding; message?: string }>(
        '/api/branding/get',
        {
          method: 'GET',
        }
      );

      if (response.return_code !== 'SUCCESS') {
        return {
          success: false,
          error: response.message || 'Failed to load branding',
          return_code: response.return_code,
        };
      }

      return {
        success: true,
        data: {
          branding: response.branding!,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    }
  });
}

/*
 * Update Branding - Update branding settings for the authenticated user
 * Pass null to clear a field, undefined to leave unchanged
 * Invalidates: branding
 */
export async function updateBranding(
  logoUrl?: string | null,
  heroImageUrl?: string | null,
  termsLink?: string | null
): Promise<ApiResponse<{ branding: Branding }>> {
  try {
    const response = await apiCall<{ branding?: Branding; message?: string }>(
      '/api/branding/update',
      {
        method: 'PUT',
        body: JSON.stringify({
          logo_url: logoUrl,
          hero_image_url: heroImageUrl,
          terms_link: termsLink,
        }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to update branding',
        return_code: response.return_code,
      };
    }

    // Invalidate branding cache
    cacheUtils.invalidate('branding');

    return {
      success: true,
      data: {
        branding: response.branding!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

// -----------------------------------------------------------------------
// Billing API Functions
// -----------------------------------------------------------------------

export interface BillingStatus {
  status: 'free' | 'active' | 'past_due' | 'cancelled';
  plan: 'monthly' | 'annual' | null;
  current_period_end: string | null;
  event_count: number;
  event_limit: number | null;
}

/*
 * Get Billing Status - Get current subscription status for the user
 * Returns billing info including plan, status, and event limits
 * Cached for 10 minutes (TTL.LONG)
 */
export async function getBillingStatus(): Promise<ApiResponse<{ billing: BillingStatus }>> {
  return withCache('billing', TTL.LONG, async () => {
    try {
      const response = await apiCall<{ billing?: BillingStatus; message?: string }>(
        '/api/billing/status',
        {
          method: 'GET',
        }
      );

      if (response.return_code !== 'SUCCESS') {
        return {
          success: false,
          error: response.message || 'Failed to load billing status',
          return_code: response.return_code,
        };
      }

      return {
        success: true,
        data: {
          billing: response.billing!,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    }
  });
}

/*
 * Create Checkout Session - Start the upgrade flow
 * Returns a Stripe checkout URL to redirect the user to
 */
export async function createCheckoutSession(
  priceType: 'monthly' | 'annual'
): Promise<ApiResponse<{ checkout_url: string }>> {
  try {
    const response = await apiCall<{ checkout_url?: string; message?: string }>(
      '/api/billing/create-checkout-session',
      {
        method: 'POST',
        body: JSON.stringify({ price_type: priceType }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to create checkout session',
        return_code: response.return_code,
      };
    }

    return {
      success: true,
      data: {
        checkout_url: response.checkout_url!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}

/*
 * Create Portal Session - Open Stripe billing portal for subscription management
 * Returns a Stripe portal URL to redirect the user to
 */
export async function createPortalSession(): Promise<ApiResponse<{ portal_url: string }>> {
  try {
    const response = await apiCall<{ portal_url?: string; message?: string }>(
      '/api/billing/create-portal-session',
      {
        method: 'POST',
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to open billing portal',
        return_code: response.return_code,
      };
    }

    return {
      success: true,
      data: {
        portal_url: response.portal_url!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - please check your connection',
    };
  }
}
