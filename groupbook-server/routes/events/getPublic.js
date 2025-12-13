/*
=======================================================================================================================================
API Route: get_event_public
=======================================================================================================================================
Method: GET
Purpose: Retrieves a single event by its public link_token. No authentication required.
         Used by guests to view event details before joining.
=======================================================================================================================================
Request: GET /api/events/public/:link_token

Success Response:
{
  "return_code": "SUCCESS",
  "event": {
    "id": 1,
    "event_name": "Sarah's Birthday Dinner",
    "event_date_time": "2025-01-15T19:00:00.000Z",
    "cutoff_datetime": "2025-01-14T12:00:00.000Z",
    "restaurant_name": "The Good Fork",
    "guest_count": 8
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"EVENT_NOT_FOUND"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();

const { query } = require('../../database');
const { logApiCall } = require('../../utils/apiLogger');

router.get('/public/:link_token', async (req, res) => {
  logApiCall('get_event_public');

  try {
    const linkToken = req.params.link_token;

    // ---------------------------------------------------------------
    // Fetch the event by link_token with guest count
    // Only return public-safe fields (no party lead contact details)
    // ---------------------------------------------------------------
    const eventResult = await query(
      `SELECT
         e.id,
         e.event_name,
         e.event_date_time,
         e.cutoff_datetime,
         e.restaurant_name,
         COUNT(g.id)::int AS guest_count
       FROM event e
       LEFT JOIN guest g ON g.event_id = e.id
       WHERE e.link_token = $1
       GROUP BY e.id`,
      [linkToken]
    );

    // ---------------------------------------------------------------
    // Check if event exists
    // ---------------------------------------------------------------
    if (eventResult.rows.length === 0) {
      return res.json({
        return_code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    const event = eventResult.rows[0];

    // ---------------------------------------------------------------
    // Return success response with public event details
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      event: {
        id: event.id,
        event_name: event.event_name,
        event_date_time: event.event_date_time,
        cutoff_datetime: event.cutoff_datetime,
        restaurant_name: event.restaurant_name,
        guest_count: event.guest_count,
      },
    });

  } catch (error) {
    console.error('Get public event error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
