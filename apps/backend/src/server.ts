import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';

import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { registerRoutes } from './routes';

// Initialize Fastify with Pino Logging and credential redactions for security
const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: {
      paths: ['req.headers.authorization', 'req.body.password', 'req.body.data'],
      censor: '[REDACTED]'
    }
  }
});

async function bootstrap() {
  // 1. Helmet for security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", env.SUPABASE_URL]
      }
    }
  });

  // 2. CORS configuration allowing only specific domains
  const allowedOrigins = env.FRONTEND_URL.split(',');
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, or local testing)
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // 3. Rate Limiting to prevent brute-force and DDoS (100 requests per minute)
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => (req.headers['x-forwarded-for'] as string) || req.ip
  });

  // 4. Response Compression
  await fastify.register(compress, { global: true });

  // 5. Cookie support
  await fastify.register(cookie, { secret: env.JWT_SECRET });

  // 6. Global Error Handler
  fastify.setErrorHandler(errorHandler);

  // 7. Route registrations
  await fastify.register(registerRoutes);

  // Start the server only if we are not in testing mode
  if (process.env.NODE_ENV !== 'test') {
    try {
      const address = await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
      console.log(`🚀 GigPilot AI backend listening on ${address}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  }
}

// Compatibility helper for testing (emulates Hono's app.request using Fastify's inject)
(fastify as any).request = async (path: string, init?: any) => {
  const method = init?.method || 'GET';
  
  // Normalize headers
  const headers: Record<string, string> = {};
  if (init?.headers) {
    if (typeof init.headers.forEach === 'function') {
      init.headers.forEach((value: string, key: string) => {
        headers[key] = value;
      });
    } else if (typeof init.headers === 'object') {
      Object.assign(headers, init.headers);
    }
  }

  // Parse body payload
  let payload = init?.body;
  if (payload && typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      // Keep as string
    }
  }

  const response = await fastify.inject({
    method,
    url: path,
    headers,
    payload
  });

  return {
    status: response.statusCode,
    headers: {
      get: (name: string) => response.headers[name.toLowerCase()]
    },
    json: async () => JSON.parse(response.body),
    text: async () => response.body
  };
};

bootstrap();
export default fastify;

