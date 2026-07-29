# SDK Examples

## JavaScript / Browser

### Installation

No installation required - use the native `fetch` API.

### Authentication

```javascript
const API_URL = 'http://localhost:3000';
const token = 'your-jwt-token';

// Login
const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    fullName: 'John Doe'
  })
});
const { data: { token } } = await loginResponse.json();
```

### API Calls

```javascript
// Get AI History
const history = await fetch(`${API_URL}/api/history`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Generate Proposal
const proposal = await fetch(`${API_URL}/api/proposal/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    jobDescription: 'Need a landing page for my SaaS',
    myService: 'Full Stack Development',
    tone: 'Professional'
  })
}).then(r => r.json());

// Generate Gig
const gig = await fetch(`${API_URL}/api/gig/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    service: 'Logo Design',
    category: 'Graphic Design'
  })
}).then(r => r.json());
```

## TypeScript

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  credits_remaining: number;
}

class GigPilotClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });
    return response.json();
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/api/auth/me');
  }

  async generateProposal(input: {
    jobDescription: string;
    myService: string;
    tone?: string;
  }) {
    return this.request('/api/proposal/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async generateGig(input: {
    service: string;
    category?: string;
  }) {
    return this.request('/api/gig/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getHistory() {
    return this.request('/api/history');
  }
}

// Usage
const client = new GigPilotClient('http://localhost:3000', 'your-token');
const profile = await client.getProfile();
```

## Node.js

```javascript
const API_URL = 'http://localhost:3000';

async function gigpilotRequest(endpoint, options = {}) {
  const token = options.token || process.env.GIGPILOT_TOKEN;
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  return response.json();
}

// Login
const login = await gigpilotRequest('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: process.env.EMAIL,
    fullName: process.env.NAME,
  }),
});

const token = login.data.token;

// Generate a proposal
const proposal = await gigpilotRequest('/api/proposal/generate', {
  method: 'POST',
  token,
  body: JSON.stringify({
    jobDescription: 'Build a React dashboard',
    myService: 'Frontend Development',
  }),
});

console.log(proposal.data);
```

## Python

```python
import requests

API_URL = "http://localhost:3000"

class GigPilotClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.headers = {"Content-Type": "application/json"}
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    def login(self, email, full_name=None):
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": email, "fullName": full_name},
            headers=self.headers,
        )
        data = response.json()
        self.token = data["data"]["token"]
        self.headers["Authorization"] = f"Bearer {self.token}"
        return data

    def generate_proposal(self, job_description, my_service, tone=None):
        payload = {
            "jobDescription": job_description,
            "myService": my_service,
        }
        if tone:
            payload["tone"] = tone
        
        response = requests.post(
            f"{self.base_url}/api/proposal/generate",
            json=payload,
            headers=self.headers,
        )
        return response.json()

    def generate_gig(self, service, category=None):
        payload = {"service": service}
        if category:
            payload["category"] = category
        
        response = requests.post(
            f"{self.base_url}/api/gig/generate",
            json=payload,
            headers=self.headers,
        )
        return response.json()

    def get_history(self):
        response = requests.get(
            f"{self.base_url}/api/history",
            headers=self.headers,
        )
        return response.json()

# Usage
client = GigPilotClient(API_URL)
client.login("user@example.com", "John Doe")

proposal = client.generate_proposal(
    job_description="Build a landing page",
    my_service="Web Development",
    tone="Professional"
)
print(proposal)
```

## cURL

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "fullName": "John Doe"}'
```

### Generate Proposal

```bash
curl -X POST http://localhost:3000/api/proposal/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jobDescription": "Need a React dashboard for analytics",
    "myService": "Frontend Development",
    "tone": "Professional"
  }'
```

### Generate Gig

```bash
curl -X POST http://localhost:3000/api/gig/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "service": "Logo Design",
    "category": "Graphic Design"
  }'
```

### Get History

```bash
curl http://localhost:3000/api/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Find Keywords

```bash
curl -X POST http://localhost:3000/api/keywords/find \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"service": "Logo Design"}'
```

### Upload File

```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "filename": "photo.jpg",
    "contentType": "image/jpeg",
    "data": "BASE64_ENCODED_DATA"
  }'
```

### Connect Social Account

```bash
curl -X POST http://localhost:3000/api/social/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "provider": "linkedin",
    "code": "oauth-authorization-code"
  }'
```

### Schedule Post

```bash
curl -X POST http://localhost:3000/api/social/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Check out our latest blog post!",
    "scheduledTime": "2026-08-01T10:00:00Z",
    "accountIds": ["account-uuid-1", "account-uuid-2"]
  }'
```

## Related

- [API Reference](API_REFERENCE.md)
- [API Index](API_INDEX.md)
- [Authentication](AUTHENTICATION.md)
