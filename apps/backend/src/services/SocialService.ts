import { getSocialProvider } from '../social/providers';
import { 
  socialAccountRepository, 
  scheduledPostRepository, 
  activityLogRepository 
} from '../repositories';
import { dbClient } from '@gigpilot/database'; // Import for backward compatibility database operations
import { BadRequestError, NotFoundError } from '../errors/AppError';
import { socialPostQueue } from '../jobs';

export class SocialService {
  // Accounts
  public async getAccounts(userId: string, token?: string) {
    return socialAccountRepository.getByUser(userId, token);
  }

  public async connectAccount(userId: string, body: any, token?: string) {
    const { provider, code, redirectUri } = body;
    if (!provider || !code) {
      throw new BadRequestError('Provider and Code/API Key are required');
    }

    const prov = getSocialProvider(provider);
    const tokens = await prov.connect(code, redirectUri || 'http://localhost:3000/social/callback');
    const profile = await prov.getProfile(tokens.access_token);

    const accounts = await socialAccountRepository.getByUser(userId, token);
    const existing = accounts.find((acc) => acc.provider === provider && acc.provider_user_id === profile.providerUserId);

    const recordData = {
      user_id: userId,
      provider,
      provider_user_id: profile.providerUserId,
      username: profile.username,
      display_name: profile.displayName,
      email: profile.email || '',
      avatar: profile.avatar || '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      scope: tokens.scope || '',
      status: 'connected',
      last_sync: new Date().toISOString()
    };

    let result;
    if (existing) {
      result = await socialAccountRepository.updateRecord(existing.id, recordData, token);
    } else {
      result = await socialAccountRepository.insertRecord(recordData, token);
    }

    // Log activity
    await activityLogRepository.insertRecord({
      user_id: userId,
      action: `Connected ${provider} Account`,
      details: { username: profile.username }
    }, token);

    return result;
  }

  public async disconnectAccount(userId: string, accountId: string, token?: string) {
    const account = await socialAccountRepository.queryById<any>(accountId, token);
    if (!account) throw new NotFoundError('Account not found');

    try {
      const prov = getSocialProvider(account.provider);
      await prov.disconnect(accountId);
    } catch (e) {
      // Proceed locally anyway
    }

    await socialAccountRepository.deleteRecord(accountId, token, false); // hard delete
    return true;
  }

