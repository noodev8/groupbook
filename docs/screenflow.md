# Screenflow — MVP

## Overview

Two distinct experiences:
1. **Restaurant staff** (authenticated) — create events, view summaries
2. **Organiser/Guests** (public via link) — view event, add themselves

---

## Screen 1: Restaurant Login

**URL:** `/login`

**Purpose:** Restaurant staff sign in

**Elements:**
- Email input
- Password input
- Login button

**Actions:**
- Success → redirect to Dashboard
- Fail → show error

---

## Screen 2: Restaurant Dashboard

**URL:** `/dashboard`

**Purpose:** List of restaurant's group bookings

**Elements:**
- Restaurant name (header)
- "Create New Event" button
- List of events showing:
  - Event name
  - Date/time
  - Guest count
  - Link to manage

**Actions:**
- Click "Create New Event" → go to Create Event
- Click event → go to Event Management

---

## Screen 3: Create Event

**URL:** `/dashboard/create`

**Purpose:** Restaurant creates a new group booking

**Elements:**
- Event name input
- Date & time picker
- Cut-off date picker (optional)
- Create button

**Actions:**
- Submit → creates event, generates link_token, redirects to Event Management

---

## Screen 4: Event Management

**URL:** `/dashboard/event/:id`

**Purpose:** Restaurant views and manages a specific event

**Elements:**
- Event name, date/time, cut-off date
- Shareable link (with copy button)
- Guest count
- Guest list (name, time added)
- Back to dashboard link

**Actions:**
- Copy link → copies public URL to clipboard

---

## Screen 5: Public Event Page

**URL:** `/event/:link_token`

**Purpose:** Organiser and guests view event and add themselves

**Elements:**
- Event name
- Restaurant name
- Date & time
- Cut-off date (if set)
- Current guest list (names only)
- "Add Yourself" form:
  - Name input
  - Confirm button

**States:**
- **Open** — form visible, guests can join
- **Closed** — past cut-off date, form hidden, message shown

**Actions:**
- Submit name → adds guest, refreshes list

---

## Link Structure

| Who | URL | Auth |
|-----|-----|------|
| Restaurant staff | `/dashboard/event/:id` | JWT required |
| Organiser/Guests | `/event/:link_token` | None |

The organiser receives the public link (`/event/:link_token`) and shares it directly with guests. Everyone uses the same link.

---

## Not Included (MVP)

- Registration flow (create restaurant accounts manually for now)
- Edit/delete events
- Remove guests
- Email notifications
- Password reset

These can be added post-MVP based on feedback.
