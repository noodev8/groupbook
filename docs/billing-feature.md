# Billing Feature Specification

## Overview

GroupBook uses a freemium model with Stripe for payment processing.

| Tier | Price | Limits |
|------|-------|--------|
| Free | £0 | 1 active event |
| Pro Monthly | £35/month | Unlimited events |
| Pro Annual | £299/year (29% saving) | Unlimited events |

**Key principles:**
- Use Stripe-hosted solutions wherever possible (Checkout, Customer Portal, emails)
- Minimal custom billing UI
- Generous on cancel/failure - users keep existing events, just can't create new ones

---

## Stripe Account Setup

Use existing Stripe account: `noodev8@gmail.com`

### 1. Create Product (in Stripe Dashboard)

```
Product name: GroupBook Pro
```

### 2. Create Two Prices

| Price | Amount | Billing |
|-------|--------|---------|
| GroupBook Pro Monthly | £35.00 | Recurring monthly |
| GroupBook Pro Annual | £299.00 | Recurring yearly |

Note the Price IDs (e.g., `price_xxx`) - these go in server `.env`

### 3. Enable Customer Portal

Stripe Dashboard → Settings → Billing → Customer Portal

Enable:
- [ ] View invoice history
- [ ] Update payment methods
- [ ] Cancel subscriptions
- [ ] Switch between prices (monthly ↔ annual)

### 4. Enable Email Receipts

Stripe Dashboard → Settings → Emails

Enable:
- [ ] Successful payments
- [ ] Refunds

### 5. Configure Retry Settings

Stripe Dashboard → Settings → Billing → Subscriptions and emails

Use Stripe's Smart Retries (default) or configure:
- Retry failed payments up to 3 times
- After final failure: Cancel subscription

---

## Database Changes

### Migration: Add billing columns to app_user

```sql
ALTER TABLE app_user ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE app_user ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE app_user ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'free';
ALTER TABLE app_user ADD COLUMN subscription_price_id VARCHAR(255);
ALTER TABLE app_user ADD COLUMN subscription_current_period_end TIMESTAMP;

CREATE INDEX idx_app_user_stripe_customer_id ON app_user(stripe_customer_id);
```

### subscription_status values

| Status | Meaning |
|--------|---------|
| `free` | Never subscribed, or subscription ended |
| `active` | Paid and current |
| `past_due` | Payment failed, Stripe retrying |
| `cancelled` | User cancelled, access until period end |

---

## Environment Variables

