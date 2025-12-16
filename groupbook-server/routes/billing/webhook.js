/*
=======================================================================================================================================
API Route: billing_webhook
=======================================================================================================================================
Method: POST
Purpose: Handles Stripe webhook events for subscription lifecycle management.
         Updates user subscription status based on payment events.
NOTE: This route requires raw body for Stripe signature verification.
      It must be registered BEFORE express.json() middleware in server.js.
=======================================================================================================================================
Webhook Events Handled:
- checkout.session.completed: New subscription created
- customer.subscription.updated: Subscription changed (plan switch, renewal)
- customer.subscription.deleted: Subscription cancelled or expired
- invoice.payment_failed: Payment attempt failed
- invoice.payment_succeeded: Payment successful (clears past_due)
=======================================================================================================================================
Return Codes:
"SUCCESS" - Webhook processed
"INVALID_SIGNATURE" - Stripe signature verification failed
"SERVER_ERROR" - Processing error
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const config = require('../../config/config');
const { query } = require('../../database');
const { logApiCall } = require('../../utils/apiLogger');

const stripe = new Stripe(config.stripe.secretKey);

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  logApiCall('billing_webhook');

  const sig = req.headers['stripe-signature'];
  let event;

  // ---------------------------------------------------------------
  // Verify webhook signature
  // ---------------------------------------------------------------
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      return_code: 'INVALID_SIGNATURE',
      message: 'Webhook signature verification failed',
    });
  }

  // ---------------------------------------------------------------
  // Handle the event
  // ---------------------------------------------------------------
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ return_code: 'SUCCESS', received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      return_code: 'SERVER_ERROR',
      message: 'Webhook processing failed',
    });
  }
});

// =======================================================================
// Event Handlers
// =======================================================================

async function handleCheckoutCompleted(session) {
  // Get user ID from metadata (set when creating checkout session)
  const appUserId = session.metadata?.app_user_id;
  if (!appUserId) {
    console.error('No app_user_id in checkout session metadata');
    return;
  }

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Update user record with subscription details
  await query(
    `UPDATE app_user SET
      stripe_customer_id = $1,
      stripe_subscription_id = $2,
      subscription_status = $3,
      subscription_price_id = $4,
      subscription_current_period_end = to_timestamp($5)
    WHERE id = $6`,
    [
      session.customer,
      session.subscription,
      'active',
      subscription.items.data[0]?.price.id || null,
      subscription.current_period_end,
      appUserId,
    ]
  );

  console.log(`Subscription activated for user ${appUserId}`);
}

async function handleSubscriptionUpdated(subscription) {
  // Determine status
  let status = 'active';
  if (subscription.cancel_at_period_end) {
    status = 'cancelled'; // Will cancel at end of period
  } else if (subscription.status === 'past_due') {
    status = 'past_due';
  } else if (subscription.status === 'active') {
    status = 'active';
  }

  // Update user by stripe_customer_id
  await query(
    `UPDATE app_user SET
      subscription_status = $1,
      subscription_price_id = $2,
      subscription_current_period_end = to_timestamp($3)
    WHERE stripe_customer_id = $4`,
    [
      status,
      subscription.items.data[0]?.price.id || null,
      subscription.current_period_end,
      subscription.customer,
    ]
  );

  console.log(`Subscription updated for customer ${subscription.customer}: ${status}`);
}

async function handleSubscriptionDeleted(subscription) {
  // Subscription ended - revert to free tier
  await query(
    `UPDATE app_user SET
      subscription_status = 'free',
      stripe_subscription_id = NULL,
      subscription_price_id = NULL,
      subscription_current_period_end = NULL
    WHERE stripe_customer_id = $1`,
    [subscription.customer]
  );

  console.log(`Subscription deleted for customer ${subscription.customer}`);
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) return;

  // Mark as past_due
  await query(
    `UPDATE app_user SET subscription_status = 'past_due'
    WHERE stripe_customer_id = $1`,
    [invoice.customer]
  );

  console.log(`Payment failed for customer ${invoice.customer}`);
}

async function handlePaymentSucceeded(invoice) {
  if (!invoice.subscription) return;

  // Clear past_due status if it was set
  await query(
    `UPDATE app_user SET subscription_status = 'active'
    WHERE stripe_customer_id = $1 AND subscription_status = 'past_due'`,
    [invoice.customer]
  );

  console.log(`Payment succeeded for customer ${invoice.customer}`);
}

module.exports = router;
