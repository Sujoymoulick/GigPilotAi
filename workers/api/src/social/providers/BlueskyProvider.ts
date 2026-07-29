import type { SocialProvider } from './SocialProvider';

export class BlueskyProvider implements SocialProvider {
  private serviceUrl: string;

  constructor() {
    this.serviceUrl = process.env.BLUESKY_SERVICE_URL || 'https://bsky.social';
  }

  private isMock(code: string): boolean {
    return code === 'mock' || code.startsWith('mock_');
  }

  async connect(code: string, redirectUri: string, codeVerifier?: string): Promise<any> {
    // Note: Bluesky supports OAuth but many clients use App Passwords.
    // Here we support either: if "code" is in format "handle:password", we authenticate via App Password.
    // Otherwise, we do mock / OAuth simulation.
    if (code.includes(':')) {
      const [handle, appPassword] = code.split(':');
      try {
        const response = await fetch(`${this.serviceUrl}/xrpc/com.atproto.server.createSession`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: handle,
            password: appPassword
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Bluesky login failed');
        }

        const data = await response.json();
        return {
          access_token: data.accessJwt,
          refresh_token: data.refreshJwt,
          expires_in: 7200, // 2 hours
          scope: 'atproto',
          handle: data.handle,
          did: data.did
        };
      } catch (err: any) {
        throw new Error(`Bluesky connection failed: ${err.message}`);
      }
    }

    // Default mock response
    return {
      access_token: 'mock_bluesky_jwt_' + Math.random().toString(36).substring(2),
      refresh_token: 'mock_bluesky_refresh_jwt',
      expires_in: 7200,
      scope: 'atproto',
      handle: code === 'mock' ? 'gigpilot.bsky.social' : code,
      did: 'did:plc:mock_' + Math.random().toString(36).substring(2)
    };
  }

  async disconnect(accountId: string): Promise<boolean> {
    return true;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    if (refreshToken.startsWith('mock_') || refreshToken === 'mock_bluesky_refresh_jwt') {
      return {
        access_token: 'mock_bluesky_jwt_' + Math.random().toString(36).substring(2),
        refresh_token: refreshToken,
        expires_in: 7200
      };
    }

    try {
      const response = await fetch(`${this.serviceUrl}/xrpc/com.atproto.server.refreshSession`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh Bluesky session');
      }

      const data = await response.json();
      return {
        access_token: data.accessJwt,
        refresh_token: data.refreshJwt,
        expires_in: 7200
      };
    } catch {
      throw new Error('Failed to refresh Bluesky session');
    }
  }

  async publish(post: { title?: string; content: string; url?: string; mediaUrls?: string[] }, account: any): Promise<{ success: boolean; url?: string; providerPostId?: string; error?: string }> {
    const isMockToken = account.access_token.startsWith('mock_');
    if (isMockToken) {
      const mockPostId = 'mock_post_' + Math.random().toString(36).substring(2);
      return {
        success: true,
        providerPostId: mockPostId,
        url: `https://bsky.app/profile/${account.username || 'user'}/post/${mockPostId}`
      };
    }

    try {
      const did = account.provider_user_id;
      const record: any = {
        $type: 'app.bsky.feed.post',
        text: post.content,
        createdAt: new Date().toISOString()
      };

      // Add link card facet if url is present
      if (post.url) {
        record.embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: post.url,
            title: post.title || 'Shared via GigPilot AI',
            description: post.content.substring(0, 100)
          }
        };
      }

      const response = await fetch(`${this.serviceUrl}/xrpc/com.atproto.repo.createRecord`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repo: did,
          collection: 'app.bsky.feed.post',
          record
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return {
          success: false,
          error: err.message || 'Bluesky posting failed'
        };
      }

      const data = await response.json();
      // Extract specific post key from rkey/uri
      const parts = data.uri.split('/');
      const rkey = parts[parts.length - 1];

      return {
        success: true,
        providerPostId: rkey,
        url: `https://bsky.app/profile/${account.username}/post/${rkey}`
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Internal connection failure to Bluesky'
      };
    }
  }

  async schedule(post: any, account: any, scheduledTime: string): Promise<boolean> {
    return true;
  }

  async deletePost(providerPostId: string, account: any): Promise<boolean> {
    const isMockToken = account.access_token.startsWith('mock_');
    if (isMockToken) return true;

    try {
      const response = await fetch(`${this.serviceUrl}/xrpc/com.atproto.repo.deleteRecord`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repo: account.provider_user_id,
          collection: 'app.bsky.feed.post',
          rkey: providerPostId
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async getProfile(accessToken: string): Promise<{ username: string; displayName: string; avatar?: string; email?: string; providerUserId: string }> {
    const isMockToken = accessToken.startsWith('mock_');
    if (isMockToken) {
      return {
        username: 'gigpilot.bsky.social',
        displayName: 'GigPilot AI',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80',
        email: 'bluesky@gigpilot.ai',
        providerUserId: 'did:plc:mock_gigpilot'
      };
    }

    try {
      // Decode user details or fetch from profile
      const response = await fetch(`${this.serviceUrl}/xrpc/app.bsky.actor.getProfile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve Bluesky profile');
      }

      const data = await response.json();
      return {
        username: data.handle,
        displayName: data.displayName || data.handle,
        avatar: data.avatar,
        providerUserId: data.did
      };
    } catch (err: any) {
      throw new Error(`Failed to retrieve profile: ${err.message}`);
    }
  }

  async getPosts(accessToken: string): Promise<any[]> {
    const isMockToken = accessToken.startsWith('mock_');
    if (isMockToken) {
      return [
        {
          id: 'bsky_p1',
          content: 'Hello Bluesky! Testing the new GigPilot AI scheduler integration. Works like a charm.',
          url: 'https://bsky.app/profile/gigpilot.bsky.social/post/bsky_p1',
          created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
        }
      ];
    }

    try {
      // Get self profile, then search feed
      const profRes = await fetch(`${this.serviceUrl}/xrpc/app.bsky.actor.getProfile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!profRes.ok) return [];
      const profData = await profRes.json();

      const feedRes = await fetch(`${this.serviceUrl}/xrpc/app.bsky.feed.getAuthorFeed?actor=${profData.did}&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!feedRes.ok) return [];
      const feedData = await feedRes.json();

      return (feedData.feed || []).map((f: any) => ({
        id: f.post.uri.split('/').pop(),
        content: f.post.record?.text || '',
        url: `https://bsky.app/profile/${profData.handle}/post/${f.post.uri.split('/').pop()}`,
        created_at: f.post.record?.createdAt || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }

  async getStatus(): Promise<{ status: 'active' | 'error'; message?: string }> {
    return { status: 'active' };
  }
}
