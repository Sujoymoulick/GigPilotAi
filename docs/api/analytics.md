# Analytics API

## Endpoints

### `GET /api/analytics`

Get dashboard analytics data for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "creditsRemaining": 450,
    "totalCreditsUsed": 50,
    "totalWordsGenerated": 12500,
    "totalTimeSavedMinutes": 300,
    "favoriteTool": "Proposal Generator",
    "timeSavedHours": 5,
    "growthPercentage": 24,
    "dailyUsage": [
      {
        "id": "uuid",
        "date": "2026-07-30",
        "credits_used": 10,
        "words_generated": 2500,
        "time_saved_minutes": 60,
        "tool_usage": [
          { "tool": "Proposal Generator", "count": 3 },
          { "tool": "Gig Generator", "count": 1 }
        ]
      }
    ],
    "monthlyUsage": [ ... ],
    "toolUsage": [
      { "tool": "Proposal Generator", "count": 15 },
      { "tool": "Gig Generator", "count": 8 },
      { "tool": "Keyword Finder", "count": 5 }
    ]
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `creditsRemaining` | number | Current credit balance |
| `totalCreditsUsed` | number | Total credits consumed |
| `totalWordsGenerated` | number | Total AI-generated words |
| `totalTimeSavedMinutes` | number | Estimated time saved |
| `favoriteTool` | string | Most-used tool |
| `timeSavedHours` | number | Time saved in hours |
| `growthPercentage` | number | Growth percentage |
| `dailyUsage` | array | Last 7 days of usage |
| `monthlyUsage` | array | Last 30 days of usage |
| `toolUsage` | array | Tool usage breakdown |

**Example:**

```bash
curl http://localhost:3000/api/analytics \
  -H "Authorization: Bearer TOKEN"
```

```javascript
const { data } = await api.get('/api/analytics');
console.log(`Used ${data.totalCreditsUsed} credits`);
console.log(`Generated ${data.totalWordsGenerated} words`);
console.log(`Saved ${data.timeSavedHours} hours`);
```

## Versioned Endpoint

- `GET /api/v1/analytics`

## Related

- [Billing API](payments.md)
- [AI API](ai.md)
