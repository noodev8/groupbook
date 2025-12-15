/*
=======================================================================================================================================
API Route: update_profile
=======================================================================================================================================
Method: PUT
Purpose: Updates the authenticated user's profile settings (currently just restaurant name).
=======================================================================================================================================
Request Payload:
{
  "restaurant_name": "The Good Fork"    // string, required - the new restaurant name
}

Success Response:
{
  "return_code": "SUCCESS",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "restaurant_name": "The Good Fork"
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"UNAUTHORIZED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();

const { query } = require('../../database');
const { verifyToken } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

router.put('/updateProfile', verifyToken, async (req, res) => {
  logApiCall('update_profile');

  try {
    const userId = req.user.id;
    const { restaurant_name } = req.body;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!restaurant_name || !restaurant_name.trim()) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Restaurant name is required',
      });
    }

    // ---------------------------------------------------------------
    // Update the user's restaurant name
    // ---------------------------------------------------------------
    const result = await query(
      `UPDATE app_user
       SET restaurant_name = $1
       WHERE id = $2
       RETURNING id, email, restaurant_name`,
      [restaurant_name.trim(), userId]
    );

    // ---------------------------------------------------------------
    // Check if user was found and updated
    // ---------------------------------------------------------------
    if (result.rows.length === 0) {
      return res.json({
        return_code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    // ---------------------------------------------------------------
    // Return success response with updated user
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      user: {
        id: user.id,
        email: user.email,
        restaurant_name: user.restaurant_name,
      },
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
