# Scheduler API

## Overview

The scheduler manages automatic publishing of scheduled social media posts.

## Endpoints

### `POST /api/social/scheduler/run`

Trigger the scheduler to process all pending posts whose scheduled time has passed.

**Authentication:** No (internal endpoint)

**Behavior:**

1. Queries all `scheduled_posts` with `status = 'Scheduled'` and `scheduled_time <= now`
2. For each pending post:
   - Fetches the parent post and social account
   - Publishes via the social provider
   - Updates status to `Published` or retries on failure
   - Retries up to **3 times** before marking as `Failed`
3. Updates parent post status when all scheduled instances complete

**Success Response (200):**

```json
{
  "success": true,
  "processedCount": 2,
  "results": [
    {
      "id": "scheduled-post-uuid",
      "success": true
    },
    {
      "id": "scheduled-post-uuid-2",
      "success": false,
      "error": "Rate limited by provider"
    }
  ]
}
```

**Retry Logic:**

| Attempt | Behavior |
|---------|----------|
| 1st failure | Retry after re-scheduling |
| 2nd failure | Retry after re-scheduling |
| 3rd failure | Mark as `Failed` |

**Status Transitions:**

```
Scheduled → Publishing → Published
                     └→ Scheduled (retry)
                     └→ Failed (after 3 retries)
```

---

## How Scheduling Works

### 1. User Schedules a Post

```bash
POST /api/social/schedule
{
  "content": "Check out our new feature!",
  "scheduledTime": "2026-08-01T10:00:00Z",
  "accountIds": ["account-1", "account-2"]
}
```

### 2. System Creates Records

- Creates a `posts` record with `status: 'Scheduled'`
- Creates a `scheduled_posts` record for each account
- Queues a background job with calculated delay

### 3. Background Job Fires

When the scheduled time arrives, the job triggers `POST /api/social/scheduler/run`.

### 4. Scheduler Processes

The scheduler fetches pending posts and publishes them via each social provider.

### 5. Status Updates

- Success: `Published`
- Failure: Retry up to 3 times, then `Failed`
- Parent post status updated when all instances complete

## Job Queue Integration

The scheduler uses an in-process job queue:

```typescript
// When a post is scheduled
const delayMs = new Date(scheduledTime).getTime() - Date.now();
socialPostQueue.add('publish-post', { scheduledPostId: record.id }, Math.max(0, delayMs));
```

## Automation

The scheduler can be triggered:

1. **Automatically** via the job queue (when scheduled time arrives)
2. **Manually** via `POST /api/social/scheduler/run`
3. **Periodically** via an external cron job calling the scheduler endpoint

## Related

- [Social API](social.md)
- [Architecture](../ARCHITECTURE.md)
