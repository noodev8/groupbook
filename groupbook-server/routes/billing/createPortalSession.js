/*
=======================================================================================================================================
API Route: create_portal_session
=======================================================================================================================================
Method: POST
Purpose: Creates a Stripe Customer Portal session for subscription management.
         Returns the portal URL for redirect.
=======================================================================================================================================
Request Payload: None (uses authenticated user)

Success Response:
{
  "return_code": "SUCCESS",
  "portal_url": "https://billing.stripe.com/p/session/xxx..."
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"NO_SUBSCRIPTION" - User has no Stripe customer ID
"UNAUTHORIZED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const config = require('../../config/config');
const { query } = require('../../database');
const { verifyToken } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

const stripe = new Stripe(config.stripe.secretKey);

router.post('/create-portal-session', verifyToken, async (req, res) => {
  logApiCall('create_portal_session');

  try {
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Get user's Stripe customer ID
    // ---------------------------------------------------------------
    const userResult = await query(
      'SELECT stripe_customer_id FROM app_user WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        return_code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const customerId = userResult.rows[0].stripe_customer_id;

    if (!customerId) {
      return res.json({
        return_code: 'NO_SUBSCRIPTION',
        message: 'No billing account found. You have not subscribed yet.',
      });
    }

    // ---------------------------------------------------------------
    // Build return URL
    // ---------------------------------------------------------------
    const clientUrl = Array.isArray(config.clientUrl) ? config.clientUrl[0] : config.clientUrl;
    const returnUrl = `${clientUrl}/settings`;

    // ---------------------------------------------------------------
    // Create Portal Session
    // ---------------------------------------------------------------
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.json({
      return_code: 'SUCCESS',
      portal_url: session.url,
    });

  } catch (error) {
    console.error('Create portal session error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