### groupbook-server/.env

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx        # Use sk_live_xxx in production
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_ANNUAL=price_xxx
```

### groupbook-web/.env

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## API Endpoints

### POST /billing/create-checkout-session

Creates a Stripe Checkout session and returns the URL.

**Auth:** Required (verifyToken)

**Request:**
```json
{
  "price_type": "monthly" | "annual"
}
```

**Response:**
```json
{
  "return_code": "SUCCESS",
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_xxx"
}
```

**Logic:**
1. Get user from JWT
2. If user has no `stripe_customer_id`, create Stripe Customer
3. Create Checkout Session with:
   - `customer`: stripe_customer_id
   - `mode`: "subscription"
   - `price`: based on price_type
   - `success_url`: `{CLIENT_URL}/dashboard?billing=success`
   - `cancel_url`: `{CLIENT_URL}/dashboard?billing=cancelled`
   - `metadata`: `{ app_user_id: user.id }`
4. Return checkout URL

**File:** `groupbook-server/routes/billing/createCheckoutSession.js`

---

### POST /billing/webhook

Handles Stripe webhook events. No auth (verified by Stripe signature).

**Events to handle:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set status=active, store IDs |
| `customer.subscription.updated` | Update status, period end |
| `customer.subscription.deleted` | Set status=free |
| `invoice.payment_failed` | Set status=past_due |
| `invoice.payment_succeeded` | Set status=active (clears past_due) |

**Logic for `checkout.session.completed`:**
```javascript
// Get app_user_id from metadata
// Update app_user:
//   stripe_customer_id = session.customer
//   stripe_subscription_id = session.subscription
//   subscription_status = 'active'
//   subscription_price_id = (fetch from subscription)
//   subscription_current_period_end = (fetch from subscription)
```

**Logic for `customer.subscription.deleted`:**
```javascript
// Find user by stripe_customer_id
// Update app_user:
//   subscription_status = 'free'
//   stripe_subscription_id = NULL
//   subscription_price_id = NULL
//   subscription_current_period_end = NULL
```

**File:** `groupbook-server/routes/billing/webhook.js`

**Important:** Use raw body parser for this route (Stripe signature verification requires raw body)

---

### POST /billing/create-portal-session

Creates a Stripe Customer Portal session for managing subscription.

**Auth:** Required (verifyToken)

**Request:** None (uses JWT user)

**Response:**
```json
{
  "return_code": "SUCCESS",
  "portal_url": "https://billing.stripe.com/p/session/xxx"
}
```

**Error if no stripe_customer_id:**
```json
{
  "return_code": "NO_SUBSCRIPTION",
  "message": "No billing account found"
}
```

**File:** `groupbook-server/routes/billing/createPortalSession.js`

---

### GET /billing/status

Returns current billing status for the user.

**Auth:** Required (verifyToken)

**Response:**
```json
{
  "return_code": "SUCCESS",
  "billing": {
    "status": "active",
    "plan": "monthly",
    "current_period_end": "2025-02-15T00:00:00Z",
    "event_count": 3,
    "event_limit": null
  }
}
```

For free users:
```json
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
```

**File:** `groupbook-server/routes/billing/status.js`

---

## Frontend Changes

### 1. Event Creation - Upgrade Prompt

**Location:** When user clicks "Create Event" button

**Logic:**
```typescript
// Before creating event:
const eventCount = await getEventCount();
const billingStatus = await getBillingStatus();

if (billingStatus.status !== 'active' && eventCount >= 1) {
  // Show upgrade modal instead of create form
  showUpgradeModal();
  return;
}

// Proceed with event creation
```

**Upgrade Modal Content:**
```
┌─────────────────────────────────────────────────┐
│  Upgrade to GroupBook Pro                       │
│                                                 │
│  You've reached your free event limit.          │
│  Upgrade to create unlimited events.            │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ £35/month       │  │ £299/year       │      │
│  │                 │  │ Save 29%        │      │
│  │ [Select]        │  │ [Select]        │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                 │
│                            [Maybe later]        │
└─────────────────────────────────────────────────┘
```

**On Select:** Call `/billing/create-checkout-session`, redirect to `checkout_url`

---

### 2. Settings Page - Billing Status

**Location:** Add to existing Settings page (`/settings`)

**For free users:**
```
┌─────────────────────────────────────────────────┐
│  Subscription                                   │
│                                                 │
│  Current plan: Free (1 event)                   │
│                                                 │
│  [Upgrade to Pro]                               │
└─────────────────────────────────────────────────┘
```

**For Pro users:**
```
┌─────────────────────────────────────────────────┐
│  Subscription                                   │
│                                                 │
│  Current plan: Pro Monthly                      │
│  Next billing: 15 February 2025                 │
│                                                 │
│  [Manage Billing]                               │
└─────────────────────────────────────────────────┘
```

**"Manage Billing" button:** Calls `/billing/create-portal-session`, opens `portal_url` in new tab

---

### 3. Dashboard - Optional Status Indicator

**Location:** Dashboard header area (subtle)

**For free users with 1 event:**
```
You're using 1 of 1 free event. [Upgrade]
```

**For Pro users:** No indicator needed (or subtle "Pro" badge)

---

### 4. Success/Cancel Return Handling

**Location:** Dashboard page

Check URL params on mount:
- `?billing=success` → Show toast: "Welcome to GroupBook Pro!"
- `?billing=cancelled` → Show toast: "Upgrade cancelled" (optional, could be silent)

---

## File Structure

### New Server Files

```
groupbook-server/
├── routes/
│   └── billing/
│       ├── createCheckoutSession.js
│       ├── createPortalSession.js
│       ├── webhook.js
│       └── status.js
└── config/
    └── config.js  (add Stripe config)
