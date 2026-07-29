# GigPilot AI SaaS Deployment Guide

This guide details the steps to deploy the frontend, backend, database, cache, and background queue workers of GigPilot AI in a production environment.

## 1. Database Setup (Supabase)

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project.
3. Paste and run the SQL migration script from `apps/backend/supabase_schema.sql` to initialize:
   - Primary and foreign keys
   - Indexes for search optimization
   - Row Level Security (RLS) policies
   - Automated profile triggers on user registration
4. Create a bucket in the **Storage** section named `gigpilot-assets` and configure it to be private (the backend generates signed URLs to control access).

---

## 2. Backend Server Deployment (Render)

Deploy the Fastify API application to [Render](https://render.com) as a Web Service:

1. Connect your Github repository to Render.
2. Select the `apps/backend` directory as the **Root Directory** of the service.
3. Configure the build settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables** in the Render dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default)
   - `SUPABASE_URL`: `<your-supabase-project-url>`
   - `SUPABASE_ANON_KEY`: `<your-supabase-client-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>` (used for admin syncs, keep secret!)
   - `JWT_SECRET`: `<a-secure-random-string>`
   - `REDIS_URL`: `rediss://default:<password>@<endpoint>:<port>` (from Upstash console)
   - `FRONTEND_URL`: `https://your-domain.cloudflare.workers.dev` (the URL of your deployed CF frontend, used for CORS configuration)

---

## 3. Frontend Deployment (Cloudflare Workers)

Deploy the Astro application to Cloudflare Workers using Wrangler:

1. Log into your Cloudflare account from the command line:
   ```bash
   npx wrangler login
   ```
2. Navigate to `apps/frontend` and edit `wrangler.toml` if you need custom route rules.
3. Add environmental variables for frontend compilation inside `apps/frontend/.env`:
   - `PUBLIC_API_URL`: `https://your-backend-url.onrender.com`
   - `PUBLIC_SUPABASE_URL`: `<your-supabase-project-url>`
   - `PUBLIC_SUPABASE_ANON_KEY`: `<your-supabase-client-anon-key>`
4. Build and deploy the Astro application:
   ```bash
   npm run build
   npx wrangler deploy
   ```

---

## 4. Cache & Queue Setup (Upstash Redis)

1. Log in to [Upstash](https://upstash.com) and create a new **Serverless Redis** database.
2. Locate the connection details:
   - Copy the Redis URL starting with `rediss://...` and input it as `REDIS_URL` in the Render environment settings.
   - For HTTP REST connections, copy the REST URL and token for cache clients.
3. Enable SSL support (`rediss://`) to encrypt cached traffic in transit.
