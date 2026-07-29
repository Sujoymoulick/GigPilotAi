import type { SocialProvider } from './SocialProvider';

export class FacebookProvider implements SocialProvider {
  private appId: string;
  private appSecret: string;

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || 'mock';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || 'mock';
  }

  private isMock(): boolean {
    return this.appId === 'mock' || this.appId === '';
  }

  async connect(code: string, redirectUri: string, codeVerifier?: string): Promise<any> {
    if (this.isMock()) {
      return {
        access_token: 'mock_facebook_page_access_token_' + Math.random().toString(36).substring(2),
        refresh_token: 'mock_facebook_refresh_token',
        expires_in: 5184000,
        scope: 'pages_read_engagement pages_manage_posts public_profile'
      };
    }

    // Step 1: Exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${this.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${this.appSecret}&code=${code}`;
    const response = await fetch(tokenUrl);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Facebook OAuth exchange failed: ${JSON.stringify(err)}`);
    }

    const userData = await response.json();
    const userAccessToken = userData.access_token;

    // Step 2: Fetch Pages and get Page access token
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    if (!pagesResponse.ok) {
      throw new Error('Failed to retrieve Facebook pages linked to this account.');
    }

    const pagesData = await pagesResponse.json();
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found. Please create a Facebook page to connect.');
    }

    // Connect the first available page (default behaviour)
    const page = pagesData.data[0];
    
    // Step 3: Return details for database storage
    return {
      access_token: page.access_token, // Page Access Token is long-lived / permanent
      refresh_token: userAccessToken, // We store the user token as refresh token for safety
      expires_in: 0, // Page tokens do not expire unless revoked
      scope: 'pages_read_engagement pages_manage_posts',
      page_name: page.name,
      page_id: page.id,
      page_category: page.category
    };
  }

  async disconnect(accountId: string): Promise<boolean> {
    return true;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // Page tokens do not expire, so we can just return the active credentials
    return {
      access_token: refreshToken,
      expires_in: 0
    };
  }

  async publish(post: { title?: string; content: string; url?: string; mediaUrls?: string[] }, account: any): Promise<{ success: boolean; url?: string; providerPostId?: string; error?: string }> {
    if (this.isMock()) {
      const mockPostId = 'fb_post_' + Math.floor(Math.random() * 1000000000);
      return {
        success: true,
        providerPostId: mockPostId,
        url: `https://facebook.com/${account.provider_user_id || 'page'}/posts/${mockPostId}`
      };
    }

    // Publish to /page_id/feed
    const pageId = account.provider_user_id;
    const publishUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    
    const body: any = {
      message: post.content,
      access_token: account.access_token
    };

    if (post.url) {
      body.link = post.url;
    }

    const response = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.error?.message || 'Facebook Page publishing failed'
      };
    }

    const data = await response.json();
    return {
      success: true,
      providerPostId: data.id,
      url: `https://facebook.com/${data.id}`
    };
  }

  async schedule(post: any, account: any, scheduledTime: string): Promise<boolean> {
    return true;
  }

  async deletePost(providerPostId: string, account: any): Promise<boolean> {
    if (this.isMock()) return true;

    const deleteUrl = `https://graph.facebook.com/v19.0/${providerPostId}?access_token=${account.access_token}`;
    const response = await fetch(deleteUrl, { method: 'DELETE' });
    return response.ok;
  }

  async getProfile(accessToken: string): Promise<{ username: string; displayName: string; avatar?: string; email?: string; providerUserId: string }> {
    if (this.isMock()) {
      return {
        username: 'gigpilot_page',
        displayName: 'GigPilot AI Page',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80',
        email: 'facebook@gigpilot.ai',
        providerUserId: 'fb_page_189283921'
      };
    }

    // Fetch page profile details using page access token
    const response = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture,username&access_token=${accessToken}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Facebook Page profile details');
    }

    const data = await response.json();
    return {
      username: data.username || data.id,
      displayName: data.name,
      avatar: data.picture?.data?.url || `https://graph.facebook.com/v19.0/${data.id}/picture?type=large`,
      providerUserId: data.id
    };
  }

  async getPosts(accessToken: string): Promise<any[]> {
    if (this.isMock()) {
      return [
        {
          id: 'fb_post_1',
          content: 'Excited to announce our new Social Hub feature! Seamlessly post and schedule your updates today.',
          url: 'https://facebook.com/page/posts/fb_post_1',
          created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
        }
      ];
    }

    const response = await fetch(`https://graph.facebook.com/v19.0/me/feed?access_token=${accessToken}`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.data || []).map((p: any) => ({
      id: p.id,
      content: p.message || '',
      created_at: new Date(p.created_time || Date.now()).toISOString()
    }));
  }

  async getStatus(): Promise<{ status: 'active' | 'error'; message?: string }> {
    return { status: 'active' };
  }
}
