# Storage

## Overview

GigPilot AI uses **Supabase Storage** (backed by Cloudflare R2) for file uploads.

## Bucket

| Property | Value |
|----------|-------|
| Name | `gigpilot-assets` |
| Visibility | Private (signed URLs) |
| File Size Limit | 5 MB |
| Cache Control | 3600 seconds (1 hour) |

## Allowed File Types

| MIME Type | Extension |
|-----------|-----------|
| `image/jpeg` | .jpg, .jpeg |
| `image/png` | .png |
| `image/webp` | .webp |
| `image/gif` | .gif |
| `application/pdf` | .pdf |

## Upload Endpoint

**`POST /api/storage/upload`**

### Request

The endpoint accepts base64-encoded file data in JSON format:

```json
{
  "filename": "profile-photo.jpg",
  "contentType": "image/jpeg",
  "data": "base64-encoded-file-content..."
}
```

### Validation Rules

- `filename` (required): Original filename
- `data` (required): Base64-encoded file content
- `contentType` (optional): MIME type, defaults to `image/jpeg`
- Maximum file size: **5 MB**
- Only allowed MIME types accepted

### Success Response

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "path": "user-uuid/1722470400000_profile-photo.jpg",
    "url": "https://your-project.supabase.co/storage/v1/object/sign/gigpilot-assets/..."
  }
}
```

### Error Responses

**File too large:**

```json
{
  "success": false,
  "message": "File exceeds maximum size limit of 5MB"
}
```

**Invalid file type:**

```json
{
  "success": false,
  "message": "File type \"text/plain\" is not supported. Supported: JPEG, PNG, WEBP, GIF, PDF."
}
```

## File Path Structure

```
gigpilot-assets/
└── {user_id}/
    └── {timestamp}_{filename}
```

Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890/1722470400000_profile-photo.jpg`

## Signed URLs

Files are accessed via signed URLs with **24-hour expiry**.

```typescript
// Generate signed URL
const { data, error } = await client.storage
  .from('gigpilot-assets')
  .createSignedUrl(path, 86400); // 24 hours
```

## Mock Mode

When Supabase is not configured (mock mode), uploads return placeholder URLs:

- Images: Unsplash placeholder
- PDFs: W3C test PDF

## Upload Flow

```
Client                    Backend                   Supabase Storage
  │                         │                          │
  │  POST /api/storage/     │                          │
  │  upload (base64)        │                          │
  │────────────────────────▶│                          │
  │                         │                          │
  │  1. Validate type/size  │                          │
  │                         │                          │
  │  2. Decode base64       │                          │
  │     to Buffer           │                          │
  │                         │                          │
  │  3. Upload to           │                          │
  │     storage bucket      │                          │
  │──────────────────────────────────────────────────▶│
  │                         │                          │
  │                         │  4. Store file           │
  │                         │                          │
  │                         │  5. Return path          │
  │                         │◀─────────────────────────│
  │                         │                          │
  │  6. Generate signed URL │                          │
  │──────────────────────────────────────────────────▶│
  │                         │                          │
  │                         │  7. Return signed URL    │
  │                         │◀─────────────────────────│
  │                         │                          │
  │  8. Return path + URL   │                          │
  │◀────────────────────────│                          │
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| File exceeds 5 MB | Upload too large | Compress or resize file |
| Unsupported file type | Invalid MIME type | Convert to allowed format |
| Storage upload failed | Supabase connection issue | Check Supabase status |
| Missing filename or data | Incomplete request | Provide all required fields |

## Related

- [Supabase](SUPABASE.md)
- [API: Storage](api/storage.md)
