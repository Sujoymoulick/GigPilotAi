# Authentication

## Overview

GigPilot AI uses **Supabase Auth** for identity management with a custom JWT-based session system for API access.

## Auth Methods

### 1. Google OAuth

Primary authentication method via Supabase Auth.

**Flow:**

1. Frontend initiates Google OAuth via Supabase
2. User authenticates with Google
3. Supabase redirects to `/auth/callback`
4. Callback page exchanges code for session
5. Session token sent to backend `/api/auth/login` for profile sync
6. Backend returns a session JWT for API access

**Frontend Initiation:**

```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### 2. Magic Link

Passwordless email authentication.

**Endpoint:** `POST /api/auth/magic-link`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Magic link generated successfully",
  "data": {
    "magicUrl": "https://gigpilot.ai/auth/magic-verify?token=..."
  }
}
```

The magic link token expires after **15 minutes**.

### 3. Email/Password Login

Used for backend profile sync after OAuth.

**Endpoint:** `POST /api/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "optional-password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "base64url-encoded-jwt",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "role": "Pro",
      "credits_remaining": 450,
      "monthly_quota": 500
    }
  }
}
```

## JWT Token Format

Tokens are **base64url-encoded JSON** containing:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "Pro",
  "exp": 1722470400000
}
```

**Token expiry:** 7 days from creation.

> **Note:** Tokens are NOT standard JWTs with HMAC signatures. They use Supabase Auth for verification first, then fall back to local base64 decoding.

## Using Tokens

Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Token Verification

The backend verification flow:

1. Extract token from `Authorization` header
2. Attempt Supabase `getUser()` verification
3. If Supabase fails, fall back to base64 local decode
4. Check expiry timestamp
5. Return payload or `null`

## Protected Routes

Routes requiring authentication use the `authenticate` middleware:

```typescript
fastify.get('/api/protected-route', {
  preHandler: [authenticate]
}, handler);
```

The middleware attaches `req.user` with:

```typescript
{
  userId: string;
  email: string;
  role: UserRole; // 'Free' | 'Pro' | 'Agency' | 'Admin'
}
```

## Role Permissions

| Role | Hierarchy | Permissions |
|------|-----------|-------------|
| Free | 0 | Basic features, 50 credits |
| Pro | 1 | Full features, 500 credits |
| Agency | 2 | All features, 2000 credits |
| Admin | 3 | Full system access |

Higher roles include all permissions of lower roles.

## Session Management (Frontend)

The frontend API client handles session lifecycle:

1. **Token Retrieval:** Checks Supabase session, falls back to localStorage
2. **Auto-Refresh:** Attempts Supabase session refresh on 401
3. **Retry Logic:** Retries failed requests once with refreshed token
4. **Expiry Handling:** Clears stored tokens and redirects to `/login`

```typescript
// Frontend API client usage
import { api } from '@/lib/api-client';

const data = await api.get('/api/history');
```

## Logout Flow

Frontend clears local storage and Supabase session:

```javascript
localStorage.removeItem('gp_token');
localStorage.removeItem('gp_user');
await supabase.auth.signOut();
window.location.href = '/login';
```

## Security Notes

- Tokens are verified against Supabase Auth when available
- Local base64 fallback is used for development/testing
- Sensitive fields are redacted in logs via Pino configuration
- CORS restricts origins to configured `FRONTEND_URL` values
- Rate limiting prevents brute-force attacks (100 req/min)
- HttpOnly cookies signed with JWT_SECRET for cookie-based flows

## Related Endpoints

- [Login](api/auth.md#post-apiauthlogin)
- [Magic Link](api/auth.md#post-apiauthmagic-link)
- [Get Profile](api/auth.md#get-apiauthme)
- [Settings](api/settings.md)
