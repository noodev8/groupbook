# Group Booking Coordination — MVP Specification

## Purpose

Provide restaurants with a simple way to coordinate group bookings **after** the initial enquiry, without chasing emails, WhatsApps, or spreadsheets.

This tool does **not** replace booking systems.  
It sits alongside them to manage guest coordination.

---

## Problem Statement

Restaurants regularly accept group bookings (birthdays, work meals, celebrations).

The pain occurs **after the booking is accepted**:
- Guest numbers change
- Menu choices are unclear
- Staff chase organisers
- Information is fragmented across messages
- Not all original participants arrive

The result is wasted time, mistakes, and stress.

---

## MVP Goal

Give restaurants **one live link** that shows:
- Who is attending
- What they’ve chosen
- Whether the group is complete

Nothing more.

---

## Core Concept

One group booking = one coordination link.

Actors:
- Restaurant staff
- Group organiser
- Guests

No accounts for guests.  
No payments in MVP.

---

## Single MVP Workflow

### 1. Restaurant Creates Group Booking

Restaurant staff creates a group booking with:

- Event name
- Date & time
- Menu (fixed menu or selectable options)
- Guest cut-off date

System generates:
- A unique, shareable organiser link

---

### 2. Organiser Shares Link

Organiser:
- Opens the link
- Sees event summary
- Shares the same link with guests (WhatsApp, email, etc.)

No login required.

---

### 3. Guests Join

Each guest:
- Opens the link
- Enters name
- Selects menu option (if applicable)
- Confirms attendance

Guest immediately appears in the event list.

---

### 4. Restaurant Views Summary

Restaurant can view:
- Guest list
- Menu choice counts
- Total guest count

Optionally export or copy summary.

---

## Data Model (MVP)

### Event
- id
- restaurant_name
- event_name
- event_date_time
- price_per_head
- cutoff_date
- created_at

### MenuOption
- id
- event_id
- label (e.g. “Meat”, “Veg”, “Fish”)

### Guest
- id
- event_id
- name
- menu_option_id
- created_at

---

## What Is Explicitly Out of Scope

The MVP must **not** include:

- Payments or deposits
- Online booking or table allocation
- Messaging or chat
- Notifications beyond basic confirmation
- POS or booking system integrations
- White-labeling
- Multi-venue support
- Staff roles or permissions
- Menu management beyond simple options

If it’s not required to answer:
> “Who’s coming and what are they having?”

…it does not belong in MVP.

---

## Definition of Done

The MVP is complete when:

- A restaurant can create a group booking in under 2 minutes
- An organiser can share one link
- Guests can add themselves without help
- The restaurant can see a live summary

UI can be basic.  
No optimisation required.

When this works end-to-end → **ship**.

---

## Non-Goals

This MVP does **not** attempt to:
- Solve all group booking problems
- Replace existing systems
- Be future-proof

It exists to validate:
- Is this coordination problem painful enough?
- Will restaurants value this clarity?

---

## Kill Criteria

This MVP should be abandoned if:
- Restaurants say “this is nice but unnecessary”
- They prefer manual methods even after seeing it
- They don’t reuse it after one event

Failure is acceptable and informative.

---

## Build Principle

Ship something small that works.  
Do not add features because they feel “obvious”.

Momentum comes from completion.
