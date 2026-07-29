import type { SocialProvider } from './SocialProvider';

export class InstagramProvider implements SocialProvider {
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
        access_token: 'mock_instagram_access_token_' + Math.random().toString(36).substring(2),
        refresh_token: 'mock_instagram_refresh_token',
        expires_in: 5184000,
        scope: 'instagram_basic instagram_content_publish public_profile'
      };
    }

    // Connect via Facebook login to retrieve the Instagram Business Account ID
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${this.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${this.appSecret}&code=${code}`;
    const response = await fetch(tokenUrl);
    if (!response.ok) {
      throw new Error('Instagram connect failed during token exchange.');
    }
    const tokenData = await response.json();
    const userToken = tokenData.access_token;

    // Get Facebook pages linked to find the Instagram business account
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account&access_token=${userToken}`;
    const pagesResponse = await fetch(pagesUrl);
    if (!pagesResponse.ok) {
      throw new Error('Failed to fetch Facebook pages linked to Instagram.');
    }

    const pagesData = await pagesResponse.json();
    let instagramAccountId = '';
    let pageAccessToken = '';

    for (const page of pagesData.data || []) {
      if (page.instagram_business_account) {
        instagramAccountId = page.instagram_business_account.id;
        pageAccessToken = page.access_token;
        break;
      }
    }

    if (!instagramAccountId) {
      throw new Error('No Instagram Business Account linked to your Facebook Pages. Please convert your Instagram profile to a Professional/Creator account and link it to a Facebook Page.');
    }

    return {
      access_token: pageAccessToken, // Using the Page token linked to the IG account
      refresh_token: userToken,
      expires_in: 0,
      scope: 'instagram_basic instagram_content_publish',
      instagram_account_id: instagramAccountId
    };
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
    if (this.isMock()) {
      const mockPostId = 'ig_post_' + Math.floor(Math.random() * 1000000000);
      return {
        success: true,
        providerPostId: mockPostId,
        url: `https://instagram.com/p/${mockPostId}`
      };
    }

    // Instagram API requires an image or video URL to publish.
    // If no media is provided, we use a placeholder image URL or return an error since Instagram requires visual content.
    const mediaUrl = post.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    const instagramAccountId = account.instagram_account_id || account.provider_user_id;

    // Step 1: Create Container
    const containerUrl = `https://graph.facebook.com/v19.0/${instagramAccountId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: mediaUrl,
        caption: post.content,
        access_token: account.access_token
      })
    });

    if (!containerRes.ok) {
      const err = await containerRes.json();
      return {
        success: false,
        error: err.error?.message || 'Failed to create Instagram media container'
      };
    }

    const containerData = await containerRes.json();
    const creationId = containerData.id;

    // Step 2: Publish Container
    const publishUrl = `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: account.access_token
      })
    });

    if (!publishRes.ok) {
      const err = await publishRes.json();
      return {
        success: false,
        error: err.error?.message || 'Failed to publish Instagram media container'
      };
    }

    const data = await publishRes.json();
    return {
      success: true,
      providerPostId: data.id,
      url: `https://instagram.com/p/${data.id}`
    };
  }

  async schedule(post: any, account: any, scheduledTime: string): Promise<boolean> {
    return true;
  }

  async deletePost(providerPostId: string, account: any): Promise<boolean> {
    // Facebook Graph API for Instagram doesn't directly support deleting media posts via public API endpoints
    return false;
  }

  async getProfile(accessToken: string): Promise<{ username: string; displayName: string; avatar?: string; email?: string; providerUserId: string }> {
    if (this.isMock()) {
      return {
        username: 'gigpilot_instagram',
        displayName: 'GigPilot AI IG',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80',
        email: 'instagram@gigpilot.ai',
        providerUserId: 'ig_acc_998182'
      };
    }

    // Fetch details of Instagram Account
    // We assume the user connects their Facebook Page, then we query the connected IG business account
    const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`);
    if (!accountsRes.ok) {
      throw new Error('Failed to retrieve linked Instagram accounts');
    }
    const accountsData = await accountsRes.json();
    const igAccount = accountsData.data?.[0]?.instagram_business_account;

    if (!igAccount) {
      throw new Error('No linked Instagram Business account found');
    }

    return {
      username: igAccount.username,
      displayName: igAccount.name || igAccount.username,
      avatar: igAccount.profile_picture_url,
      providerUserId: igAccount.id
    };
  }

  async getPosts(accessToken: string): Promise<any[]> {
    if (this.isMock()) {
      return [
        {
          id: 'ig_post_1',
          content: 'Aesthetic workspaces make coding so much fun. Work hard, code clean!',
          url: 'https://instagram.com/p/ig_post_1',
          created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
        }
      ];
    }

    // Get posts of first connected Instagram Business account
    const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id}&access_token=${accessToken}`);
    if (!accountsRes.ok) return [];
    const accountsData = await accountsRes.json();
    const igId = accountsData.data?.[0]?.instagram_business_account?.id;
    if (!igId) return [];

    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,permalink,timestamp&access_token=${accessToken}`);
    if (!mediaRes.ok) return [];
    const mediaData = await mediaRes.json();

    return (mediaData.data || []).map((m: any) => ({
      id: m.id,
      content: m.caption || '',
      url: m.permalink,
      created_at: new Date(m.timestamp || Date.now()).toISOString()
    }));
  }

  async getStatus(): Promise<{ status: 'active' | 'error'; message?: string }> {
    return { status: 'active' };
  }
}
