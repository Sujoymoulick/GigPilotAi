# Health API

## Endpoints

### `GET /api/health`

Health check endpoint. Returns server status.

**Authentication:** No

**Response:**

```json
{
  "status": "online",
  "system": "GigPilot AI API Fastify Server",
  "timestamp": "2026-07-30T12:00:00.000Z"
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Server is online |

---

### `GET /api/v1/health`

Versioned health check. Identical to `/api/health`.

**Authentication:** No

**Response:** Same as above.

## Usage

```bash
curl http://localhost:3000/api/health
```

```javascript
const response = await fetch('http://localhost:3000/api/health');
const data = await response.json();
console.log(data.status); // "online"
```

## Related

- [API Reference](../API_REFERENCE.md)
- [API Index](../API_INDEX.md)
