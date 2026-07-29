# Payments API

## Overview

GigPilot AI uses Razorpay for payment processing with a credit-based usage system.

## Plans

| Plan | Credits/Month | Price | Description |
|------|---------------|-------|-------------|
| Free | 50 | $0 | Basic features |
| Pro | 500 | $29/mo | Full features |
| Agency | 2,000 | $89/mo | All features + priority |

**Coupon:** Use `LAUNCH20` for 20% off any paid plan.

## Endpoints

### `GET /api/billing`

Get billing details for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "currentPlan": "Pro",
    "creditsRemaining": 450,
    "monthlyQuota": 500,
    "renewalDate": "2026-08-29",
    "subscriptionStatus": "active",
    "invoices": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "invoice_id": "INV-470000",
        "amount": 29,
        "currency": "USD",
        "status": "Paid",
        "created_at": "2026-07-30T12:00:00.000Z"
      }
    ]
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `currentPlan` | string | Current plan name |
| `creditsRemaining` | number | Credits left this month |
| `monthlyQuota` | number | Total monthly credits |
| `renewalDate` | string | Next billing date |
| `subscriptionStatus` | string | Subscription status |
| `invoices` | array | Payment history |

---

### `POST /api/billing/upgrade`

Upgrade the user's plan.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plan` | string | Yes | `Free`, `Pro`, or `Agency` |
| `razorpayPaymentId` | string | No | Razorpay payment ID |
| `coupon` | string | No | Coupon code (e.g., `LAUNCH20`) |

**Validation:**

```typescript
z.object({
  plan: z.enum(['Free', 'Pro', 'Agency']),
  razorpayPaymentId: z.string().optional(),
  coupon: z.string().optional(),
});
```

**Pricing:**

| Plan | Base Price | With LAUNCH20 |
|------|-----------|---------------|
| Free | $0 | $0 |
| Pro | $29 | $23.20 |
| Agency | $89 | $71.20 |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully upgraded to Pro Plan!",
  "data": {
    "invoice": {
      "id": "uuid",
      "invoice_id": "INV-470000",
      "amount": 23.20,
      "currency": "USD",
      "status": "Paid"
    }
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/billing/upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "plan": "Pro",
    "coupon": "LAUNCH20"
  }'
```

```javascript
const { data, message } = await api.post('/api/billing/upgrade', {
  plan: 'Pro',
  coupon: 'LAUNCH20'
});
console.log(message); // "Successfully upgraded to Pro Plan!"
```

## Credit System

- Credits are deducted per AI generation
- Each tool has a specific credit cost (see [AI API](ai.md))
- Credits reset monthly based on plan quota
- Credits cannot be rolled over

## Versioned Endpoints

- `GET /api/v1/payments/billing`
- `POST /api/v1/payments/upgrade`

## Related

- [Analytics API](analytics.md)
- [Auth API](auth.md)
- [Settings API](settings.md)
