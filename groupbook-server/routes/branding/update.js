/*
=======================================================================================================================================
API Route: update_branding
=======================================================================================================================================
Method: PUT
Purpose: Updates the branding settings (logo and hero image URLs) for the authenticated user.
=======================================================================================================================================
Request Payload:
{
  "logo_url": "https://res.cloudinary.com/...",      // string or null, optional
  "hero_image_url": "https://res.cloudinary.com/...", // string or null, optional
  "terms_link": "https://restaurant.com/terms"       // string or null, optional
}

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

router.put('/update', verifyToken, async (req, res) => {
  logApiCall('update_branding');

  try {
    const userId = req.user.id;
    const { logo_url, hero_image_url, terms_link } = req.body;

    // ---------------------------------------------------------------
    // Update branding settings
    // Directly set values - null means remove the image
    // ---------------------------------------------------------------
    const result = await query(
      `UPDATE app_user
       SET logo_url = $1,
           hero_image_url = $2,
           terms_link = $3
       WHERE id = $4
       RETURNING logo_url, hero_image_url, terms_link`,
      [logo_url, hero_image_url, terms_link, userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        return_code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const updated = result.rows[0];

    return res.json({
      return_code: 'SUCCESS',
      branding: {
        logo_url: updated.logo_url || null,
        hero_image_url: updated.hero_image_url || null,
        terms_link: updated.terms_link || null,
      },
    });

  } catch (error) {
    console.error('Update branding error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
