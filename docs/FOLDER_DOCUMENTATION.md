# GigPilot AI SaaS Folder Structure Documentation

This document describes the structure of the GigPilot AI SaaS codebase, with a specific focus on the transformed production-grade Fastify backend.

## Workspace Structure

The project is structured as a monorepo using npm workspaces:

```
gigpilotai/
├── apps/
│   ├── frontend/             # Astro 5 + React Web Client
│   └── backend/              # Fastify + TypeScript API Gateway (Redirection via index.ts -> server.ts)
├── packages/
│   ├── shared/               # Common TypeScript schemas and Interfaces
│   ├── database/             # Supabase Local/SQL Client Core
│   ├── ai/                   # Prompt Compilers & Multi-LLM provider orchestration
│   ├── auth/                 # JWT Signing & OAuth Helpers
│   ├── analytics/            # Credit usage metrics tracker
│   └── ui/                   # Shared glassmorphic UI layout primitives
├── docs/                     # Architectural & Deployment manuals
└── supabase_schema.sql       # PostgreSQL database schema and RLS policies
```

---

## Backend Directory Mappings (`apps/backend/src/`)

The Fastify backend uses layered Clean Architecture separated into the following directories:

| Folder | Purpose |
| :--- | :--- |
| **`config/`** | Environment configuration loader and validations using Zod schemas (`env.ts`). |
| **`plugins/`** | Fastify plugin configurations (Helmet, CORS, Rate Limiters, Compression, Cookie parsers). |
| **`middleware/`** | Request preprocessing hooks (e.g., Bearer JWT verify hook `auth.ts`, global JSON format `error-handler.ts`). |
| **`routes/`** | Path declarations mapping path prefixes to Controllers (both versioned `/api/v1/` and compatibility `/api/`). |
| **`controllers/`** | Request parsing, Zod body/query/param validation, and delegation to Services. |
| **`services/`** | Main business logic implementation (AI Prompt calls, Credit deductions, Post scheduling). |
| **`repositories/`** | Data access layer queries (dynamically selects remote SQL vs local mock JSON files). |
| **`validators/`** | Zod schemas defining expected input structures for all request bodies. |
| **`types/`** | TypeScript type overrides and type definitions. |
| **`utils/`** | Internal helper utilities. |
| **`lib/`** | Supabase client initializers (`supabase.ts`), Upstash Redis caching wrapper (`redis.ts`). |
| **`jobs/`** | BullMQ background jobs definitions and queue workers (`index.ts`). |
| **`errors/`** | Custom HTTP Error classes (`AppError.ts`) mapping standardized status codes. |
| **`server.ts`** | Core Fastify bootstrap and server listener configuration. |
| **`index.ts`** | Redirection entrypoint importing `server.ts` to preserve runner compatibility. |
