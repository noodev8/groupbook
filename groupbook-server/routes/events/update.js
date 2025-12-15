/*
=======================================================================================================================================
API Route: update_event
=======================================================================================================================================
Method: PUT
Purpose: Updates an existing event's details. Only the event owner can update their events.
=======================================================================================================================================
Request Payload:
{
  "event_id": 1,                              // integer, required
  "event_name": "Sarah's Birthday Dinner",    // string, required
  "event_date_time": "2025-01-15T19:00:00",   // string (ISO datetime), required
  "cutoff_datetime": "2025-01-14T12:00:00",   // string (ISO datetime), optional (null to clear)
  "party_lead_name": "Sarah Jones",           // string, optional (null to clear)
  "party_lead_email": "sarah@example.com",    // string, optional (null to clear)
  "party_lead_phone": "07700 900123",         // string, optional (null to clear)
  "menu_link": "https://restaurant.com/menu", // string (URL), optional (null to clear)
  "staff_notes": "VIP customer"               // string, optional (null to clear)
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
    "menu_link": "https://restaurant.com/menu",
    "staff_notes": "VIP customer",
    "link_token": "a1b2c3d4e5f6...",
    "created_at": "2025-01-10T12:00:00.000Z"
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"INVALID_DATE"
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

router.put('/update', verifyToken, async (req, res) => {
  logApiCall('update_event');

  try {
    const {
      event_id,
      event_name,
      event_date_time,
      cutoff_datetime,
      party_lead_name,
      party_lead_email,
      party_lead_phone,
      menu_link,
      staff_notes
    } = req.body;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!event_id || !event_name || !event_date_time) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Event ID, name, and date/time are required',
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
        message: 'You do not have permission to update this event',
      });
    }

    // ---------------------------------------------------------------
    // Update the event in the database
    // ---------------------------------------------------------------
    const updateResult = await query(
      `UPDATE event SET
        event_name = $1,
        event_date_time = $2,
        cutoff_datetime = $3,
        party_lead_name = $4,
        party_lead_email = $5,
        party_lead_phone = $6,
        menu_link = $7,
        staff_notes = $8
      WHERE id = $9
      RETURNING id, event_name, event_date_time, cutoff_datetime, party_lead_name, party_lead_email, party_lead_phone, menu_link, staff_notes, link_token, restaurant_name, created_at`,
      [
        event_name.trim(),
        eventDateTime,
        cutoffDatetimeValue,
        party_lead_name?.trim() || null,
        party_lead_email?.trim() || null,
        party_lead_phone?.trim() || null,
        menu_link?.trim() || null,
        staff_notes?.trim() || null,
        event_id
      ]
    );

    const updatedEvent = updateResult.rows[0];

    // ---------------------------------------------------------------
    // Return success response with the updated event
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      event: {
        id: updatedEvent.id,
        event_name: updatedEvent.event_name,
        event_date_time: updatedEvent.event_date_time,
        cutoff_datetime: updatedEvent.cutoff_datetime,
        party_lead_name: updatedEvent.party_lead_name,
        party_lead_email: updatedEvent.party_lead_email,
        party_lead_phone: updatedEvent.party_lead_phone,
        menu_link: updatedEvent.menu_link,
        staff_notes: updatedEvent.staff_notes,
        link_token: updatedEvent.link_token,
        restaurant_name: updatedEvent.restaurant_name,
        created_at: updatedEvent.created_at,
      },
    });

  } catch (error) {
    console.error('Update event error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
