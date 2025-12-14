/*
=======================================================================================================================================
API Route: edit_guest
=======================================================================================================================================
Method: PUT
Purpose: Allows anyone to edit a guest's details using the public link_token.
         No authentication required. Enforces cutoff datetime and lock status.
=======================================================================================================================================
Request Payload:
{
  "link_token": "a1b2c3d4e5f6...",    // string, required - event's public link
  "guest_id": 1,                      // number, required - guest to edit
  "name": "John Smith",               // string, required - guest's name
  "food_order": "Steak pie",          // string, optional - food order
  "dietary_notes": "Nut allergy"      // string, optional - dietary requirements
}

Success Response:
{
  "return_code": "SUCCESS",
  "guest": {
    "id": 1,
    "name": "John Smith",
    "food_order": "Steak pie",
    "dietary_notes": "Nut allergy",
    "created_at": "2025-01-10T14:30:00.000Z"
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"EVENT_NOT_FOUND"
"GUEST_NOT_FOUND"
"REGISTRATION_CLOSED"
"REGISTRATION_LOCKED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();

const { query } = require('../../database');
const { optionalAuth } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

router.put('/edit', optionalAuth, async (req, res) => {
  logApiCall('edit_guest');

  try {
    const { link_token, guest_id, name, food_order, dietary_notes } = req.body;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!link_token || !guest_id || !name || !name.trim()) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Link token, guest ID, and name are required',
      });
    }

    const trimmedName = name.trim();
    const trimmedFoodOrder = food_order ? food_order.trim() : null;
    const trimmedDietaryNotes = dietary_notes ? dietary_notes.trim() : null;

    // ---------------------------------------------------------------
    // Find the event by link_token
    // ---------------------------------------------------------------
    const eventResult = await query(
      'SELECT id, app_user_id, cutoff_datetime, is_locked FROM event WHERE link_token = $1',
      [link_token]
    );

    if (eventResult.rows.length === 0) {
      return res.json({
        return_code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    const event = eventResult.rows[0];

    // ---------------------------------------------------------------
    // Check if authenticated user is the event owner
    // Owners can bypass lock and cutoff restrictions
    // ---------------------------------------------------------------
    const isOwner = req.user && req.user.id === event.app_user_id;

    // ---------------------------------------------------------------
    // Check if registration is locked (owners bypass)
    // ---------------------------------------------------------------
    if (event.is_locked && !isOwner) {
      return res.json({
        return_code: 'REGISTRATION_LOCKED',
        message: 'Registration for this event is locked',
      });
    }

    // ---------------------------------------------------------------
    // Check if registration cutoff has passed (owners bypass)
    // ---------------------------------------------------------------
    if (event.cutoff_datetime && !isOwner) {
      const cutoffDate = new Date(event.cutoff_datetime);
      const now = new Date();

      if (now > cutoffDate) {
        return res.json({
          return_code: 'REGISTRATION_CLOSED',
          message: 'Registration for this event has closed',
        });
      }
    }

    // ---------------------------------------------------------------
    // Check guest exists and belongs to this event
    // ---------------------------------------------------------------
    const guestCheck = await query(
      'SELECT id FROM guest WHERE id = $1 AND event_id = $2',
      [guest_id, event.id]
    );

    if (guestCheck.rows.length === 0) {
      return res.json({
        return_code: 'GUEST_NOT_FOUND',
        message: 'Guest not found',
      });
    }

    // ---------------------------------------------------------------
    // Update the guest
    // ---------------------------------------------------------------
    const updateResult = await query(
      `UPDATE guest
       SET name = $1, food_order = $2, dietary_notes = $3
       WHERE id = $4
       RETURNING id, name, food_order, dietary_notes, created_at`,
      [trimmedName, trimmedFoodOrder, trimmedDietaryNotes, guest_id]
    );

    const updatedGuest = updateResult.rows[0];

    // ---------------------------------------------------------------
    // Return success response with guest details
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      guest: {
        id: updatedGuest.id,
        name: updatedGuest.name,
        food_order: updatedGuest.food_order,
        dietary_notes: updatedGuest.dietary_notes,
        created_at: updatedGuest.created_at,
      },
    });

  } catch (error) {
    console.error('Edit guest error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
