import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().url().default('https://mock.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('mock-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default('mock-service-role-key'),
  JWT_SECRET: z.string().default('gigpilot-secret-jwt-key-2026'),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000,http://localhost:4321,http://127.0.0.1:4321,http://127.0.0.1:3000'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
export type Env = z.infer<typeof envSchema>;
