/*
=======================================================================================================================================
API Route: get_branding
=======================================================================================================================================
Method: GET
Purpose: Retrieves the branding settings (logo and hero image URLs) for the authenticated user.
=======================================================================================================================================
Request: No body required, uses JWT token for authentication.

Success Response:
{
  "return_code": "SUCCESS",
  "branding": {
    "logo_url": "https://res.cloudinary.com/...",
    "hero_image_url": "https://res.cloudinary.com/...",
    "terms_link": "https://restaurant.com/terms"
  }
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

router.get('/get', verifyToken, async (req, res) => {
  logApiCall('get_branding');

  try {
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Fetch branding settings for the user
    // ---------------------------------------------------------------
    const result = await query(
      `SELECT logo_url, hero_image_url, terms_link FROM app_user WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        return_code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    return res.json({
      return_code: 'SUCCESS',
      branding: {
        logo_url: user.logo_url || null,
        hero_image_url: user.hero_image_url || null,
        terms_link: user.terms_link || null,
      },
    });

  } catch (error) {
    console.error('Get branding error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
