/*
=======================================================================================================================================
API Route: get_event
=======================================================================================================================================
Method: GET
Purpose: Retrieves a single event by ID for the authenticated user.
         Used by the event management page to display event details.
=======================================================================================================================================
Request: GET /api/events/get/:id

Success Response:
{
  "return_code": "SUCCESS",
  "event": {
    "id": 1,
    "event_name": "Sarah's Birthday Dinner",
    "event_date_time": "2025-01-15T19:00:00.000Z",
    "cutoff_datetime": "2025-01-14T12:00:00.000Z",
    "party_lead_name": "Sarah Jones",
    "party_lead_email": "sarah@example.com",
    "party_lead_phone": "07700 900123",
    "menu_link": "https://restaurant.com/menu",
    "link_token": "a1b2c3d4e5f6...",
    "restaurant_name": "The Good Fork",
    "is_locked": false,
    "staff_notes": "VIP customer - comp dessert",
    "created_at": "2025-01-10T12:00:00.000Z"
  }
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

router.get('/get/:id', verifyToken, async (req, res) => {
  logApiCall('get_event');

  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Fetch the event by ID
    // ---------------------------------------------------------------
    const eventResult = await query(
      `SELECT id, app_user_id, event_name, event_date_time, cutoff_datetime,
              party_lead_name, party_lead_email, party_lead_phone, menu_link,
              link_token, restaurant_name, is_locked, staff_notes, created_at
       FROM event
       WHERE id = $1`,
      [eventId]
    );

    // Check if event exists
    if (eventResult.rows.length === 0) {
      return res.json({
        return_code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    const event = eventResult.rows[0];

    // ---------------------------------------------------------------
    // Verify the event belongs to the authenticated user
    // ---------------------------------------------------------------
    if (event.app_user_id !== userId) {
      return res.json({
        return_code: 'FORBIDDEN',
        message: 'You do not have permission to view this event',
      });
    }

    // ---------------------------------------------------------------
    // Return success response with event details
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      event: {
        id: event.id,
        event_name: event.event_name,
        event_date_time: event.event_date_time,
        cutoff_datetime: event.cutoff_datetime,
        party_lead_name: event.party_lead_name,
        party_lead_email: event.party_lead_email,
        party_lead_phone: event.party_lead_phone,
        menu_link: event.menu_link,
        link_token: event.link_token,
        restaurant_name: event.restaurant_name,
        is_locked: event.is_locked,
        staff_notes: event.staff_notes,
        created_at: event.created_at,
      },
    });

  } catch (error) {
    console.error('Get event error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
