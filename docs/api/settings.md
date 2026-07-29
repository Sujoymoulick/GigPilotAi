# Settings API

## Endpoints

### `GET /api/settings`

Get user settings.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "fullName": "John Doe",
    "email": "user@example.com",
    "notifications": true,
    "darkMode": true,
    "aiProvider": "openai",
    "social_settings": {
      "defaultPlatform": "linkedin",
      "defaultTimezone": "UTC",
      "autoRetry": true
    },
    "created_at": "2026-07-30T12:00:00.000Z"
  }
}
```

---

### `PUT /api/settings`

Update user settings. Creates settings record if none exists.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | No | Display name (also updates profile) |
| `email` | string | No | Contact email |
| `notifications` | boolean | No | Enable notifications |
| `darkMode` | boolean | No | Enable dark mode |
| `aiProvider` | string | No | Default AI provider |
| `social_settings` | object | No | Social media settings |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "fullName": "John Doe",
    "notifications": true,
    "darkMode": true,
    "aiProvider": "openai"
  }
}
```

**Side Effects:**

- If `fullName` is provided, the user's profile `full_name` is also updated

**Example:**

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "fullName": "John Doe",
    "notifications": true,
    "aiProvider": "gemini"
  }'
```

```javascript
await api.put('/api/settings', {
  fullName: 'John Doe',
  notifications: true,
  aiProvider: 'gemini'
});
```

## Versioned Endpoints

- `GET /api/v1/settings`
- `PUT /api/v1/settings`

## Related

- [Auth API](auth.md)
- [Social API](social.md)
- [Payments API](payments.md)
