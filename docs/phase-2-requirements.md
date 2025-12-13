# Group Book — Phase 2 Requirements

## Overview

Phase 2 builds on the MVP to give restaurant staff full control and improve the guest experience. The core principle remains: answer "Who's coming?" as simply as possible.

**Design Philosophy: WhatsApp Parity**

The public event link works like a WhatsApp group:
- Anyone can see who's attending and what they're having
- Anyone can add themselves
- You can only edit/remove **yourself** (not others)
- Staff have full control via the authenticated dashboard

This keeps it simple and prevents bad actors from messing with other people's RSVPs.

---

## 1. Guest Experience Enhancements

### 1.1 View Attendee List
Guests can see who else is attending when they open the event link.
- Display list of guest names and their food choices
- Prevents duplicate registrations ("I already signed up")
- Creates social proof and encourages sign-ups

### 1.2 Food Choices / Dietary Requirements
Guests can enter their food preferences or dietary requirements.
- Free-text area (not structured menu selection)
- Optional field
- Examples: "Vegetarian", "Gluten-free", "No shellfish"
- Visible to everyone (staff, organiser, other guests)

### 1.3 Edit Own Registration
Guests can modify **their own** registration after signing up.
- Edit their name
- Update food choices
- Remove themselves from the list (un-RSVP)

**How we identify "their own" record:**
- Session cookie token (same browser = can edit)
- Hybrid option: optional email for cross-device access (later enhancement)

**Accepted limitations:**
- Switch browser/device or clear cookies = lost edit access
- In that case: contact staff, or just add yourself again
- This mirrors WhatsApp: your phone = your identity

---

## 2. Staff Controls

Restaurant staff (authenticated via dashboard) have complete control.

### 2.1 Edit Event Details
Staff can modify:
- Event name
- Date and time
- Cutoff date/time
- Party lead contact details

### 2.2 Manage Guest List
Staff can:
- Add guests manually (for those who can't use the link)
- Remove guests from the list
- Edit any guest's name
- Edit any guest's food choices

### 2.3 Lock/Unlock Registration
- Toggle switch to lock/unlock guest registration
- When locked: no one can add/edit via public link (shows "Registration locked")
- When unlocked: normal registration flow
- Separate from cutoff date (manual override)

### 2.4 Delete Events
- Permanently delete event and all guests
- Confirmation dialog required

---

## 3. Additional Staff Features

### 3.1 Export Guest List
- Download guest list as CSV
- Include: name, food choices, registration date

### 3.2 Dietary Summary
- Aggregate view of food choices
- Quick reference: "3 vegetarian, 2 gluten-free, 1 nut allergy"

### 3.3 Duplicate Event
- Copy an existing event to create a new one
- Useful for recurring group bookings
- Copies event details but not guest list

### 3.4 Staff Notes
- Internal notes field on event
- Not visible to guests
- Examples: "Table 12 reserved", "Deposit paid"

### 3.5 Archive Past Events
- Move completed events out of main dashboard list
- Keep data accessible but not cluttering the view

---

## 4. Guest Identification (Technical)

### How Session Tokens Work

**On registration:**
1. Generate unique `edit_token` (64-char random string)
2. Store in `guest.edit_token` column
3. Set browser cookie: `guest_token_{event_id}={edit_token}`
4. Cookie settings: HttpOnly, SameSite=Lax, expires in 1 year

**On page load:**
1. Read cookie for this event
2. If cookie exists, find matching guest record
3. If found: highlight their row, show "Edit" and "Remove me" buttons
4. If not found: show normal "Add yourself" form

**Security notes:**
- Token is per-guest, not per-event (can't edit others)
- HttpOnly prevents JavaScript access
- Long expiry so it survives browser restarts

---

## 5. UI/UX Improvements

### 5.1 Confirmation Dialogs
- "Are you sure?" before removing yourself
- "Are you sure?" before staff deleting guests/events

### 5.2 Toast Notifications
- Success/error feedback for actions
- "You've been added to the guest list"
- "Guest removed"
- "Event updated"

### 5.3 Better Date/Time Selection
- Proper date picker components
- Clear formatting

### 5.4 Mobile Optimisation
- Review and improve mobile experience
- Touch-friendly buttons

---

## 6. Security & Validation

### 6.1 Rate Limiting
- Limit registrations per IP (e.g., 10 per hour per event)
- Prevents spam attacks

### 6.2 Input Validation
- Name: max 100 characters
- Food choice: max 500 characters
- Sanitize all inputs

### 6.3 CAPTCHA
- Not needed initially
- Add invisible reCAPTCHA later if spam becomes a problem

---

## 7. Database Schema Changes

```sql
-- =====================================================
-- Guest table modifications
-- =====================================================
ALTER TABLE guest
ADD COLUMN food_choice TEXT,
ADD COLUMN edit_token VARCHAR(64);

CREATE INDEX idx_guest_edit_token ON guest(edit_token);

-- =====================================================
-- Event table modifications
-- =====================================================
ALTER TABLE event
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN staff_notes TEXT;
```

**Notes:**
- `edit_token` is unique per guest, used for session cookie matching
- No soft delete - hard deletes are fine for this use case

---

## 8. Priority Ranking

### Phase 2a (Must Have)
1. View attendee list with food choices (public page)
2. Food choices input field
3. Guest self-edit/remove (session-based)
4. Staff edit event details
5. Staff manage guests (add/edit/remove)
6. Lock/unlock registration

### Phase 2b (Should Have)
7. Export guest list (CSV)
8. Dietary summary view
9. Confirmation dialogs
10. Toast notifications

### Phase 2c (Nice to Have)
11. Duplicate event
12. Archive past events
13. Staff notes field
14. Optional email for cross-device edit access

### Phase 2d (Future Consideration)
15. Organiser elevated access - party lead can manage anyone in their group (add, edit, remove guests) without being staff. Requires organiser authentication mechanism (separate link, PIN, or email verification to party lead email).

---

## 9. Out of Scope (Phase 2)

- Payments or deposits
- Online booking or table allocation
- Multi-venue support
- Staff roles or permissions
- Structured menu options (keep free-text)
- Chat or messaging
- Calendar integrations
- Email notifications
- Real-time updates (polling on refresh is fine)

---

## 10. Resolved Decisions

| Question | Decision |
|----------|----------|
| Organiser special access? | Deferred to Phase 2d - staff only for now |
| Guest edit mechanism? | Session cookie (same browser) |
| Food choices visibility? | Everyone sees everything |
| Bad actor protection? | WhatsApp model (edit self only) - guests can only modify their own record |
| Soft delete needed? | No - hard deletes are fine. Guests re-add themselves, staff manually re-adds if needed |

---

## 11. Success Criteria

Phase 2 is complete when:
- Guests can see attendee list and food choices
- Guests can add themselves with food choices
- Guests can edit/remove themselves (same browser)
- Staff can edit all event details
- Staff can add/edit/remove any guest
- Staff can lock/unlock registration
- Staff can export guest list
