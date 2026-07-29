# Error Handling

## Overview

GigPilot AI uses structured error responses with appropriate HTTP status codes.

## Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": { ... }
}
```

In production, stack traces and internal details are hidden:

```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": {}
}
```

## Error Classes

| Class | Status Code | Description |
|-------|-------------|-------------|
| `BadRequestError` | 400 | Invalid request data |
| `UnauthorizedError` | 401 | Authentication required or failed |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Resource conflict |
| `TooManyRequestsError` | 429 | Rate limit exceeded |
| `AppError` | 500 | Base class, internal errors |

**File:** `apps/backend/src/errors/AppError.ts`

## HTTP Status Codes

### 400 Bad Request

**Meaning:** The request body or parameters are invalid.

**Common Causes:**
- Missing required fields
- Invalid email format
- String too short/long
- Invalid enum value
- Malformed JSON

**Example:**

```json
{
  "success": false,
  "message": "Validation Failed",
  "error": {
    "email": { "_errors": ["Invalid email"] },
    "jobDescription": { "_errors": ["String must contain at least 10 character(s)"] }
  }
}
```

**Resolution:** Check the `error` object for field-level validation messages.

---

### 401 Unauthorized

**Meaning:** Authentication is required or the provided token is invalid/expired.

**Common Causes:**
- Missing `Authorization` header
- Expired JWT token
- Invalid token format
- Supabase session expired

**Example:**

```json
{
  "success": false,
  "message": "Missing Authorization Header"
}
```

**Resolution:**
1. Ensure `Authorization: Bearer <token>` header is present
2. Refresh the token via Supabase session
3. Re-authenticate if token is expired

---

### 403 Forbidden

**Meaning:** Authenticated but insufficient permissions.

**Common Causes:**
- User role lacks required permission
- Attempting to access another user's resource

**Example:**

```json
{
  "success": false,
  "message": "Forbidden"
}
```

**Resolution:** Upgrade account plan or contact support.

---

### 404 Not Found

**Meaning:** The requested resource does not exist.

**Common Causes:**
- Invalid resource ID
- Resource was deleted
- Wrong endpoint URL

**Example:**

```json
{
  "success": false,
  "message": "Account not found"
}
```

**Resolution:** Verify the resource ID and endpoint URL.

---

### 409 Conflict

**Meaning:** The request conflicts with the current state of the resource.

**Common Causes:**
- Duplicate resource creation
- Concurrent modification conflict

**Example:**

```json
{
  "success": false,
  "message": "Conflict"
}
```

**Resolution:** Retry the request or check current resource state.

---

### 429 Too Many Requests

**Meaning:** Rate limit exceeded.

**Common Causes:**
- More than 100 requests per minute from the same IP

**Example:**

```json
{
  "success": false,
  "message": "Too Many Requests"
}
```

**Resolution:** Wait before retrying. Implement exponential backoff.

---

### 500 Internal Server Error

**Meaning:** An unexpected error occurred on the server.

**Common Causes:**
- Database connection failure
- AI provider API error
- Unhandled exception

**Example (Production):**

```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": {}
}
```

**Example (Development):**

```json
{
  "success": false,
  "message": "Connection refused to database",
  "error": {
    "details": "Connection refused to database",
    "stack": "Error: Connection refused..."
  }
}
```

**Resolution:**
- Check server logs
- Verify database connectivity
- Check AI provider status

## Validation Errors

All request bodies are validated using **Zod** schemas. Validation errors return field-level details:

```json
{
  "success": false,
  "message": "Validation Failed",
  "error": {
    "email": {
      "_errors": ["Invalid email"]
    },
    "service": {
      "_errors": ["String must contain at least 3 character(s)"]
    },
    "competition": {
      "_errors": ["Invalid option, expected one of: Low, Medium, High"]
    }
  }
}
```

## Error Handler Middleware

The global error handler in `apps/backend/src/middleware/error-handler.ts`:

1. Logs the error via Pino
2. Checks if it's an `AppError` subclass
3. Returns structured JSON with appropriate status code
4. Hides stack traces in production mode

## Related

- [Rate Limits](RATE_LIMITS.md)
- [API Reference](API_REFERENCE.md)
