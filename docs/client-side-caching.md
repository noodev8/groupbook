# Client-Side Caching with TTL

A pattern for reducing unnecessary API calls by caching data in the browser with automatic expiry.

## The Problem

Without caching, every page navigation triggers API calls to the server, even when:
- The user just visited that page seconds ago
- The data hasn't changed
- The user is the only one editing the data

This creates unnecessary load on your server and database.

## The Solution

An in-memory cache that:
1. Stores API responses with a timestamp
2. Returns cached data if within TTL (time-to-live)
3. Fetches fresh data only when cache is expired or missing
4. Clears on hard page refresh (user can always get fresh data)

## How It Works

```
User visits /dashboard
    ↓
Check cache for 'events-list'
    ↓
┌─────────────────────────────────────┐
│ Cache exists AND within TTL?        │
├──────────────┬──────────────────────┤
│     YES      │         NO           │
│     ↓        │         ↓            │
│ Return cache │ Fetch from API       │
│ (no API call)│ Store in cache       │
│              │ Return fresh data    │
└──────────────┴──────────────────────┘
```

## Core Implementation

### 1. The Cache Class

```typescript
// src/lib/cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

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

  // Delete all keys matching a pattern (e.g., 'event-*')
  deletePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new SimpleCache();
```

### 2. The Cache Wrapper

```typescript
// Prevents duplicate simultaneous requests (thundering herd)
const pendingRequests = new Map<string, Promise<unknown>>();

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
      apiCache.set(key, data, ttl);
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
```

### 3. Cache Invalidation Utilities

```typescript
export const cacheUtils = {
  // Clear everything
  clearAll: () => apiCache.clear(),

  // Clear specific key
  invalidate: (key: string) => apiCache.delete(key),

  // Clear by pattern (e.g., all event-related cache)
  invalidatePattern: (pattern: string) => apiCache.deletePattern(pattern),
};
```

## Usage in API Client

```typescript
// src/lib/api.ts

// Define TTL constants
const TTL = {
  SHORT: 2 * 60 * 1000,    // 2 minutes
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 30 * 60 * 1000,    // 30 minutes
};

// Wrap API calls with caching
export const api = {
  // Events list - 5 minute cache
  listEvents: () => withCache(
    'events-list',
    TTL.MEDIUM,
    () => fetchFromApi('/api/events/list')
  ),

  // Single event - 5 minute cache, keyed by ID
  getEvent: (id: number) => withCache(
    `event-${id}`,
    TTL.MEDIUM,
    () => fetchFromApi(`/api/events/get/${id}`)
  ),

  // Guest list - 2 minute cache (changes more frequently)
  listGuests: (eventId: number) => withCache(
    `event-${eventId}-guests`,
    TTL.SHORT,
    () => fetchFromApi(`/api/guests/list/${eventId}`)
  ),

  // Branding - 30 minute cache (rarely changes)
  getBranding: () => withCache(
    'branding',
    TTL.LONG,
    () => fetchFromApi('/api/branding/get')
  ),
};
```

## Cache Invalidation After Mutations

When data changes, invalidate relevant cache entries:

```typescript
// After creating an event
export async function createEvent(data: CreateEventData) {
  const result = await fetchFromApi('/api/events/create', data);
  if (result.success) {
    cacheUtils.invalidate('events-list');  // Clear list cache
  }
  return result;
}

// After updating an event
export async function updateEvent(eventId: number, data: UpdateEventData) {
  const result = await fetchFromApi('/api/events/update', data);
  if (result.success) {
    cacheUtils.invalidate('events-list');
    cacheUtils.invalidate(`event-${eventId}`);
  }
  return result;
}

// After adding a guest
export async function addGuest(eventId: number, data: AddGuestData) {
  const result = await fetchFromApi('/api/guests/add', data);
  if (result.success) {
    cacheUtils.invalidate(`event-${eventId}-guests`);
    cacheUtils.invalidate(`event-${eventId}`);  // Guest count changes
    cacheUtils.invalidate('events-list');       // List shows guest count
  }
  return result;
}

// After deleting an event - use pattern to clear all related cache
export async function deleteEvent(eventId: number) {
  const result = await fetchFromApi('/api/events/delete', { event_id: eventId });
  if (result.success) {
    cacheUtils.invalidatePattern(`event-${eventId}*`);  // event-123, event-123-guests
    cacheUtils.invalidate('events-list');
  }
  return result;
}
```

## Choosing TTL Values

| Data Type | Suggested TTL | Reasoning |
|-----------|---------------|-----------|
| Static reference data | 30-60 mins | Rarely changes |
| User settings/preferences | 10-30 mins | User controls changes |
| Lists owned by user | 5-10 mins | Only they edit it |
| Shared/collaborative data | 1-2 mins | Others may edit |
| Real-time data | 30 secs or no cache | Freshness critical |

## Key Behaviors

| Scenario | What Happens |
|----------|--------------|
| First visit to page | API call, result cached |
| Navigate away and back (within TTL) | Cache hit, no API call |
| Navigate away and back (after TTL) | Cache miss, API call |
| Hard refresh (F5/Cmd+R) | Cache cleared, API call |
| After create/update/delete | Relevant cache invalidated |
| Close tab and reopen | Cache cleared (in-memory only) |

## Comparison with SWR/React Query

| Feature | This Pattern | SWR/React Query |
|---------|--------------|-----------------|
| Reduces API calls | Yes | No (revalidates in background) |
| Shows stale data instantly | No | Yes |
| Complexity | Simple | More complex |
| Bundle size | ~1KB | ~10-15KB |
| TTL support | Built-in | Requires config |
| Best for | Reducing server load | Real-time UX |

## When to Use This Pattern

**Good fit:**
- Single-user apps (user owns their data)
- Admin dashboards
- Data that doesn't change frequently
- Want to reduce server/database load

**Not ideal for:**
- Collaborative real-time apps
- Data that changes frequently by others
- When showing stale data briefly is acceptable

## Files Structure

```
src/lib/
├── cache.ts       # Cache class and utilities
└── api.ts         # API client with withCache wrappers
```
