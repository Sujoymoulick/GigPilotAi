# Social API

## Overview

The Social Media Hub provides endpoints for managing connected social accounts, creating and publishing posts, scheduling content, managing campaigns, and using AI to generate social media content.

## Supported Platforms

| Provider | Auth Method | API |
|----------|-------------|-----|
| LinkedIn | OAuth 2.0 | LinkedIn API v2 |
| Facebook | OAuth 2.0 | Graph API v19 |
| Instagram | OAuth 2.0 | Graph API (via Facebook) |
| Bluesky | App Password | AT Protocol |
| Mastodon | OAuth 2.0 | REST API |
| Dev.to | API Key | REST API |

---

## Accounts

### `GET /api/social/accounts`

List all connected social accounts.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "provider": "linkedin",
      "provider_user_id": "linkedin-user-id",
      "username": "johndoe",
      "display_name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://...",
      "status": "connected",
      "last_sync": "2026-07-30T12:00:00.000Z",
      "created_at": "2026-07-30T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/social/connect`

Connect a new social account via OAuth.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | Yes | Platform name (linkedin, facebook, etc.) |
| `code` | string | Yes | OAuth authorization code or API key |
| `redirectUri` | string | No | OAuth redirect URI |

**Validation:**

```typescript
z.object({
  provider: z.string(),
  code: z.string(),
  redirectUri: z.string().url().optional(),
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider": "linkedin",
    "username": "johndoe",
    "display_name": "John Doe",
    "status": "connected"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/social/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "provider": "linkedin",
    "code": "oauth-authorization-code"
  }'
```

---

### `POST /api/social/disconnect`

Disconnect a social account.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `accountId` | string | Yes |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Social account disconnected",
  "data": { "success": true }
}
```

---

## Posts

### `GET /api/social/posts`

List all posts for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "My Blog Post",
      "content": "Check out our latest update...",
      "hashtags": "#tech #startup",
      "status": "Draft",
      "created_at": "2026-07-30T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/social/posts`

Create or update a post.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Post ID (for update) |
| `title` | string | No | Post title |
| `content` | string | Yes | Post content (min 1 char) |
| `hashtags` | string | No | Hashtags string |
| `mentions` | string | No | Mentions string |
| `link` | string | No | URL (valid format) |
| `mediaUrls` | string[] | No | Array of media URLs |
| `status` | string | No | Post status |

**Validation:**

```typescript
z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  hashtags: z.string().optional(),
  mentions: z.string().optional(),
  link: z.string().url().or(z.literal('')).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  status: z.string().optional(),
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Post",
    "content": "Hello world!",
    "status": "Draft",
    "created_at": "2026-07-30T12:00:00.000Z"
  }
}
```

---

### `DELETE /api/social/posts/:id`

Delete a post and its associated scheduled posts.

**Authentication:** Yes

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `id` | Post UUID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Post deleted",
  "data": { "success": true }
}
```

---

## Publishing

### `POST /api/social/publish`

Publish a post immediately to one or more connected accounts.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `postId` | string | No | Existing post ID |
| `title` | string | No | Post title |
| `content` | string | No | Post content |
| `url` | string | No | Link URL |
| `mediaUrls` | string[] | No | Media URLs |
| `accountIds` | string[] | Yes | Min 1 account ID |

**Validation:**

```typescript
z.object({
  postId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  url: z.string().url().or(z.literal('')).optional(),
  mediaUrls: z.array(z.string()).optional(),
  accountIds: z.array(z.string()).min(1),
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "accountId": "uuid",
      "provider": "linkedin",
      "success": true,
      "url": "https://linkedin.com/posts/...",
      "providerPostId": "provider-id"
    }
  ]
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/social/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "content": "Excited to share our latest update!",
    "accountIds": ["account-uuid-1"]
  }'
