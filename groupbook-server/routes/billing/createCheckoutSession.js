/*
=======================================================================================================================================
API Route: create_checkout_session
=======================================================================================================================================
Method: POST
Purpose: Creates a Stripe Checkout session for subscription purchase.
         Returns the checkout URL for redirect.
=======================================================================================================================================
Request Payload:
{
  "price_type": "monthly" | "annual"   // string, required
}

Success Response:
{
  "return_code": "SUCCESS",
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_xxx..."
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"INVALID_PRICE_TYPE"
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

router.post('/create-checkout-session', verifyToken, async (req, res) => {
  logApiCall('create_checkout_session');

  try {
    const { price_type } = req.body;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!price_type) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'price_type is required',
      });
    }

    // ---------------------------------------------------------------
    // Determine price ID based on type
    // ---------------------------------------------------------------
    let priceId;
    if (price_type === 'monthly') {
      priceId = config.stripe.priceMonthly;
    } else if (price_type === 'annual') {
      priceId = config.stripe.priceAnnual;
    } else {
      return res.json({
        return_code: 'INVALID_PRICE_TYPE',
        message: 'price_type must be "monthly" or "annual"',
      });
    }

    // ---------------------------------------------------------------
    // Get user details
    // ---------------------------------------------------------------
    const userResult = await query(
      'SELECT id, email, stripe_customer_id FROM app_user WHERE id = $1',
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
    // Get or create Stripe customer
    // ---------------------------------------------------------------
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          app_user_id: user.id.toString(),
        },
      });
      customerId = customer.id;

      // Store customer ID for future use
      await query(
        'UPDATE app_user SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );
    }

    // ---------------------------------------------------------------
    // Build success/cancel URLs
    // ---------------------------------------------------------------
    const clientUrl = Array.isArray(config.clientUrl) ? config.clientUrl[0] : config.clientUrl;
    const successUrl = `${clientUrl}/dashboard?billing=success`;
    const cancelUrl = `${clientUrl}/dashboard?billing=cancelled`;

    // ---------------------------------------------------------------
    // Create Checkout Session
    // ---------------------------------------------------------------
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        app_user_id: user.id.toString(),
      },
    });

    return res.json({
      return_code: 'SUCCESS',
      checkout_url: session.url,
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
