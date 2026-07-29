import type { FastifyReply } from 'fastify';
import { authService } from '../services/AuthService';
import type { AuthenticatedRequest } from '../controllers';

// Fastify preHandler hook to verify the JWT authorization token
export async function authenticate(req: AuthenticatedRequest, reply: FastifyReply) {
  const authHeader = req.headers['authorization'];
  
  // Verify user JWT token and fetch payload
  const session = await authService.verifySession(authHeader);
  
  // Attach user profile payload and token to request object
  req.user = session;
  req.token = authHeader!.replace('Bearer ', '');
}
