# Notifications API

## Endpoints

### `GET /api/notifications`

Get all notifications for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Welcome to GigPilot AI",
      "message": "Your account has been created successfully.",
      "type": "info",
      "is_read": false,
      "created_at": "2026-07-30T12:00:00.000Z"
    }
  ]
}
```

**Notification Types:**

| Type | Description |
|------|-------------|
| `info` | Informational message |
| `success` | Success notification |
| `warning` | Warning message |
| `error` | Error notification |

---

### `GET /api/notifications/unread`

Get the count of unread notifications.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": { "count": 5 }
}
```

**Example:**

```javascript
const { data } = await api.get('/api/notifications/unread');
console.log(`You have ${data.count} unread notifications`);
```

---

### `POST /api/notifications/read-all`

Mark all notifications as read.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": { "success": true }
}
```

---

### `DELETE /api/notifications/:id`

Delete a single notification.

**Authentication:** Yes

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `id` | Notification UUID |

**Success Response (200):**

```json
{
  "success": true,
  "data": { "success": true }
}
```

## Versioned Endpoints

- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread`
- `POST /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/:id`

## Related

- [Auth API](auth.md)
- [Settings API](settings.md)
