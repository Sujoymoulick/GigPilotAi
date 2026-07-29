# Auth API

## Endpoints

### `POST /api/auth/login`

Login and synchronize user profile. Creates a new user if one doesn't exist with the given email.

**Authentication:** No (but accepts optional Bearer token for profile sync)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email (valid format) |
| `fullName` | string | No | User's display name |
| `password` | string | No | Min 6 chars (optional) |

**Validation Rules:**

```typescript
z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  fullName: z.string().optional(),
});
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJ1c2VySWQi...",
    "user": {
      "id": "a1b2c3d4-...",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://images.unsplash.com/...",
      "role": "Pro",
      "credits_remaining": 450,
      "monthly_quota": 500
    }
  }
}
```

**Error Responses:**

| Code | Message |
|------|---------|
| 400 | Validation Failed |

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "fullName": "John Doe"}'
```

```javascript
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', fullName: 'John Doe' })
});
const { data } = await res.json();
```

```python
import requests
res = requests.post('http://localhost:3000/api/auth/login', json={
    'email': 'user@example.com',
    'fullName': 'John Doe'
})
data = res.json()['data']
```

---

### `POST /api/auth/magic-link`

Generate a magic link for passwordless login. The link expires after 15 minutes.

**Authentication:** No

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email (valid format) |

**Validation Rules:**

```typescript
z.object({
  email: z.string().email(),
});
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Magic link generated successfully",
  "data": {
    "magicUrl": "https://gigpilot.ai/auth/magic-verify?token=..."
  }
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

### `GET /api/auth/me`

Get the authenticated user's profile.

**Authentication:** Yes (Bearer token)

**Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile details loaded",
  "data": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://images.unsplash.com/...",
    "role": "Pro",
    "credits_remaining": 450,
    "monthly_quota": 500,
    "created_at": "2026-07-30T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Message |
|------|---------|
| 401 | Missing Authorization Header |
| 401 | Unauthorized: Session expired or invalid |

**Example Request:**

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```javascript
const res = await fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: profile } = await res.json();
```

## Versioned Endpoints

All auth endpoints have `/api/v1/auth/...` equivalents:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/magic-link`
- `GET /api/v1/auth/me`

## Related

- [Authentication Guide](../AUTHENTICATION.md)
- [Settings API](settings.md)
- [Billing API](payments.md)
