/*
=======================================================================================================================================
API Route: remove_guest
=======================================================================================================================================
Method: DELETE
Purpose: Allows anyone to remove a guest using the public link_token.
         No authentication required. Enforces cutoff datetime and lock status.
=======================================================================================================================================
Request Payload:
{
  "link_token": "a1b2c3d4e5f6...",    // string, required - event's public link
  "guest_id": 1                       // number, required - guest to remove
}

Success Response:
{
  "return_code": "SUCCESS",
  "message": "Guest removed"
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

router.delete('/remove', optionalAuth, async (req, res) => {
  logApiCall('remove_guest');

  try {
    const { link_token, guest_id } = req.body;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!link_token || !guest_id) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Link token and guest ID are required',
      });
    }

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
    // Delete the guest
    // ---------------------------------------------------------------
    await query('DELETE FROM guest WHERE id = $1', [guest_id]);

    // ---------------------------------------------------------------
    // Return success response
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      message: 'Guest removed',
    });

  } catch (error) {
    console.error('Remove guest error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
