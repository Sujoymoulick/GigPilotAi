# Pagination

## Current Implementation

GigPilot AI does **not currently implement cursor-based or offset pagination** on list endpoints. All list endpoints return the complete dataset for the authenticated user.

## Affected Endpoints

The following endpoints return arrays without pagination:

| Endpoint | Response |
|----------|----------|
| `GET /api/history` | All AI history records |
| `GET /api/favorites` | All favorited records |
| `GET /api/proposals` | All proposals |
| `GET /api/gigs` | All gigs |
| `GET /api/keywords` | All keyword results |
| `GET /api/pricing` | All pricing results |
| `GET /api/portfolio` | All portfolio items |
| `GET /api/messages` | All message replies |
| `GET /api/reviews` | All review analyses |
| `GET /api/seo` | All SEO audits |
| `GET /api/social/accounts` | All connected accounts |
| `GET /api/social/posts` | All posts |
| `GET /api/social/campaigns` | All campaigns |
| `GET /api/social/media` | All media items |
| `GET /api/social/analytics` | All analytics data |
| `GET /api/notifications` | All notifications |
| `GET /api/billing` | Billing details + invoices |

## Client-Side Filtering

The frontend typically handles filtering and sorting:

```typescript
// Sort by date (newest first)
const sorted = list.sort((a, b) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

// Filter by module
const proposals = list.filter(item => item.module === 'Proposal Generator');

// Limit display
const recent = sorted.slice(0, 10);
```

## Recommendation

For production with large datasets, consider adding pagination parameters:

```
GET /api/history?page=1&limit=20
GET /api/history?cursor=abc123&limit=20
```

**Proposed Response Format:**

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

## Related

- [API Reference](API_REFERENCE.md)
- [Error Handling](ERROR_HANDLING.md)
