import type { SocialProvider } from './SocialProvider';

export class MastodonProvider implements SocialProvider {
  private defaultInstance: string = 'mastodon.social';

  private getInstance(account?: any): string {
    if (account && account.scope && account.scope.includes('instance:')) {
      const match = account.scope.split(' ').find((s: string) => s.startsWith('instance:'));
      if (match) return match.split(':')[1];
    }
    return this.defaultInstance;
  }

  private isMock(token: string): boolean {
    return token.startsWith('mock_') || token === 'mock';
  }

  async connect(code: string, redirectUri: string, codeVerifier?: string): Promise<any> {
    // Note: Code can contain "instance:authorization_code". Let's parse instance.
    let instance = this.defaultInstance;
    let authCode = code;

    if (code.includes('|')) {
      const parts = code.split('|');
      instance = parts[0];
      authCode = parts[1];
    }

    if (authCode === 'mock') {
      return {
        access_token: 'mock_mastodon_token_' + Math.random().toString(36).substring(2),
        refresh_token: 'mock_mastodon_refresh_token',
        expires_in: 0,
        scope: `read write follow instance:${instance}`
      };
    }

    try {
      // Step 1: Register Application on the target instance dynamically
      const registerRes = await fetch(`https://${instance}/api/v1/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'GigPilot AI',
          redirect_uris: redirectUri,
          scopes: 'read write follow',
          website: 'https://gigpilot.ai'
        })
      });

      if (!registerRes.ok) {
        throw new Error('Failed to register Mastodon application dynamically');
      }

      const appData = await registerRes.json();

      // Step 2: Exchange Authorization Code for Access Token
      const tokenRes = await fetch(`https://${instance}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: appData.client_id,
          client_secret: appData.client_secret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code: authCode,
          scope: 'read write follow'
        })
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to exchange authorization code for Mastodon token');
      }

      const tokenData = await tokenRes.json();
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || '',
        expires_in: tokenData.expires_in || 0,
        scope: `${tokenData.scope || 'read write follow'} instance:${instance}`
      };
    } catch (err: any) {
      throw new Error(`Mastodon connection failed: ${err.message}`);
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
    const instance = this.getInstance(account);
    
    if (this.isMock(account.access_token)) {
      const mockPostId = 'mast_status_' + Math.floor(Math.random() * 1000000000);
      return {
        success: true,
        providerPostId: mockPostId,
        url: `https://${instance}/@${account.username || 'user'}/${mockPostId}`
      };
    }

    try {
      let statusText = post.content;
      if (post.url) {
        statusText += `\n\n${post.url}`;
      }

      const response = await fetch(`https://${instance}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: statusText,
          visibility: 'public'
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return {
          success: false,
          error: err.error || 'Mastodon status posting failed'
        };
      }

      const data = await response.json();
      return {
        success: true,
        providerPostId: data.id,
        url: data.url || `https://${instance}/@${account.username}/${data.id}`
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Connection failure to Mastodon instance'
      };
    }
  }

  async schedule(post: any, account: any, scheduledTime: string): Promise<boolean> {
    return true;
  }

  async deletePost(providerPostId: string, account: any): Promise<boolean> {
    const instance = this.getInstance(account);
    if (this.isMock(account.access_token)) return true;

    try {
      const response = await fetch(`https://${instance}/api/v1/statuses/${providerPostId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${account.access_token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getProfile(accessToken: string): Promise<{ username: string; displayName: string; avatar?: string; email?: string; providerUserId: string }> {
    // Retrieve instance info from token scope
    let instance = this.defaultInstance;
    if (accessToken.includes('instance:')) {
      // Find instance from mock access tokens, or parse scope
      const parts = accessToken.split('_');
      if (parts.length > 2) {
        // Mock token shape e.g. mock_mastodon_token_{random}
      }
    }

    if (this.isMock(accessToken)) {
      return {
        username: 'alexvance_mastodon',
        displayName: 'Alex Vance',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        email: 'mastodon@gigpilot.ai',
        providerUserId: 'mast_usr_998182'
      };
    }

    try {
      // Parse instance out of scopes
      // (This will be called in callback with the connected credentials)
      const response = await fetch(`https://${instance}/api/v1/accounts/verify_credentials`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error('Failed to verify credentials on Mastodon instance');
      }

      const data = await response.json();
      return {
        username: data.username,
        displayName: data.display_name || data.username,
        avatar: data.avatar,
        providerUserId: data.id
      };
    } catch (err: any) {
      throw new Error(`Mastodon verify credentials failed: ${err.message}`);
    }
  }

  async getPosts(accessToken: string): Promise<any[]> {
    const instance = this.defaultInstance;
    if (this.isMock(accessToken)) {
      return [
        {
          id: 'mast_p1',
          content: 'Hello Mastodon federated network! Seamless posting directly via GigPilot AI.',
          url: `https://${instance}/@alexvance_mastodon/mast_p1`,
          created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
        }
      ];
    }

    try {
      const verifyRes = await fetch(`https://${instance}/api/v1/accounts/verify_credentials`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!verifyRes.ok) return [];
      const user = await verifyRes.json();

      const response = await fetch(`https://${instance}/api/v1/accounts/${user.id}/statuses?limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return (data || []).map((s: any) => ({
        id: s.id,
        content: s.content?.replace(/<[^>]*>/g, '') || '', // strip simple HTML tags returned by Mastodon API
        url: s.url,
        created_at: new Date(s.created_at || Date.now()).toISOString()
      }));
    } catch {
      return [];
    }
  }

  async getStatus(): Promise<{ status: 'active' | 'error'; message?: string }> {
    return { status: 'active' };
  }
}
