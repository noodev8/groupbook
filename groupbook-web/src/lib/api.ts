/*
=======================================================================================================================================
API Client
=======================================================================================================================================
Purpose: Provides functions for making API calls to the backend.
         Follows the API-Rules.md patterns - never throws on API errors, returns structured objects.
=======================================================================================================================================
*/

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
  link_token: string;
  restaurant_name?: string;
  guest_count?: number;
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
}

/*
 * Create Event - Create a new group booking event
 * Returns the created event on success, error info on failure
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
 * List Events - Get all events for the authenticated user
 * Returns array of events on success, error info on failure
 */
export async function listEvents(): Promise<ApiResponse<ListEventsResponse>> {
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
}

/*
 * Get Event - Get a single event by ID (auth required)
 * Returns event details on success, error info on failure
 */
export async function getEvent(eventId: number): Promise<ApiResponse<{ event: Event }>> {
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
}

// -----------------------------------------------------------------------
// Guest API Functions
// -----------------------------------------------------------------------

export interface Guest {
  id: number;
  name: string;
  created_at: string;
}

/*
 * List Guests - Get all guests for an event (auth required)
 * Returns array of guests on success, error info on failure
 */
export async function listGuests(eventId: number): Promise<ApiResponse<{ guests: Guest[] }>> {
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
  guest_count: number;
}

/*
 * Get Public Event - Get event details by link_token (no auth required)
 * Used by guests to view event before joining
 */
export async function getPublicEvent(linkToken: string): Promise<ApiResponse<{ event: PublicEvent }>> {
  try {
    const response = await apiCall<{ event?: PublicEvent; message?: string }>(
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
 * Add Guest - Add a guest to an event using link_token (no auth required)
 * Used by guests to register themselves for an event
 */
export async function addGuest(
  linkToken: string,
  name: string
): Promise<ApiResponse<{ guest: Guest }>> {
  try {
    const response = await apiCall<{ guest?: Guest; message?: string }>(
      '/api/guests/add',
      {
        method: 'POST',
        body: JSON.stringify({ link_token: linkToken, name }),
      }
    );

    if (response.return_code !== 'SUCCESS') {
      return {
        success: false,
        error: response.message || 'Failed to add guest',
        return_code: response.return_code,
      };
    }

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
