# Gigs API

## Endpoints

### `GET /api/gigs`

List all gigs for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "I will do expert Logo Design",
      "category": "Graphic Design",
      "content": { ... },
      "status": "draft",
      "created_at": "2026-07-30T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/gig/generate`

Generate a new gig using AI. See [AI API](ai.md#gig-generator) for full documentation.

**Authentication:** Yes | **Credits:** 2

---

### `PUT /api/gigs/:id`

Update an existing gig.

**Authentication:** Yes

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `id` | Gig UUID |

**Request Body:**

Same as gig generation output.

**Success Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

---

### `DELETE /api/gigs/:id`

Delete a gig.

**Authentication:** Yes

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `id` | Gig UUID |

**Success Response (200):**

```json
{
  "success": true,
  "data": { "success": true }
}
```

## Versioned Endpoints

- `GET /api/v1/gigs`
- `POST /api/v1/gigs/generate`

## Related

- [AI API](ai.md)
- [Projects API](projects.md)
