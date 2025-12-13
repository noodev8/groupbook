/*
=======================================================================================================================================
API Route: list_guests
=======================================================================================================================================
Method: GET
Purpose: Retrieves all guests for a specific event.
         Verifies the authenticated user owns the event before returning guests.
=======================================================================================================================================
Request: GET /api/guests/list/:event_id

Success Response:
{
  "return_code": "SUCCESS",
  "guests": [
    {
      "id": 1,
      "name": "John Smith",
      "created_at": "2025-01-10T14:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Jane Doe",
      "created_at": "2025-01-10T15:45:00.000Z"
    }
  ]
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
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

router.get('/list/:event_id', verifyToken, async (req, res) => {
  logApiCall('list_guests');

  try {
    const eventId = req.params.event_id;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // First verify the event exists and belongs to the user
    // ---------------------------------------------------------------
    const eventResult = await query(
      'SELECT id, app_user_id FROM event WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.json({
        return_code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    const event = eventResult.rows[0];

    // Check ownership
    if (event.app_user_id !== userId) {
      return res.json({
        return_code: 'FORBIDDEN',
        message: 'You do not have permission to view guests for this event',
      });
    }

    // ---------------------------------------------------------------
    // Fetch all guests for this event
    // Ordered by created_at so newest guests appear last
    // ---------------------------------------------------------------
    const guestsResult = await query(
      `SELECT id, name, created_at
       FROM guest
       WHERE event_id = $1
       ORDER BY created_at ASC`,
      [eventId]
    );

    // ---------------------------------------------------------------
    // Return success response with guests list
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      guests: guestsResult.rows,
    });

  } catch (error) {
    console.error('List guests error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
