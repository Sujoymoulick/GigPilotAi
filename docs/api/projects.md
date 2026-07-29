# Projects API

## Endpoints

### `GET /api/proposals`

List all proposals for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "module": "Proposal Generator",
      "input": { ... },
      "output": { ... },
      "tokens_used": 567,
      "provider": "openai",
      "is_favorite": false,
      "created_at": "2026-07-30T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/proposal/generate`

Generate a new proposal. See [AI API](ai.md#proposal-generator) for full documentation.

**Authentication:** Yes | **Credits:** 1

---

### `PUT /api/proposals/:id`

Update an existing proposal.

**Authentication:** Yes

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `id` | Proposal UUID |

---

### `DELETE /api/proposals/:id`

Delete a proposal.

**Authentication:** Yes

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `id` | Proposal UUID |

## Versioned Endpoints

- `GET /api/v1/projects/proposals`
- `POST /api/v1/projects/proposals/generate`
- `DELETE /api/v1/projects/proposals/:id`

## Related

- [AI API](ai.md)
- [Gigs API](gigs.md)
