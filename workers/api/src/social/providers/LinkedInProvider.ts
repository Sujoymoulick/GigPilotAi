import type { SocialProvider } from './SocialProvider';

export class LinkedInProvider implements SocialProvider {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || 'mock';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || 'mock';
  }

  private isMock(): boolean {
    return this.clientId === 'mock' || this.clientId === '';
  }

  async connect(code: string, redirectUri: string, codeVerifier?: string): Promise<any> {
    if (this.isMock()) {
      return {
        access_token: 'mock_linkedin_access_token_' + Math.random().toString(36).substring(2),
        refresh_token: 'mock_linkedin_refresh_token_' + Math.random().toString(36).substring(2),
        expires_in: 5184000, // 60 days
        scope: 'w_member_social r_liteprofile r_emailaddress'
      };
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn OAuth failed: ${errorText}`);
    }

    return await response.json();
  }

  async disconnect(accountId: string): Promise<boolean> {
    // In production, we might revoke the token
    return true;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    if (this.isMock()) {
      return {
        access_token: 'mock_linkedin_access_token_' + Math.random().toString(36).substring(2),
        refresh_token: refreshToken,
        expires_in: 5184000
      };
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error('Failed to refresh LinkedIn token');
    }

    return await response.json();
  }

  async publish(post: { title?: string; content: string; url?: string; mediaUrls?: string[] }, account: any): Promise<{ success: boolean; url?: string; providerPostId?: string; error?: string }> {
    if (this.isMock()) {
      const mockPostId = 'urn:li:share:' + Math.floor(Math.random() * 1000000000);
      return {
        success: true,
        providerPostId: mockPostId,
        url: `https://www.linkedin.com/feed/update/${mockPostId}`
      };
    }

    // Official LinkedIn API /v2/posts or /v2/ugcPosts
    // Let's get the person URN from account provider_user_id
    const authorUrn = `urn:li:person:${account.provider_user_id}`;
    
    // Construct the payload for LinkedIn Share API
    const payload: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    if (post.url) {
      payload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
      payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: post.url,
          title: { text: post.title || 'Shared via GigPilot AI' }
        }
      ];
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.message || 'LinkedIn publishing failed'
      };
    }

    const data = await response.json();
    return {
      success: true,
      providerPostId: data.id,
      url: `https://www.linkedin.com/feed/update/${data.id}`
    };
  }

  async schedule(post: any, account: any, scheduledTime: string): Promise<boolean> {
    // Native scheduling is not directly supported on LinkedIn's basic ugcPosts API,
    // so we return true indicating the application scheduler will trigger publishing.
    return true;
  }

  async deletePost(providerPostId: string, account: any): Promise<boolean> {
    if (this.isMock()) return true;

    const response = await fetch(`https://api.linkedin.com/v2/ugcPosts/${providerPostId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    return response.ok;
  }

  async getProfile(accessToken: string): Promise<{ username: string; displayName: string; avatar?: string; email?: string; providerUserId: string }> {
    if (this.isMock()) {
      return {
        username: 'alexvance_linkedin',
        displayName: 'Alex Vance',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        email: 'alex@gigpilot.ai',
        providerUserId: 'li_usr_998273'
      };
    }

    // Official LinkedIn user info API (OIDC /v2/userinfo)
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn profile');
    }

    const data = await response.json();
    return {
      username: data.sub || data.id,
      displayName: `${data.given_name || ''} ${data.family_name || ''}`.trim() || data.name,
      avatar: data.picture,
      email: data.email,
      providerUserId: data.sub || data.id
    };
  }

  async getPosts(accessToken: string): Promise<any[]> {
    if (this.isMock()) {
      return [
        {
          id: 'li_post_1',
          content: 'Just launched my NextJS template package on GigPilot AI. Building apps has never been faster!',
          url: 'https://www.linkedin.com/feed/update/urn:li:share:123456',
          created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
        }
      ];
    }

    // Fetches recent shares/updates
    const response = await fetch('https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return (data.elements || []).map((el: any) => ({
      id: el.id,
      content: el.text?.text || '',
      created_at: new Date(el.created?.time || Date.now()).toISOString()
    }));
  }

  async getStatus(): Promise<{ status: 'active' | 'error'; message?: string }> {
    return { status: 'active' };
  }
}
