/*
=======================================================================================================================================
API Route: create_event
=======================================================================================================================================
Method: POST
Purpose: Creates a new group booking event for the authenticated restaurant user.
         Generates a unique link_token for the shareable public link.
=======================================================================================================================================
Request Payload:
{
  "event_name": "Sarah's Birthday Dinner",    // string, required
  "event_date_time": "2025-01-15T19:00:00",   // string (ISO datetime), required
  "cutoff_datetime": "2025-01-14T12:00:00",   // string (ISO datetime), optional
  "party_lead_name": "Sarah Jones",           // string, optional
  "party_lead_email": "sarah@example.com",    // string, optional
  "party_lead_phone": "07700 900123"          // string, optional
}

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
    "link_token": "a1b2c3d4e5f6...",
    "created_at": "2025-01-10T12:00:00.000Z"
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"INVALID_DATE"
"UNAUTHORIZED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const { query } = require('../../database');
const { verifyToken } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

router.post('/create', verifyToken, async (req, res) => {
  logApiCall('create_event');

  try {
    const {
      event_name,
      event_date_time,
      cutoff_datetime,
      party_lead_name,
      party_lead_email,
      party_lead_phone
    } = req.body;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!event_name || !event_date_time) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Event name and date/time are required',
      });
    }

    // ---------------------------------------------------------------
    // Validate event_date_time is a valid date
    // ---------------------------------------------------------------
    const eventDateTime = new Date(event_date_time);
    if (isNaN(eventDateTime.getTime())) {
      return res.json({
        return_code: 'INVALID_DATE',
        message: 'Invalid event date/time format',
      });
    }

    // ---------------------------------------------------------------
    // Validate cutoff_datetime if provided
    // ---------------------------------------------------------------
    let cutoffDatetimeValue = null;
    if (cutoff_datetime) {
      const cutoffParsed = new Date(cutoff_datetime);
      if (isNaN(cutoffParsed.getTime())) {
        return res.json({
          return_code: 'INVALID_DATE',
          message: 'Invalid cutoff date/time format',
        });
      }
      cutoffDatetimeValue = cutoffParsed;
    }

    // ---------------------------------------------------------------
    // Get the restaurant name from the user record
    // We store it denormalized on the event for easier reporting
    // ---------------------------------------------------------------
    const userResult = await query(
      'SELECT restaurant_name FROM app_user WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        return_code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const restaurantName = userResult.rows[0].restaurant_name;

    // ---------------------------------------------------------------
    // Generate a unique link_token for the shareable link
    // Using crypto.randomBytes for secure random string
    // ---------------------------------------------------------------
    const linkToken = crypto.randomBytes(32).toString('hex');

    // ---------------------------------------------------------------
    // Insert the new event into the database
    // ---------------------------------------------------------------
    const insertResult = await query(
      `INSERT INTO event (
        app_user_id,
        restaurant_name,
        event_name,
        event_date_time,
        cutoff_datetime,
        party_lead_name,
        party_lead_email,
        party_lead_phone,
        link_token
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, event_name, event_date_time, cutoff_datetime, party_lead_name, party_lead_email, party_lead_phone, link_token, created_at`,
      [
        userId,
        restaurantName,
        event_name.trim(),
        eventDateTime,
        cutoffDatetimeValue,
        party_lead_name?.trim() || null,
        party_lead_email?.trim() || null,
        party_lead_phone?.trim() || null,
        linkToken
      ]
    );

    const newEvent = insertResult.rows[0];

    // ---------------------------------------------------------------
    // Return success response with the created event
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      event: {
        id: newEvent.id,
        event_name: newEvent.event_name,
        event_date_time: newEvent.event_date_time,
        cutoff_datetime: newEvent.cutoff_datetime,
        party_lead_name: newEvent.party_lead_name,
        party_lead_email: newEvent.party_lead_email,
        party_lead_phone: newEvent.party_lead_phone,
        link_token: newEvent.link_token,
        created_at: newEvent.created_at,
      },
    });

  } catch (error) {
    console.error('Create event error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
