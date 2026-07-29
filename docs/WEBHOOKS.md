# Webhooks

## Current Status

Status: **Planned**

GigPilot AI does not currently implement webhooks. The system uses an internal job queue for asynchronous processing.

## Planned Webhook Events

The following events are planned for future webhook support:

### Authentication

| Event | Trigger |
|-------|---------|
| `user.created` | New user registration |
| `user.login` | User login |
| `user.logout` | User logout |

### AI Generation

| Event | Trigger |
|-------|---------|
| `generation.completed` | AI generation finished |
| `generation.failed` | AI generation failed |
| `credits.depleted` | User credits exhausted |

### Social Media

| Event | Trigger |
|-------|---------|
| `post.published` | Post published to platform |
| `post.failed` | Post publishing failed |
| `post.scheduled` | Post scheduled |
| `account.connected` | Social account connected |
| `account.disconnected` | Social account disconnected |

### Billing

| Event | Trigger |
|-------|---------|
| `payment.completed` | Payment successful |
| `payment.failed` | Payment failed |
| `subscription.upgraded` | Plan upgraded |
| `subscription.downgraded` | Plan downgraded |

## Planned Webhook Format

```json
{
  "event": "post.published",
  "timestamp": "2026-07-30T12:00:00.000Z",
  "data": {
    "postId": "uuid",
    "provider": "linkedin",
    "status": "published",
    "url": "https://linkedin.com/posts/..."
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Planned Webhook Configuration

```json
{
  "url": "https://your-app.com/webhooks/gigpilot",
  "events": ["post.published", "generation.completed"],
  "secret": "your-webhook-secret"
}
```

## Planned Security

- HMAC-SHA256 signature verification
- Retry logic with exponential backoff
- Webhook secret rotation
- Event logging

## Current Alternatives

Until webhooks are implemented, use these alternatives:

1. **Polling:** Call list endpoints periodically
2. **Internal Queue:** Use the in-process job queue for server-side events
3. **Frontend Events:** Listen for state changes in the React components

## Related

- [Architecture](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
