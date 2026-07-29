import type { UserProfile, UserRole } from '@gigpilot/shared';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

export class AuthService {
  private secretKey: string;
  private supabase: SupabaseClient;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.JWT_SECRET || 'gigpilot-secret-jwt-key-2026';
    const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'mock-key';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Generate simulated JWT token for user session
  public createToken(user: UserProfile): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  // Verify JWT session token
  public async verifyToken(token: string): Promise<JwtPayload | null> {
    // Try to verify token with Supabase first
    try {
      if (token && token !== 'mock-session-token' && !token.startsWith('mock-')) {
        const { data: { user }, error } = await this.supabase.auth.getUser(token);
        if (!error && user) {
          return {
            userId: user.id,
            email: user.email || '',
            role: (user.user_metadata?.role as UserRole) || 'Pro',
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
          };
        }
      }
    } catch (err) {
      // Ignored, fallback to local verification
    }

    // Fallback to local base64 JWT decoding for compatibility and simulation/testing
    try {
      const jsonStr = Buffer.from(token, 'base64url').toString('utf-8');
      const payload = JSON.parse(jsonStr) as JwtPayload;
      if (payload.exp < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }

  // Role permissions validator
  public hasPermission(role: UserRole, requiredRole: UserRole): boolean {
    const rolesOrder: UserRole[] = ['Free', 'Pro', 'Agency', 'Admin'];
    return rolesOrder.indexOf(role) >= rolesOrder.indexOf(requiredRole);
  }

  // Generate Google OAuth URL
  public getGoogleAuthUrl(redirectUri: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=email%20profile`;
  }

  // Generate Magic Link
  public createMagicLink(email: string): string {
    const token = Buffer.from(JSON.stringify({ email, exp: Date.now() + 15 * 60 * 1000 })).toString('base64url');
    return `https://gigpilot.ai/auth/magic-verify?token=${token}`;
  }
}

export const authService = new AuthService();
