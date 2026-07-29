# Rate Limits

## Overview

GigPilot AI implements rate limiting to prevent abuse and ensure fair usage.

## Configuration

| Setting | Value |
|---------|-------|
| Max Requests | 100 per time window |
| Time Window | 1 minute |
| Key Generator | Client IP address |
| Implementation | `@fastify/rate-limit` |

## How It Works

1. Each request is counted per client IP
2. When the limit is exceeded, subsequent requests receive `429 Too Many Requests`
3. The counter resets after the time window expires

## Headers

Rate limit information is included in response headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1722470460
```

## Exceeding the Limit

**Response:**

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded, retry in 58 seconds"
}
```

## Best Practices

### Client-Side

- Implement exponential backoff for retries
- Cache responses when possible
- Batch requests where applicable
- Use webhooks instead of polling

### Example: Exponential Backoff

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }
    
    return response;
  }
  throw new Error('Max retries exceeded');
}
```

## AI Endpoint Considerations

AI generation endpoints may take longer to process. The rate limit applies to the HTTP request, not the AI processing time.

**Recommendation:** Limit AI generation requests to avoid consuming your credit quota quickly.

## Scheduler Endpoint

The `/api/social/scheduler/run` endpoint is **not rate-limited** as it's intended for automated scheduling. However, it should only be called by the internal job queue or cron.

## Environment-Specific Limits

| Environment | Limit |
|-------------|-------|
| Production | 100 req/min per IP |
| Development | 100 req/min per IP |
| Testing | Disabled |

## Related

- [Error Handling](ERROR_HANDLING.md)
- [Authentication](AUTHENTICATION.md)
