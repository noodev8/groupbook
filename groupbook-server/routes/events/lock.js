/*
=======================================================================================================================================
API Route: toggle_event_lock
=======================================================================================================================================
Method: PUT
Purpose: Toggles the is_locked status of an event. Only the event owner can lock/unlock their events.
=======================================================================================================================================
Request Payload:
{
  "event_id": 1,        // integer, required
  "is_locked": true     // boolean, required
}

Success Response:
{
  "return_code": "SUCCESS",
  "event": {
    "id": 1,
    "is_locked": true
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"EVENT_NOT_FOUND"
"FORBIDDEN"
"UNAUTHORIZED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();

const { query } = require('../../database');
const { verifyToken } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

router.put('/lock', verifyToken, async (req, res) => {
  logApiCall('toggle_event_lock');

  try {
    const { event_id, is_locked } = req.body;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!event_id || typeof is_locked !== 'boolean') {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Event ID and is_locked (boolean) are required',
      });
    }

    // ---------------------------------------------------------------
    // Check if event exists and belongs to the authenticated user
    // ---------------------------------------------------------------
    const eventCheck = await query(
      'SELECT id, app_user_id FROM event WHERE id = $1',
      [event_id]
    );

    if (eventCheck.rows.length === 0) {
      return res.json({
        return_code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    if (eventCheck.rows[0].app_user_id !== userId) {
      return res.json({
        return_code: 'FORBIDDEN',
        message: 'You do not have permission to modify this event',
      });
    }

    // ---------------------------------------------------------------
    // Update the is_locked status
    // ---------------------------------------------------------------
    const updateResult = await query(
      'UPDATE event SET is_locked = $1 WHERE id = $2 RETURNING id, is_locked',
      [is_locked, event_id]
    );

    const updatedEvent = updateResult.rows[0];

    // ---------------------------------------------------------------
    // Return success response
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      event: {
        id: updatedEvent.id,
        is_locked: updatedEvent.is_locked,
      },
    });

  } catch (error) {
    console.error('Toggle event lock error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
