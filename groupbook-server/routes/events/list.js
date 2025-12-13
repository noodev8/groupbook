/*
=======================================================================================================================================
API Route: list_events
=======================================================================================================================================
Method: GET
Purpose: Returns all events belonging to the authenticated user, with guest counts.
         Ordered by event date (upcoming first).
=======================================================================================================================================
Request Payload: None (uses JWT token for user identification)

Success Response:
{
  "return_code": "SUCCESS",
  "events": [
    {
      "id": 1,
      "event_name": "Sarah's Birthday Dinner",
      "event_date_time": "2025-01-15T19:00:00.000Z",
      "cutoff_datetime": "2025-01-14T12:00:00.000Z",
      "link_token": "a1b2c3d4e5f6...",
      "guest_count": 8,
      "created_at": "2025-01-10T12:00:00.000Z"
    }
  ]
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"UNAUTHORIZED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();

const { query } = require('../../database');
const { verifyToken } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

router.get('/list', verifyToken, async (req, res) => {
  logApiCall('list_events');

  try {
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Fetch all events for this user with guest counts
    // Using LEFT JOIN to include events with zero guests
    // Ordered by event date ascending (upcoming events first)
    // ---------------------------------------------------------------
    const eventsResult = await query(
      `SELECT
         e.id,
         e.event_name,
         e.event_date_time,
         e.cutoff_datetime,
         e.link_token,
         e.created_at,
         COUNT(g.id)::int AS guest_count
       FROM event e
       LEFT JOIN guest g ON g.event_id = e.id
       WHERE e.app_user_id = $1
       GROUP BY e.id
       ORDER BY e.event_date_time ASC`,
      [userId]
    );

    // ---------------------------------------------------------------
    // Return success response with events list
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      events: eventsResult.rows,
    });

  } catch (error) {
    console.error('List events error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