```

---

### `POST /api/social/schedule`

Schedule a post for future publishing.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Post title |
| `content` | string | Yes | Post content |
| `url` | string | No | Link URL |
| `mediaUrls` | string[] | No | Media URLs |
| `scheduledTime` | string | Yes | ISO 8601 datetime |
| `timezone` | string | No | Timezone (default: UTC) |
| `accountIds` | string[] | Yes | Min 1 account ID |

**Validation:**

```typescript
z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  url: z.string().url().or(z.literal('')).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledTime: z.string().refine((val) => !isNaN(Date.parse(val))),
  timezone: z.string().optional(),
  accountIds: z.array(z.string()).min(1),
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "post": { ... },
    "scheduledRecords": [
      {
        "id": "uuid",
        "provider": "linkedin",
        "scheduled_time": "2026-08-01T10:00:00Z",
        "status": "Scheduled"
      }
    ]
  }
}
```

---

## Campaigns

### `GET /api/social/campaigns`

List all campaigns.

**Authentication:** Yes

---

### `POST /api/social/campaigns`

Create or update a campaign.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `id` | string | No (for update) |
| `name` | string | No |
| `description` | string | No |
| `color` | string | No |
| `start_date` | string | No |
| `end_date` | string | No |
| `budget` | number | No |
| `goal` | string | No |
| `status` | string | No |

---

### `DELETE /api/social/campaigns/:id`

Delete a campaign.

**Authentication:** Yes

---

## Media Library

### `GET /api/social/media`

List all media items.

**Authentication:** Yes

---

### `POST /api/social/media`

Add a media item to the library.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `type` | string | No (MIME type) |
| `url` | string | No |
| `filename` | string | No |
| `size` | number | No |

---

### `DELETE /api/social/media/:id`

Delete a media item.

**Authentication:** Yes

---

## Analytics

### `GET /api/social/analytics`

Get social media analytics data.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "linkedin",
      "impressions": 1500,
      "engagement": 230,
      "clicks": 45,
      "date": "2026-07-30"
    }
  ]
}
```

---

## Settings

### `GET /api/social/settings`

Get social media settings.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "defaultPlatform": "linkedin",
    "defaultTimezone": "America/New_York",
    "autoRetry": true,
    "notificationPreferences": {
      "oauthSuccess": true,
      "oauthFailure": true,
      "tokenExpiry": true,
      "postPublished": true,
      "postFailed": true
    }
  }
}
```

---

### `PUT /api/social/settings`

Update social media settings.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `defaultPlatform` | string | No |
| `defaultTimezone` | string | No |
| `autoRetry` | boolean | No |
| `notificationPreferences` | object | No |

---

## AI Content Generation

### `POST /api/social/ai/generate`

Generate social media content using AI.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | `generate`, `rewrite`, or `suggest` |
| `prompt` | string | No | Topic/brief (for generate) |
| `content` | string | No | Existing content (for rewrite/suggest) |
| `platform` | string | No | Target platform |
| `tone` | string | No | Content tone |
| `length` | string | No | Content length |

**Validation:**

```typescript
z.object({
  action: z.enum(['generate', 'rewrite', 'suggest']),
  prompt: z.string().optional(),
  content: z.string().optional(),
  platform: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "title": "Shared Insight",
    "content": "Just launched some amazing new features...",
    "hashtags": ["automation", "productivity"],
    "mentions": [],
    "cta": "Learn more at gigpilot.ai"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/social/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "action": "generate",
    "prompt": "Announcing our new AI features",
    "platform": "linkedin",
    "tone": "Professional"
  }'
```

---

## Scheduler

### `POST /api/social/scheduler/run`

Trigger the scheduler to process pending posts. Called internally by the job queue.

**Authentication:** No

**Success Response (200):**

```json
{
  "success": true,
  "processedCount": 2,
  "results": [
    { "id": "uuid", "success": true },
    { "id": "uuid", "success": false, "error": "Rate limited" }
  ]
}
```

## Versioned Endpoints

All social endpoints have `/api/v1/social/...` equivalents.

## Related

- [AI API](ai.md)
- [Auth API](auth.md)
- [SDK Examples](../SDK_EXAMPLES.md)
