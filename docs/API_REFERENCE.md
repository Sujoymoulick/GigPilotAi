# API Reference

## Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://api.gigpilot.ai` |
| Development | `http://localhost:3000` |

## API Versioning

All endpoints are available under both prefixes:

- `/api/...` (current)
- `/api/v1/...` (versioned)

Both point to identical handlers.

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes (POST/PUT) | `application/json` |
| `Authorization` | Yes (protected routes) | `Bearer <token>` |

## Response Envelope

### Success

```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "message": "Error description",
  "error": { ... }
}
```

### Special: Gig Generator

The gig generator returns a different envelope:

```json
{
  "success": true,
  "message": "",
  "data": { ... },
  "meta": {
    "tokensUsed": 1234,
    "provider": "openai"
  }
}
```

## Authentication

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "fullName": "John Doe"}'
```

### Using Token

```bash
curl http://localhost:3000/api/history \
  -H "Authorization: Bearer eyJ1c2VySWQi..."
```

## Common Patterns

### List Endpoints

```bash
GET /api/{resource}
Authorization: Bearer <token>

Response: { success: true, data: [...], message: "" }
```

### Create Endpoints

```bash
POST /api/{resource}
Authorization: Bearer <token>
Content-Type: application/json

Body: { ... }
Response: { success: true, data: { ... }, message: "" }
```

### Update Endpoints

```bash
PUT /api/{resource}/:id
Authorization: Bearer <token>
Content-Type: application/json

Body: { ... }
Response: { success: true, data: { ... }, message: "" }
```

### Delete Endpoints

```bash
DELETE /api/{resource}/:id
Authorization: Bearer <token>

Response: { success: true, data: { success: true }, message: "" }
```

## AI Generation Endpoints

AI endpoints deduct credits before generation:

| Tool | Credits | Endpoint |
|------|---------|----------|
| Proposal Generator | 1 | `POST /api/proposal/generate` |
| Gig Generator | 2 | `POST /api/gig/generate` |
| Keyword Finder | 1 | `POST /api/keywords/find` |
| Pricing Optimizer | 1 | `POST /api/pricing/optimize` |
| Gig Health Checker | 1 | `POST /api/gig/health` |
| Portfolio Builder | 2 | `POST /api/portfolio/generate` |
| Client Reply | 1 | `POST /api/messages/reply` |
| Review Analyzer | 1 | `POST /api/reviews/analyze` |
| SEO Audit | 1 | `POST /api/seo/audit` |
| Social Post AI | 1 | `POST /api/social/ai/generate` |

## Rate Limits

- **100 requests per minute** per IP
- Returns `429 Too Many Requests` when exceeded

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Detailed API Docs

- [Health](api/health.md)
- [Auth](api/auth.md)
- [AI](api/ai.md)
- [Gigs](api/gigs.md)
- [Projects](api/projects.md)
- [Social](api/social.md)
- [Analytics](api/analytics.md)
- [Notifications](api/notifications.md)
- [Storage](api/storage.md)
- [Payments](api/payments.md)
- [Settings](api/settings.md)
- [Scheduler](api/scheduler.md)

## Related

- [API Index](API_INDEX.md)
- [OpenAPI Spec](OPENAPI.md)
- [SDK Examples](SDK_EXAMPLES.md)
