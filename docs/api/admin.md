# Admin API

## Current Status

Status: **Planned**

GigPilot AI does not currently expose admin-specific API endpoints. The `Admin` role exists in the role hierarchy but no dedicated admin routes are implemented.

## Planned Features

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/:id` | Get user details |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |

### System Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System-wide statistics |
| GET | `/api/admin/health` | System health check |
| POST | `/api/admin/maintenance` | Toggle maintenance mode |

### Content Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports` | View reported content |
| POST | `/api/admin/reports/:id/action` | Take action on report |

### AI Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/ai/usage` | AI usage statistics |
| PUT | `/api/admin/ai/limits` | Update AI limits |

## Role Hierarchy

```typescript
type UserRole = 'Free' | 'Pro' | 'Agency' | 'Admin';
```

| Role | Level | Permissions |
|------|-------|-------------|
| Free | 0 | Basic features |
| Pro | 1 | Full features |
| Agency | 2 | All features + higher limits |
| Admin | 3 | System management (planned) |

## Related

- [Auth API](auth.md)
- [Architecture](../ARCHITECTURE.md)
