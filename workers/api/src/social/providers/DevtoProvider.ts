import type { SocialProvider } from './SocialProvider';

export class DevtoProvider implements SocialProvider {
  private isMock(token: string): boolean {
    return token.startsWith('mock_') || token === 'mock';
  }

  async connect(code: string, redirectUri: string, codeVerifier?: string): Promise<any> {
    // For Dev.to, code is the user's API Key
    if (this.isMock(code)) {
      return {
        access_token: 'mock_devto_key_' + Math.random().toString(36).substring(2),
        refresh_token: '',
        expires_in: 0,
        scope: 'api-key'
      };
    }

    // Verify token validity by fetching self profile
    try {
      const response = await fetch('https://dev.to/api/users/me', {
        headers: { 'api-key': code }
      });

      if (!response.ok) {
        throw new Error('Invalid Dev.to API Key');
      }

      return {
        access_token: code,
        refresh_token: '',
        expires_in: 0,
        scope: 'api-key'
      };
    } catch (err: any) {
      throw new Error(`Dev.to connection failed: ${err.message}`);
    }
  }

  async disconnect(accountId: string): Promise<boolean> {
    return true;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    return {
      access_token: refreshToken,
      expires_in: 0
    };
  }

  async publish(post: { title?: string; content: string; url?: string; mediaUrls?: string[] }, account: any): Promise<{ success: boolean; url?: string; providerPostId?: string; error?: string }> {
    if (this.isMock(account.access_token)) {
      const mockPostId = Math.floor(Math.random() * 1000000);
      return {
        success: true,
        providerPostId: String(mockPostId),
        url: `https://dev.to/gigpilot_ai/custom-article-${mockPostId}`
      };
    }

    try {
      const body_markdown = post.content + (post.url ? `\n\n[Link to full resource](${post.url})` : '');
      const response = await fetch('https://dev.to/api/articles', {
        method: 'POST',
        headers: {
          'api-key': account.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          article: {
            title: post.title || 'Insight from GigPilot AI',
            body_markdown,
            published: true,
            main_image: post.mediaUrls?.[0] || ''
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return {
          success: false,
          error: err.error || 'Dev.to article publishing failed'
        };
      }

      const data = await response.json();
      return {
        success: true,
        providerPostId: String(data.id),
        url: data.url
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Connection failure to Dev.to'
      };
    }
  }

  async schedule(post: any, account: any, scheduledTime: string): Promise<boolean> {
    return true;
  }

  async deletePost(providerPostId: string, account: any): Promise<boolean> {
    // Dev.to API does not expose a public DELETE endpoint for articles directly via standard API
    return false;
  }

  async getProfile(accessToken: string): Promise<{ username: string; displayName: string; avatar?: string; email?: string; providerUserId: string }> {
    if (this.isMock(accessToken)) {
      return {
        username: 'gigpilot_devto',
        displayName: 'GigPilot AI Author',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        email: 'devto@gigpilot.ai',
        providerUserId: 'devto_acc_100201'
      };
    }

    try {
      const response = await fetch('https://dev.to/api/users/me', {
        headers: { 'api-key': accessToken }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile details from Dev.to');
      }

      const data = await response.json();
      return {
        username: data.username,
        displayName: data.name,
        avatar: data.profile_image,
        providerUserId: String(data.id)
      };
    } catch (err: any) {
      throw new Error(`Dev.to verify API key failed: ${err.message}`);
    }
  }

  async getPosts(accessToken: string): Promise<any[]> {
    if (this.isMock(accessToken)) {
      return [
        {
          id: 'devto_p1',
          content: 'A complete guide to automating your social posts using official APIs and Hono.',
          url: 'https://dev.to/gigpilot_ai/guide-to-automation',
          created_at: new Date(Date.now() - 3600 * 1000 * 30).toISOString()
        }
      ];
    }

    try {
      const response = await fetch('https://dev.to/api/articles/me/all', {
        headers: { 'api-key': accessToken }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return (data || []).map((art: any) => ({
        id: String(art.id),
        content: art.title + '\n' + (art.description || ''),
        url: art.url,
        created_at: new Date(art.published_at || art.created_at || Date.now()).toISOString()
      }));
    } catch {
      return [];
    }
  }

  async getStatus(): Promise<{ status: 'active' | 'error'; message?: string }> {
    return { status: 'active' };
  }
}
