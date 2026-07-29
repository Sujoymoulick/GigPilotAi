# Database

## Overview

GigPilot AI uses **Supabase (PostgreSQL)** in production with a **file-based JSON fallback** for development and testing.

## Dual-Mode Architecture

The `BaseRepository` class automatically selects the database backend:

| Mode | Condition | Storage |
|------|-----------|---------|
| **Supabase** | Valid `SUPABASE_URL` and keys | PostgreSQL via Supabase client |
| **Mock** | `SUPABASE_URL` contains `mock.supabase.co` or test environment | `db.json` file |

## Tables

### `profiles` (Users)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `email` | TEXT | Unique, Not Null |
| `full_name` | TEXT | |
| `avatar_url` | TEXT | |
| `role` | TEXT | Default: `'Pro'` |
| `credits_remaining` | INTEGER | Default: `450` |
| `monthly_quota` | INTEGER | Default: `500` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |
| `updated_at` | TIMESTAMPTZ | Default: `now()` |

### `projects`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `title` | TEXT | |
| `description` | TEXT | |
| `status` | TEXT | Default: `'active'` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `gigs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `title` | TEXT | |
| `category` | TEXT | |
| `content` | JSONB | |
| `status` | TEXT | Default: `'draft'` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `ai_history`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `module` | TEXT | e.g., 'Proposal Generator' |
| `input` | JSONB | |
| `output` | JSONB | |
| `tokens_used` | INTEGER | |
| `provider` | TEXT | e.g., 'openai', 'gemini' |
| `is_favorite` | BOOLEAN | Default: `false` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `social_accounts`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `provider` | TEXT | e.g., 'linkedin', 'facebook' |
| `provider_user_id` | TEXT | |
| `username` | TEXT | |
| `display_name` | TEXT | |
| `email` | TEXT | |
| `avatar` | TEXT | |
| `access_token` | TEXT | |
| `refresh_token` | TEXT | |
| `expires_at` | TIMESTAMPTZ | |
| `scope` | TEXT | |
| `status` | TEXT | Default: `'connected'` |
| `last_sync` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `posts`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `title` | TEXT | |
| `content` | TEXT | |
| `hashtags` | TEXT | |
| `mentions` | TEXT | |
| `link` | TEXT | |
| `media_urls` | JSONB | |
| `status` | TEXT | Default: `'Draft'` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |
| `updated_at` | TIMESTAMPTZ | Default: `now()` |

### `scheduled_posts`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `post_id` | UUID | Foreign Key → `posts.id` |
| `provider` | TEXT | |
| `social_account_id` | UUID | Foreign Key → `social_accounts.id` |
| `scheduled_time` | TIMESTAMPTZ | |
| `timezone` | TEXT | Default: `'UTC'` |
| `status` | TEXT | Default: `'Scheduled'` |
| `retry_count` | INTEGER | Default: `0` |
| `published_at` | TIMESTAMPTZ | |
| `error_message` | TEXT | |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `notifications`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `title` | TEXT | |
| `message` | TEXT | |
| `type` | TEXT | Default: `'info'` |
| `is_read` | BOOLEAN | Default: `false` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `subscriptions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `plan` | TEXT | |
| `status` | TEXT | |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `payments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `invoice_id` | TEXT | |
| `amount` | NUMERIC | |
| `currency` | TEXT | Default: `'USD'` |
| `status` | TEXT | |
| `pdf_url` | TEXT | |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `analytics`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `date` | DATE | |
| `credits_used` | INTEGER | |
| `words_generated` | INTEGER | |
| `time_saved_minutes` | INTEGER | |
| `tool_usage` | JSONB | Array of `{tool, count}` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `settings`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id`, Unique |
| `fullName` | TEXT | |
| `email` | TEXT | |
| `notifications` | BOOLEAN | Default: `true` |
| `darkMode` | BOOLEAN | Default: `true` |
| `aiProvider` | TEXT | Default: `'openai'` |
| `social_settings` | JSONB | |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `activity_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `action` | TEXT | |
| `details` | JSONB | |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `campaigns`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `name` | TEXT | |
| `description` | TEXT | |
| `color` | TEXT | Default: `'#3B82F6'` |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `budget` | NUMERIC | Default: `0` |
| `goal` | TEXT | |
| `status` | TEXT | Default: `'Active'` |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `media_library`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `type` | TEXT | MIME type |
| `url` | TEXT | |
| `filename` | TEXT | |
| `size` | INTEGER | Bytes |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

### `social_analytics`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `profiles.id` |
| `provider` | TEXT | |
| `post_id` | TEXT | |
| `impressions` | INTEGER | |
| `engagement` | INTEGER | |
| `clicks` | INTEGER | |
| `date` | DATE | |
| `created_at` | TIMESTAMPTZ | Default: `now()` |

## Relationships

```
profiles ──┬──< projects
           ├──< gigs
           ├──< ai_history
           ├──< social_accounts
           ├──< posts
           ├──< scheduled_posts
           ├──< notifications
           ├──< subscriptions
           ├──< payments
           ├──< analytics
           ├──< settings
           ├──< activity_logs
           ├──< campaigns
           ├──< media_library
           └──< social_analytics

posts ──< scheduled_posts
social_accounts ──< scheduled_posts
```

## File-Based JSON Database

When running in mock mode, data is stored in `db.json` at the project root.

**Collections:**

| Collection | Maps To Table |
|------------|---------------|
| `users` | `profiles` |
| `projects` | `projects` |
| `gigs` | `gigs` |
| `generations` | `ai_history` |
| `social_accounts` | `social_accounts` |
| `posts` | `posts` |
| `scheduled_posts` | `scheduled_posts` |
| `notifications` | `notifications` |
| `subscriptions` | `subscriptions` |
| `billing` | `payments` |
| `analytics` | `analytics` |
| `settings` | `settings` |
| `history` | `activity_logs` |
| `campaigns` | `campaigns` |
| `media_library` | `media_library` |
| `social_analytics` | `social_analytics` |

The JSON database auto-seeds with sample data on first access.

## Related

- [Supabase](SUPABASE.md)
- [Architecture](ARCHITECTURE.md)
