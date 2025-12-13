# Project Status

> Update this file at the end of each working session.

## Current Phase

**Phase 2a** - In Progress

## Requirements Document

`docs/phase-2-requirements.md`

## Completed

- **Phase 1 (MVP):** Staff registration/login, create events, share link, guests self-register, view guest list

## In Progress (Phase 2a)

1. View attendee list with food choices (public page)
2. Food choices input field
3. Guest self-edit/remove (session-based)
4. Staff edit event details
5. Staff manage guests (add/edit/remove)
6. Lock/unlock registration

## Database Status

Phase 2 schema applied:
- `guest.food_choice` - TEXT
- `guest.edit_token` - VARCHAR(64)
- `event.is_locked` - BOOLEAN
- `event.staff_notes` - TEXT

## Last Updated

2025-12-13 - Phase 2a starting, schema changes applied
