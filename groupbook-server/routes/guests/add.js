/*
=======================================================================================================================================
API Route: add_guest
=======================================================================================================================================
Method: POST
Purpose: Allows a guest to add themselves to an event using the public link_token.
         No authentication required. Enforces cutoff datetime.
=======================================================================================================================================
Request Payload:
{
  "link_token": "a1b2c3d4e5f6...",    // string, required - event's public link
  "name": "John Smith"                 // string, required - guest's name
}

Success Response:
{
  "return_code": "SUCCESS",
  "guest": {
    "id": 1,
    "name": "John Smith",
    "created_at": "2025-01-10T14:30:00.000Z"
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"EVENT_NOT_FOUND"
"REGISTRATION_CLOSED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();

const { query } = require('../../database');
const { logApiCall } = require('../../utils/apiLogger');

router.post('/add', async (req, res) => {
  logApiCall('add_guest');

  try {
    const { link_token, name } = req.body;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!link_token || !name || !name.trim()) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Link token and name are required',
      });
    }

    const trimmedName = name.trim();

    // ---------------------------------------------------------------
    // Find the event by link_token
    // ---------------------------------------------------------------
    const eventResult = await query(
      'SELECT id, cutoff_datetime FROM event WHERE link_token = $1',
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
    // Check if registration cutoff has passed
    // ---------------------------------------------------------------
    if (event.cutoff_datetime) {
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
    // Insert the new guest
    // ---------------------------------------------------------------
    const insertResult = await query(
      `INSERT INTO guest (event_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [event.id, trimmedName]
    );

    const newGuest = insertResult.rows[0];

    // ---------------------------------------------------------------
    // Return success response with guest details
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      guest: {
        id: newGuest.id,
        name: newGuest.name,
        created_at: newGuest.created_at,
      },
    });

  } catch (error) {
    console.error('Add guest error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
