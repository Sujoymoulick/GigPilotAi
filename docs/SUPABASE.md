# Supabase Integration

## Overview

GigPilot AI uses Supabase for authentication, database, and storage services.

## Configuration

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anonymous key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (server-side, bypasses RLS) |

## Client Types

### Admin Client (Server)

Used for background jobs and operations that bypass Row Level Security.

```typescript
import { supabaseAdmin } from '../lib/supabase';

// Bypasses RLS - use for admin operations
const { data, error } = await supabaseAdmin
  .from('profiles')
  .select('*');
```

**File:** `apps/backend/src/lib/supabase.ts`

### User-Scoped Client (Server)

Created per-request with the user's JWT token to respect RLS policies.

```typescript
import { getSupabaseUserClient } from '../lib/supabase';

// Respects RLS - use for user operations
const client = getSupabaseUserClient(userToken);
const { data, error } = await client
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

### Frontend Client

Created in the browser for auth and direct Supabase operations.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
```

**File:** `apps/frontend/src/lib/api-client.ts`

## Authentication

### Google OAuth

Configured through Supabase Auth dashboard.

**Flow:**

1. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. User authenticates with Google
3. Supabase handles callback and creates session
4. Frontend exchanges session with backend `/api/auth/login`

**Callback Handler:** `apps/frontend/src/pages/auth/callback.astro`

### Magic Link

Supabase-powered passwordless login.

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com'
});
```

### Session Management

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

## Row Level Security (RLS)

When using user-scoped clients, RLS policies control data access. The backend creates per-request Supabase clients with the user's JWT token.

**Default Policies:**

- Users can only read/write their own data
- `user_id` column matches the authenticated user's ID
- Admin client bypasses all RLS policies

## Storage

### Bucket: `gigpilot-assets`

Used for file uploads (images, PDFs).

**Configuration:**

| Setting | Value |
|---------|-------|
| Bucket Name | `gigpilot-assets` |
| Public | No (signed URLs) |
| File Size Limit | 5 MB |
| Allowed Types | JPEG, PNG, WEBP, GIF, PDF |

**Upload Flow:**

1. Client sends base64-encoded file to `/api/storage/upload`
2. Backend decodes to buffer
3. Uploads to Supabase Storage at path `{userId}/{timestamp}_{filename}`
4. Generates signed URL (24-hour expiry)
5. Returns path and signed URL

**File:** `apps/backend/src/services/StorageService.ts`

## Database Operations

All database operations go through the repository pattern:

```typescript
// BaseRepository provides:
await repo.queryAll(token);          // SELECT * FROM table
await repo.queryById(id, token);     // SELECT * FROM table WHERE id = ?
await repo.insertRecord(data, token); // INSERT INTO table
await repo.updateRecord(id, data, token); // UPDATE table SET ...
await repo.deleteRecord(id, token);  // DELETE FROM table (or soft delete)
```

Each repository maps to a specific Supabase table:

| Repository | Table |
|------------|-------|
| `UserRepository` | `profiles` |
| `ProjectRepository` | `projects` |
| `GigRepository` | `gigs` |
| `AiHistoryRepository` | `ai_history` |
| `SocialAccountRepository` | `social_accounts` |
| `ScheduledPostRepository` | `scheduled_posts` |
| `NotificationRepository` | `notifications` |
| `SubscriptionRepository` | `subscriptions` |
| `PaymentRepository` | `payments` |
| `AnalyticsRepository` | `analytics` |
| `SettingsRepository` | `settings` |
| `ActivityLogRepository` | `activity_logs` |

## Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Mock Mode

When `SUPABASE_URL` contains `mock.supabase.co`, the application automatically falls back to the file-based JSON database. This is useful for:

- Local development without Supabase
- Unit testing
- CI/CD pipelines

## Related

- [Database](DATABASE.md)
- [Storage](STORAGE.md)
- [Authentication](AUTHENTICATION.md)
