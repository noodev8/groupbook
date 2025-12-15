/*
=======================================================================================================================================
API Route: get_event_public
=======================================================================================================================================
Method: GET
Purpose: Retrieves a single event by its public link_token. Authentication is optional.
         Used by guests to view event details before joining.
         If authenticated user owns the event, is_owner will be true.
         Includes branding (logo_url, hero_image_url) from the restaurant owner.
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
    "menu_link": "https://example.com/menu.pdf",
    "is_locked": false,
    "guest_count": 8
  },
  "guests": [
    { "id": 1, "name": "Alex", "food_order": "Steak pie", "dietary_notes": "Nut allergy" }
  ],
  "branding": {
    "logo_url": "https://res.cloudinary.com/...",
    "hero_image_url": "https://res.cloudinary.com/...",
    "terms_link": "https://restaurant.com/terms"
  },
  "is_owner": false
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
const { optionalAuth } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

router.get('/public/:link_token', optionalAuth, async (req, res) => {
  logApiCall('get_event_public');

  try {
    const linkToken = req.params.link_token;

    // ---------------------------------------------------------------
    // Fetch the event by link_token with branding from app_user
    // Include app_user_id for ownership check
    // Only return public-safe fields (no party lead contact details)
    // ---------------------------------------------------------------
    const eventResult = await query(
      `SELECT
         e.id,
         e.app_user_id,
         e.event_name,
         e.event_date_time,
         e.cutoff_datetime,
         e.restaurant_name,
         e.menu_link,
         e.is_locked,
         u.logo_url,
         u.hero_image_url,
         u.terms_link
       FROM event e
       JOIN app_user u ON e.app_user_id = u.id
       WHERE e.link_token = $1`,
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
    // Fetch all guests for this event
    // ---------------------------------------------------------------
    const guestsResult = await query(
      `SELECT id, name, food_order, dietary_notes, created_at
       FROM guest
       WHERE event_id = $1
       ORDER BY created_at ASC`,
      [event.id]
    );

    // ---------------------------------------------------------------
    // Check if authenticated user owns this event
    // ---------------------------------------------------------------
    const isOwner = req.user ? req.user.id === event.app_user_id : false;

    // ---------------------------------------------------------------
    // Return success response with event, guests, and branding
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      event: {
        id: event.id,
        event_name: event.event_name,
        event_date_time: event.event_date_time,
        cutoff_datetime: event.cutoff_datetime,
        restaurant_name: event.restaurant_name,
        menu_link: event.menu_link,
        is_locked: event.is_locked,
        guest_count: guestsResult.rows.length,
      },
      guests: guestsResult.rows,
      branding: {
        logo_url: event.logo_url || null,
        hero_image_url: event.hero_image_url || null,
        terms_link: event.terms_link || null,
      },
      is_owner: isOwner,
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
