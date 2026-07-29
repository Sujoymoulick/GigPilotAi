# GigPilot AI Developer Guide

Welcome to the GigPilot AI SaaS developer codebase. This guide details how to work with the codebase, extend features, and run testing configurations.

## Code Standards & Clean Architecture Rules

When implementing modifications or adding new features:
1. **Never write business logic in routes or controllers.** Routes configure path paths; controllers check payloads using Zod schemas; services implement the business rules.
2. **Never query database clients directly in services.** Implement a method on the corresponding Repository class, and consume it inside the Service layer.
3. **Always use TypeScript type annotations.** Every method input parameter and return value must be fully typed.

---

## How to Add a New Feature Endpoint (E.g., "Add Projects Search")

### 1. Add Validator Schema (`src/validators/`)
Define a Zod validation schema inside `src/validators/index.ts`:
```typescript
export const searchProjectsSchema = z.object({
  query: z.string().min(1),
});
```

### 2. Implement Database Repository Method (`src/repositories/`)
Add a query method on `ProjectRepository` in `src/repositories/index.ts`:
```typescript
public async searchProjects(userId: string, searchTerm: string, token?: string): Promise<any[]> {
  if (this.isMock) {
    return dbClient.getCollection(this.localCollection)
      .filter((p) => p.user_id === userId && p.name.includes(searchTerm));
  }
  
  const { data, error } = await this.getClient(token)
    .from(this.table)
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%${searchTerm}%`);
    
  if (error) throw error;
  return data;
}
```

### 3. Implement Business Service Method (`src/services/`)
Add search logic to `ProjectService` inside `src/services/`:
```typescript
export class ProjectService {
  public async search(userId: string, query: string, token?: string) {
    return projectRepository.searchProjects(userId, query, token);
  }
}
```

### 4. Create Controller Handler (`src/controllers/`)
In `src/controllers/index.ts`, add the controller action:
```typescript
public async search(req: AuthenticatedRequest, reply: FastifyReply) {
  const validated = searchProjectsSchema.safeParse(req.query);
  if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
  
  const results = await projectService.search(req.user!.userId, validated.data.query, req.token);
  return reply.send({ success: true, data: results });
}
```

### 5. Register Endpoint in Routes (`src/routes/`)
Register the endpoint inside `src/routes/index.ts`:
```typescript
fastify.get('/api/v1/projects/search', { preHandler: [authenticate] }, projectController.search);
```

---

## Running & Testing

### Running the API Backend
From the workspace root, start the API:
```bash
npm run dev:api
```

### Running the Astro Frontend
Start the frontend dev server:
```bash
npm run dev:web
```

### Run Monorepo Build Check
Verify compilation clean states:
```bash
npm run build
```

### Running Test Suite
Execute the test runner script:
```bash
npm test
```
To add tests, write unit tests in `apps/backend/test/` using standard Node.js test runner assertions.
