import { authService as sharedAuthService } from '@gigpilot/auth';
import { userRepository } from '../repositories';
import { UnauthorizedError } from '../errors/AppError';

export class AuthService {
  // Verifies the incoming Bearer token (JWT) using Supabase Auth
  public async verifySession(authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedError('Missing Authorization Header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('Invalid Authorization Token');
    }

    const payload = await sharedAuthService.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedError('Unauthorized: Session expired or invalid');
    }

    return payload;
  }

  // Sync profile details into the local user profiles table
  public async loginAndSync(email: string, fullName?: string, token?: string) {
    if (!email) {
      throw new Error('Email is required for syncing user profile');
    }

    let user = await userRepository.getByEmail(email, token);
    if (!user) {
      const name = fullName || email.split('@')[0];
      user = await userRepository.insertRecord({
        email,
        full_name: name,
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80`,
        role: 'Pro', // Simulation default Pro role
        credits_remaining: 450,
        monthly_quota: 500
      }, token);
    }

    // Return session jwt
    const sessionToken = sharedAuthService.createToken(user);
    return { token: sessionToken, user };
  }
}

export const authService = new AuthService();
