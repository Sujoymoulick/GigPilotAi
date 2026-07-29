export interface SocialProvider {
  connect(code: string, redirectUri: string, codeVerifier?: string): Promise<any>;
  disconnect(accountId: string): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<any>;
  publish(post: { title?: string; content: string; url?: string; mediaUrls?: string[] }, account: any): Promise<{ success: boolean; url?: string; providerPostId?: string; error?: string }>;
  schedule(post: any, account: any, scheduledTime: string): Promise<boolean>;
  deletePost(providerPostId: string, account: any): Promise<boolean>;
  getProfile(accessToken: string): Promise<{ username: string; displayName: string; avatar?: string; email?: string; providerUserId: string }>;
  getPosts(accessToken: string): Promise<any[]>;
  getStatus(): Promise<{ status: 'active' | 'error'; message?: string }>;
}