```

### New/Modified Web Files

```
groupbook-web/src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           └── page.tsx  (add billing section)
├── components/
│   └── UpgradeModal.tsx  (new)
└── lib/
    └── api.ts  (add billing functions)
```

---

## API Client Functions

**Add to `groupbook-web/src/lib/api.ts`:**

```typescript
// Billing
export async function createCheckoutSession(priceType: 'monthly' | 'annual') {
  // POST /billing/create-checkout-session
  // Returns { success, data: { checkout_url }, error }
}

export async function createPortalSession() {
  // POST /billing/create-portal-session
  // Returns { success, data: { portal_url }, error }
}

export async function getBillingStatus() {
  // GET /billing/status
  // Returns { success, data: { status, plan, ... }, error }
}
```

---

## Edge Cases

### User cancels subscription
- Stripe sends `customer.subscription.updated` with `cancel_at_period_end: true`
- Then `customer.subscription.deleted` at period end
- User keeps all events, status becomes `free`
- They can resubscribe anytime

### User has 5 events, then cancels
- They keep all 5 events (no deletion)
- They can edit/delete existing events
- They cannot create event #6
- If they delete down to 0 events, they can create 1 more (free tier)

### Payment fails during subscription
- Stripe retries automatically
- We set status to `past_due` on first failure
- User keeps full access during retry period
- If all retries fail, Stripe cancels → status becomes `free`
- Same rules as voluntary cancel (keep events, can't add)

### User upgrades from monthly to annual
- Handled entirely in Stripe Customer Portal
- Stripe sends webhook with updated subscription
- We update `subscription_price_id` and `current_period_end`

### User was Pro, cancelled, wants to resubscribe
- They click "Upgrade" again
- We already have their `stripe_customer_id`
- New checkout session uses existing customer
- Stripe handles card-on-file or new card

---

## Testing Checklist

### Test Mode Setup
1. Use Stripe test keys (`sk_test_`, `pk_test_`)
2. Use Stripe CLI for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3016/billing/webhook
   ```

### Test Cards
| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0002 | Declined |

### Scenarios to Test
- [ ] Free user creates first event (should work)
- [ ] Free user tries to create second event (should show upgrade modal)
- [ ] User completes monthly checkout (should become Pro)
- [ ] User completes annual checkout (should become Pro)
- [ ] Pro user creates multiple events (should work)
- [ ] User opens billing portal (should show Stripe portal)
- [ ] User cancels in portal (should keep events, become free at period end)
- [ ] Webhook: subscription deleted (status → free)
- [ ] Webhook: payment failed (status → past_due)
- [ ] Webhook: payment succeeded after past_due (status → active)

---

## Implementation Order

1. **Database migration** - Add billing columns
2. **Server config** - Add Stripe env vars and config
3. **Webhook endpoint** - Critical for payment confirmation
4. **Checkout endpoint** - Enable payments
5. **Portal endpoint** - Enable self-service management
6. **Status endpoint** - Support frontend display
7. **Upgrade modal** - Trigger point for conversions
8. **Settings page update** - Show status and manage link
9. **Event creation guard** - Enforce limits
10. **Testing** - Full flow with test cards

---

## Pricing Display Copy

### Upgrade Modal
```
GroupBook Pro

Monthly: £35/month
Annual: £299/year — Save 29%

Unlimited events. Cancel anytime.
```

### Settings Page (Free)
```
Current plan: Free
1 event included

[Upgrade to Pro]
```

### Settings Page (Pro Monthly)
```
Current plan: Pro (Monthly)
Renews: 15 February 2025

[Manage Billing]
```

### Settings Page (Pro Annual)
```
Current plan: Pro (Annual)
Renews: 15 December 2025

[Manage Billing]
```