  // Posts CRUD
  public async getPosts(userId: string, token?: string) {
    if (socialAccountRepository.isMock) {
      return dbClient.getCollection('posts')
        .filter((post) => post.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    // SQL implementation
    const list = await scheduledPostRepository.getClient(token)
      .from('posts')
      .select('*')
      .eq('user_id', userId);
    
    if (list.error) throw list.error;
    return list.data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async createOrUpdatePost(userId: string, body: any, token?: string) {
    const record = {
      user_id: userId,
      title: body.title || 'Untitled Post',
      content: body.content || '',
      hashtags: body.hashtags || '',
      mentions: body.mentions || '',
      link: body.link || '',
      media_urls: body.mediaUrls || body.media_urls || [],
      status: body.status || 'Draft'
    };

    if (socialAccountRepository.isMock) {
      let post;
      if (body.id) {
        post = dbClient.update('posts', body.id, record);
      } else {
        post = dbClient.insert('posts', record);
      }
      return post;
    }

    // Postgres SQL post CRUD
    const client = scheduledPostRepository.getClient(token);
    if (body.id) {
      const { data, error } = await client
        .from('posts')
        .update(record)
        .eq('id', body.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await client
        .from('posts')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  public async deletePost(userId: string, id: string, token?: string) {
    if (socialAccountRepository.isMock) {
      const post = dbClient.getById('posts', id);
      if (!post) throw new NotFoundError('Post not found');

      // Clean up linked scheduled posts
      const scheds = dbClient.getCollection('scheduled_posts').filter(sp => sp.post_id === id);
      scheds.forEach(sp => dbClient.delete('scheduled_posts', sp.id, false));

      dbClient.delete('posts', id, false);
      return true;
    }

    // Postgres SQL delete
    const client = scheduledPostRepository.getClient(token);
    // Delete scheduled posts child records
    await client.from('scheduled_posts').delete().eq('post_id', id);
    const { error } = await client.from('posts').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // Publish immediate
  public async publishPostImmediate(userId: string, body: any, token?: string) {
    const { postId, title, content, url, mediaUrls, accountIds } = body;
    if (!accountIds || accountIds.length === 0) {
      throw new BadRequestError('At least one social account must be selected');
    }

    let postText = content || '';
    let postTitle = title || '';
    let postUrl = url || '';
    let postMedia = mediaUrls || [];
    let dbPost: any = null;

    if (socialAccountRepository.isMock) {
      if (postId) {
        dbPost = dbClient.getById('posts', postId);
        if (dbPost) {
          postText = dbPost.content;
          postTitle = dbPost.title;
          postUrl = dbPost.link;
          postMedia = dbPost.mediaUrls || [];
        }
      } else {
        dbPost = dbClient.insert('posts', {
          user_id: userId,
          title: postTitle,
          content: postText,
          hashtags: '',
          mentions: '',
          link: postUrl,
          mediaUrls: postMedia,
          status: 'Publishing'
        });
      }
    } else {
      const client = scheduledPostRepository.getClient(token);
      if (postId) {
        const { data } = await client.from('posts').select('*').eq('id', postId).maybeSingle();
        dbPost = data;
        if (dbPost) {
          postText = dbPost.content;
          postTitle = dbPost.title;
          postUrl = dbPost.link;
          postMedia = dbPost.media_urls || [];
        }
      } else {
        const { data, error } = await client
          .from('posts')
          .insert({
            user_id: userId,
            title: postTitle,
            content: postText,
            hashtags: '',
            mentions: '',
            link: postUrl,
            media_urls: postMedia,
            status: 'Publishing'
          })
          .select()
          .single();
        if (error) throw error;
        dbPost = data;
      }
    }

    const results: any[] = [];
    let allSuccess = true;

    for (const accId of accountIds) {
      const account = await socialAccountRepository.queryById<any>(accId, token);
      if (!account) {
        results.push({ accountId: accId, success: false, error: 'Account not found' });
        allSuccess = false;
        continue;
      }

      try {
        const prov = getSocialProvider(account.provider);
        const res = await prov.publish({ title: postTitle, content: postText, url: postUrl, mediaUrls: postMedia }, account);
        results.push({
          accountId: accId,
          provider: account.provider,
          success: res.success,
          url: res.url,
          providerPostId: res.providerPostId,
          error: res.error
        });

        if (!res.success) allSuccess = false;
      } catch (err: any) {
        results.push({ accountId: accId, provider: account.provider, success: false, error: err.message });
        allSuccess = false;
      }
    }

    const finalStatus = allSuccess ? 'Published' : results.some(r => r.success) ? 'Published' : 'Failed';

    if (socialAccountRepository.isMock) {
      if (dbPost) {
        dbClient.update('posts', dbPost.id, { status: finalStatus, updated_at: new Date().toISOString() });
      }
    } else {
      const client = scheduledPostRepository.getClient(token);
      await client.from('posts').update({ status: finalStatus, updated_at: new Date().toISOString() }).eq('id', dbPost.id);
    }

    // Log to activity logs
    await activityLogRepository.insertRecord({
      user_id: userId,
      action: `Published Post`,
      details: { results }
    }, token);

    return results;
  }

  // Schedule Post
  public async schedulePost(userId: string, body: any, token?: string) {
    const { title, content, url, mediaUrls, scheduledTime, timezone, accountIds } = body;
    if (!content || !scheduledTime || !accountIds || accountIds.length === 0) {
      throw new BadRequestError('Content, scheduled time, and social accounts are required');
    }

    let post: any;
    if (socialAccountRepository.isMock) {
      post = dbClient.insert('posts', {
        user_id: userId,
        title: title || 'Untitled Post',
        content,
        hashtags: '',
        mentions: '',
        link: url || '',
        mediaUrls: mediaUrls || [],
        status: 'Scheduled'
      });
    } else {
      const client = scheduledPostRepository.getClient(token);
      const { data, error } = await client
        .from('posts')
        .insert({
          user_id: userId,
          title: title || 'Untitled Post',
          content,
          hashtags: '',
          mentions: '',
          link: url || '',
          media_urls: mediaUrls || [],
          status: 'Scheduled'
        })
        .select()
        .single();
      if (error) throw error;
      post = data;
    }

    const scheduledRecords: any[] = [];
    for (const accId of accountIds) {
      const account = await socialAccountRepository.queryById<any>(accId, token);
      if (!account) continue;

      const record = await scheduledPostRepository.insertRecord<any>({
        user_id: userId,
        post_id: post.id,
        provider: account.provider,
        social_account_id: account.id,
        scheduled_time: scheduledTime,
        timezone: timezone || 'UTC',
        status: 'Scheduled',
        retry_count: 0,
        published_at: null,
        error_message: null
      }, token);

      scheduledRecords.push(record);
      
      // Calculate delay in ms to schedule the background execution
      const delayMs = new Date(scheduledTime).getTime() - Date.now();
      socialPostQueue.add('publish-post', { scheduledPostId: record.id }, Math.max(0, delayMs));
    }

    return { post, scheduledRecords };
  }

  // Scheduler Run
  public async runScheduler(token?: string) {
    const now = new Date();
    const scheduledList = await scheduledPostRepository.getPending(now, token);
    const results: any[] = [];

    for (const sp of scheduledList) {
      let post: any = null;
      let account: any = null;

      if (socialAccountRepository.isMock) {
        post = dbClient.getById('posts', sp.post_id);
        account = dbClient.getById('social_accounts', sp.social_account_id);
      } else {
        const client = scheduledPostRepository.getClient(token);
        const postRes = await client.from('posts').select('*').eq('id', sp.post_id).maybeSingle();
        const accRes = await client.from('social_accounts').select('*').eq('id', sp.social_account_id).maybeSingle();
        post = postRes.data;
        account = accRes.data;
      }

      if (!post || !account) {
        await scheduledPostRepository.updateRecord(sp.id, {
          status: 'Failed',
          error_message: 'Post or connected social account details not found'
        }, token);
        continue;
      }

      await scheduledPostRepository.updateRecord(sp.id, { status: 'Publishing' }, token);

      try {
        const prov = getSocialProvider(sp.provider);
        const res = await prov.publish({ 
          title: post.title, 
          content: post.content, 
          url: post.link || post.url, 
          mediaUrls: post.media_urls || post.mediaUrls 
        }, account);

        if (res.success) {
          await scheduledPostRepository.updateRecord(sp.id, {
            status: 'Published',
            published_at: new Date().toISOString()
          }, token);
          results.push({ id: sp.id, success: true });

          // Update parent post status if all instances are complete
          if (socialAccountRepository.isMock) {
            const siblings = dbClient.getCollection('scheduled_posts').filter(item => item.post_id === post.id);
            if (siblings.every(s => s.status === 'Published' || s.id === sp.id)) {
              dbClient.update('posts', post.id, { status: 'Published' });
            }
          } else {
            const client = scheduledPostRepository.getClient(token);
            const siblingsRes = await client.from('scheduled_posts').select('status, id').eq('post_id', post.id);
            if (siblingsRes.data && siblingsRes.data.every((s: any) => s.status === 'Published' || s.id === sp.id)) {
              await client.from('posts').update({ status: 'Published' }).eq('id', post.id);
            }
          }
        } else {
          const errorMsg = res.error || 'Unknown publishing error';
          const retryCount = (sp.retry_count || 0) + 1;
          await scheduledPostRepository.updateRecord(sp.id, {
            status: retryCount >= 3 ? 'Failed' : 'Scheduled',
            retry_count: retryCount,
            error_message: errorMsg
          }, token);
          results.push({ id: sp.id, success: false, error: errorMsg });
        }
      } catch (err: any) {
        const retryCount = (sp.retry_count || 0) + 1;
        await scheduledPostRepository.updateRecord(sp.id, {
          status: retryCount >= 3 ? 'Failed' : 'Scheduled',
          retry_count: retryCount,
          error_message: err.message
        }, token);
        results.push({ id: sp.id, success: false, error: err.message });
      }
    }

    return results;
  }

  // Campaigns CRUD
  public async getCampaigns(userId: string, token?: string) {
    if (socialAccountRepository.isMock) {
      return dbClient.getCollection('campaigns').filter((c) => c.user_id === userId);
    }
    const { data, error } = await scheduledPostRepository.getClient(token)
      .from('campaigns')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  public async createOrUpdateCampaign(userId: string, body: any, token?: string) {
    const record = {
      user_id: userId,
      name: body.name || 'New Campaign',
      description: body.description || '',
      color: body.color || '#3B82F6',
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      end_date: body.end_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      budget: body.budget || 0,
      goal: body.goal || '',
      status: body.status || 'Active'
    };

    if (socialAccountRepository.isMock) {
      return body.id ? dbClient.update('campaigns', body.id, record) : dbClient.insert('campaigns', record);
    }

    const client = scheduledPostRepository.getClient(token);
    if (body.id) {
      const { data, error } = await client.from('campaigns').update(record).eq('id', body.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await client.from('campaigns').insert(record).select().single();
      if (error) throw error;
      return data;
    }
  }

  public async deleteCampaign(userId: string, id: string, token?: string) {
    if (socialAccountRepository.isMock) {
      return dbClient.delete('campaigns', id, false);
    }
    const { error } = await scheduledPostRepository.getClient(token)
      .from('campaigns')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  // Media library CRUD
  public async getMedia(userId: string, token?: string) {
    if (socialAccountRepository.isMock) {
      return dbClient.getCollection('media_library').filter((m) => m.user_id === userId);
    }
    const { data, error } = await scheduledPostRepository.getClient(token)
      .from('media_library')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  public async addMedia(userId: string, body: any, token?: string) {
    const record = {
      user_id: userId,
      type: body.type || 'image/jpeg',
      url: body.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      filename: body.filename || 'uploaded_file.jpg',
      size: body.size || 250000
    };

    if (socialAccountRepository.isMock) {
      return dbClient.insert('media_library', record);
    }

    const { data, error } = await scheduledPostRepository.getClient(token)
      .from('media_library')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  public async deleteMedia(userId: string, id: string, token?: string) {
    if (socialAccountRepository.isMock) {
      return dbClient.delete('media_library', id, false);
    }
    const { error } = await scheduledPostRepository.getClient(token)
      .from('media_library')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  // Get social analytics
  public async getAnalytics(userId: string, token?: string) {
    if (socialAccountRepository.isMock) {
      return dbClient.getCollection('social_analytics')
        .filter((log) => log.user_id === userId);
    }
    const { data, error } = await scheduledPostRepository.getClient(token)
      .from('social_analytics')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

export const socialService = new SocialService();
