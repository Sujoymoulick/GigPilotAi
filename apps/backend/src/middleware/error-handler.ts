import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/AppError';

// Fastify global error handler
export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  // Log details using Pino logging
  req.log.error(error);

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      message: error.message,
      error: error.errorDetails || {}
    });
  }

  // Hide stack trace and system details in production
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = error.statusCode || 500;
  
  return reply.code(statusCode).send({
    success: false,
    message: isProd ? 'Internal Server Error' : error.message,
    error: isProd ? {} : { details: error.message, stack: error.stack }
  });
}
