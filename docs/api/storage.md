# Storage API

## Endpoints

### `POST /api/storage/upload`

Upload a file to Supabase Storage.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | string | Yes | Original filename |
| `contentType` | string | No | MIME type (default: `image/jpeg`) |
| `data` | string | Yes | Base64-encoded file content |

**Validation Rules:**

- File size: Max **5 MB**
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`

**Success Response (200):**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "path": "user-uuid/1722470400000_profile-photo.jpg",
    "url": "https://your-project.supabase.co/storage/v1/object/sign/gigpilot-assets/user-uuid/1722470400000_profile-photo.jpg?token=..."
  }
}
```

**Error Responses:**

| Code | Message |
|------|---------|
| 400 | Missing filename or base64 file data |
| 400 | File exceeds maximum size limit of 5MB |
| 400 | File type "text/plain" is not supported. Supported: JPEG, PNG, WEBP, GIF, PDF. |

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "filename": "profile.jpg",
    "contentType": "image/jpeg",
    "data": "base64EncodedData..."
  }'
```

```javascript
// Convert file to base64
const file = document.getElementById('file-input').files[0];
const reader = new FileReader();
reader.onload = async () => {
  const base64 = reader.result.split(',')[1];
  const { data } = await api.post('/api/storage/upload', {
    filename: file.name,
    contentType: file.type,
    data: base64
  });
  console.log('Uploaded:', data.url);
};
reader.readAsDataURL(file);
```

```python
import base64

with open('photo.jpg', 'rb') as f:
    data = base64.b64encode(f.read()).decode()

res = requests.post('http://localhost:3000/api/storage/upload',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'filename': 'photo.jpg',
        'contentType': 'image/jpeg',
        'data': data
    }
)
print(res.json()['data']['url'])
```

**File Path Structure:**

```
gigpilot-assets/
└── {user_id}/
    └── {timestamp}_{filename}
```

**Signed URLs:**

Uploaded files are accessible via signed URLs with **24-hour expiry**.

## Versioned Endpoint

- `POST /api/v1/storage/upload`

## Related

- [Supabase](../SUPABASE.md)
- [Storage Guide](../STORAGE.md)
