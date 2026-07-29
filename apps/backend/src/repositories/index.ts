import { BaseRepository } from './BaseRepository';
import { dbClient } from '@gigpilot/database';

// 1. UserRepository
export class UserRepository extends BaseRepository {
  constructor() {
    super('profiles', 'users');
  }

  public async getByEmail(email: string, token?: string): Promise<any | null> {
    if (this.isMock) {
      const list = dbClient.getCollection(this.localCollection);
      return list.find((u) => u.email === email) || null;
    }
    
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public async deductCredits(userId: string, count: number = 1, token?: string): Promise<number> {
    if (this.isMock) {
      return dbClient.deductCredits(userId, count);
    }
    
    // In PostgreSQL, deduct credits atomically
    const client = this.getClient(token);
    const { data: profile, error: getError } = await client
      .from(this.table)
      .select('credits_remaining')
      .eq('id', userId)
      .single();
      
    if (getError) throw getError;
    
    const newCredits = Math.max(0, (profile.credits_remaining || 0) - count);
    const { error: updateError } = await client
      .from(this.table)
      .update({ credits_remaining: newCredits })
      .eq('id', userId);
      
    if (updateError) throw updateError;
    return newCredits;
  }
}

// 2. ProjectRepository
export class ProjectRepository extends BaseRepository {
  constructor() {
    super('projects', 'projects');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((p) => p.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

// 3. GigRepository
export class GigRepository extends BaseRepository {
  constructor() {
    super('gigs', 'gigs');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((g) => g.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

// 4. AiHistoryRepository
export class AiHistoryRepository extends BaseRepository {
  constructor() {
    super('ai_history', 'generations');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((g) => g.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  public async clearAllUserHistory(userId: string, token?: string): Promise<boolean> {
    if (this.isMock) {
      const list = dbClient.getCollection(this.localCollection);
      for (const item of list) {
        if (item.user_id === userId) {
          dbClient.delete(this.localCollection, item.id, false);
        }
      }
      return true;
    }
    const { error } = await this.getClient(token)
      .from(this.table)
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }

  public async toggleFavorite(id: string, token?: string): Promise<boolean> {
    if (this.isMock) {
      const item = dbClient.getById(this.localCollection, id);
      if (item) {
        const newVal = !item.is_favorite;
        dbClient.update(this.localCollection, id, { is_favorite: newVal, isFavorite: newVal });
        return newVal;
      }
      return false;
    }
    
    const client = this.getClient(token);
    const { data: current, error: getErr } = await client
      .from(this.table)
      .select('is_favorite')
      .eq('id', id)
      .single();
    if (getErr) throw getErr;

    const newVal = !current.is_favorite;
    const { error: updErr } = await client
      .from(this.table)
      .update({ is_favorite: newVal })
      .eq('id', id);
    if (updErr) throw updErr;
    return newVal;
  }
}

// 5. SocialAccountRepository
export class SocialAccountRepository extends BaseRepository {
  constructor() {
    super('social_accounts', 'social_accounts');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((s) => s.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

// 6. ScheduledPostRepository
export class ScheduledPostRepository extends BaseRepository {
  constructor() {
    super('scheduled_posts', 'scheduled_posts');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((s) => s.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  public async getPending(now: Date, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection)
        .filter((sp) => sp.status === 'Scheduled' && new Date(sp.scheduled_time).getTime() <= now.getTime());
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('status', 'Scheduled')
      .lte('scheduled_time', now.toISOString());
    if (error) throw error;
    return data;
  }
}

// 7. NotificationRepository
export class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications', 'notifications');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((n) => n.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  public async getUnreadCount(userId: string, token?: string): Promise<number> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((n) => n.user_id === userId && !n.is_read).length;
    }
    const { count, error } = await this.getClient(token)
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count || 0;
  }

  public async markAllRead(userId: string, token?: string): Promise<boolean> {
    if (this.isMock) {
      const list = dbClient.getCollection(this.localCollection).filter((n) => n.user_id === userId && !n.is_read);
      for (const item of list) {
        dbClient.update(this.localCollection, item.id, { is_read: true, isRead: true });
      }
      return true;
    }
    const { error } = await this.getClient(token)
      .from(this.table)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return true;
  }
}

// 8. SubscriptionRepository
export class SubscriptionRepository extends BaseRepository {
  constructor() {
    super('subscriptions', 'subscriptions');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((s) => s.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

// 9. PaymentRepository
export class PaymentRepository extends BaseRepository {
  constructor() {
    super('payments', 'billing');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((p) => p.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

// 10. AnalyticsRepository
export class AnalyticsRepository extends BaseRepository {
  constructor() {
    super('analytics', 'analytics');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

// 11. SettingsRepository
export class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings', 'settings');
  }

  public async getByUser(userId: string, token?: string): Promise<any | null> {
    if (this.isMock) {
      const list = dbClient.getCollection(this.localCollection);
      return list.find((s) => s.user_id === userId) || null;
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}

// 12. ActivityLogRepository
export class ActivityLogRepository extends BaseRepository {
  constructor() {
    super('activity_logs', 'history');
  }

  public async getByUser(userId: string, token?: string): Promise<any[]> {
    if (this.isMock) {
      return dbClient.getCollection(this.localCollection).filter((h) => h.user_id === userId);
    }
    const { data, error } = await this.getClient(token)
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

// Instances
export const userRepository = new UserRepository();
export const projectRepository = new ProjectRepository();
export const gigRepository = new GigRepository();
export const aiHistoryRepository = new AiHistoryRepository();
export const socialAccountRepository = new SocialAccountRepository();
export const scheduledPostRepository = new ScheduledPostRepository();
export const notificationRepository = new NotificationRepository();
export const subscriptionRepository = new SubscriptionRepository();
export const paymentRepository = new PaymentRepository();
export const analyticsRepository = new AnalyticsRepository();
export const settingsRepository = new SettingsRepository();
export const activityLogRepository = new ActivityLogRepository();
