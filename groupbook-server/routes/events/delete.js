/*
=======================================================================================================================================
API Route: delete_event
=======================================================================================================================================
Method: DELETE
Purpose: Permanently deletes an event and all associated guests. Only the event owner can delete their events.
=======================================================================================================================================
Request Payload:
{
  "event_id": 1    // integer, required
}

Success Response:
{
  "return_code": "SUCCESS",
  "message": "Event deleted successfully"
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
const { withTransaction } = require('../../utils/transaction');

router.delete('/delete', verifyToken, async (req, res) => {
  logApiCall('delete_event');

  try {
    const { event_id } = req.body;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!event_id) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Event ID is required',
      });
    }

    // ---------------------------------------------------------------
    // Check if event exists and belongs to the authenticated user
    // ---------------------------------------------------------------
    const eventCheck = await query(
      'SELECT id, app_user_id, event_name FROM event WHERE id = $1',
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
        message: 'You do not have permission to delete this event',
      });
    }

    // ---------------------------------------------------------------
    // Delete event and guests in a transaction
    // Guests are deleted first due to foreign key constraint
    // ---------------------------------------------------------------
    await withTransaction(async (client) => {
      // Delete all guests for this event
      await client.query(
        'DELETE FROM guest WHERE event_id = $1',
        [event_id]
      );

      // Delete the event
      await client.query(
        'DELETE FROM event WHERE id = $1',
        [event_id]
      );
    });

    // ---------------------------------------------------------------
    // Return success response
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      message: 'Event deleted successfully',
    });

  } catch (error) {
    console.error('Delete event error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
