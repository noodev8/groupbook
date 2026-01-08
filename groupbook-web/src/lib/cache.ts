/*
=======================================================================
Client-Side Cache with TTL
=======================================================================
Purpose: In-memory cache to reduce unnecessary API calls.
         Data is cached with a TTL and only refetched when expired.
         See docs/client-side-caching.md for full documentation.
=======================================================================
*/

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// -----------------------------------------------------------------------
// TTL Constants
// -----------------------------------------------------------------------

export const TTL = {
  SHORT: 2 * 60 * 1000,     // 2 minutes - guest lists, public events
  MEDIUM: 5 * 60 * 1000,    // 5 minutes - events, single event
  LONG: 10 * 60 * 1000,     // 10 minutes - billing
  VERY_LONG: 30 * 60 * 1000, // 30 minutes - branding, rarely changes
} as const;

// -----------------------------------------------------------------------
// Cache Class
// -----------------------------------------------------------------------

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Delete all keys matching a pattern (e.g., 'event-123*')
  deletePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const keysToDelete: string[] = [];

    Array.from(this.cache.keys()).forEach((key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  // For debugging
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// -----------------------------------------------------------------------
// Cache Instance
// -----------------------------------------------------------------------

export const apiCache = new SimpleCache();

// -----------------------------------------------------------------------
// Pending Requests (Thundering Herd Prevention)
// -----------------------------------------------------------------------

const pendingRequests = new Map<string, Promise<unknown>>();

// -----------------------------------------------------------------------
// Cache Wrapper
// -----------------------------------------------------------------------

export async function withCache<T>(
  key: string,
  ttl: number,
  apiCall: () => Promise<T>
): Promise<T> {
  // 1. Try cache first
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 2. Check if request already in flight (deduplication)
  const pending = pendingRequests.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  // 3. Make API call
  const request = apiCall()
    .then((data) => {
      // Only cache successful responses (those with success: true)
      // This prevents caching auth errors that would persist after re-login
      const response = data as { success?: boolean };
      if (response.success !== false) {
        apiCache.set(key, data, ttl);
      }
      pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, request);
  return request;
}

// -----------------------------------------------------------------------
// Cache Utilities
// -----------------------------------------------------------------------

export const cacheUtils = {
  // Clear everything
  clearAll: () => apiCache.clear(),

  // Clear specific key
  invalidate: (key: string) => apiCache.delete(key),

  // Clear by pattern (e.g., 'event-123*' clears event-123, event-123-guests)
  invalidatePattern: (pattern: string) => apiCache.deletePattern(pattern),

  // Get stats for debugging
  getStats: () => apiCache.getStats(),
};
