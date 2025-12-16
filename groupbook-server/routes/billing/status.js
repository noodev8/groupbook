/*
=======================================================================================================================================
API Route: billing_status
=======================================================================================================================================
Method: GET
Purpose: Returns the current billing/subscription status for the authenticated user.
         Used by frontend to display plan info and enforce limits.
=======================================================================================================================================
Request Payload: None (uses authenticated user)

Success Response (Pro user):
{
  "return_code": "SUCCESS",
  "billing": {
    "status": "active",
    "plan": "monthly",
    "current_period_end": "2025-02-15T00:00:00.000Z",
    "event_count": 3,
    "event_limit": null
  }
}

Success Response (Free user):
{
  "return_code": "SUCCESS",
  "billing": {
    "status": "free",
    "plan": null,
    "current_period_end": null,
    "event_count": 1,
    "event_limit": 1
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

const config = require('../../config/config');
const { query } = require('../../database');
const { verifyToken } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');

router.get('/status', verifyToken, async (req, res) => {
  logApiCall('billing_status');

  try {
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Get user billing info
    // ---------------------------------------------------------------
    const userResult = await query(
      `SELECT
        subscription_status,
        subscription_price_id,
        subscription_current_period_end
      FROM app_user WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        return_code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // ---------------------------------------------------------------
    // Get event count
    // ---------------------------------------------------------------
    const eventResult = await query(
      'SELECT COUNT(*) as count FROM event WHERE app_user_id = $1',
      [userId]
    );

    const eventCount = parseInt(eventResult.rows[0].count, 10);

    // ---------------------------------------------------------------
    // Determine plan type from price ID
    // ---------------------------------------------------------------
    let plan = null;
    if (user.subscription_price_id === config.stripe.priceMonthly) {
      plan = 'monthly';
    } else if (user.subscription_price_id === config.stripe.priceAnnual) {
      plan = 'annual';
    }

    // ---------------------------------------------------------------
    // Determine if user is on active paid plan
    // ---------------------------------------------------------------
    const isActive = user.subscription_status === 'active' || user.subscription_status === 'cancelled';
    // Note: 'cancelled' status means they cancelled but still have access until period end

    // ---------------------------------------------------------------
    // Build response
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      billing: {
        status: user.subscription_status || 'free',
        plan: plan,
        current_period_end: user.subscription_current_period_end,
        event_count: eventCount,
        event_limit: isActive ? null : 1, // null = unlimited
      },
    });

  } catch (error) {
    console.error('Billing status error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
