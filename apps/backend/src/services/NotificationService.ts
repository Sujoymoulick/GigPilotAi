import { notificationRepository } from '../repositories';

export class NotificationService {
  public async getNotifications(userId: string, token?: string) {
    return notificationRepository.getByUser(userId, token);
  }

  public async getUnreadCount(userId: string, token?: string) {
    return notificationRepository.getUnreadCount(userId, token);
  }

  public async markAllAsRead(userId: string, token?: string) {
    return notificationRepository.markAllRead(userId, token);
  }

  public async createNotification(userId: string, title: string, message: string, type: string = 'info', token?: string) {
    return notificationRepository.insertRecord({
      user_id: userId,
      title,
      message,
      type,
      is_read: false
    }, token);
  }

  public async deleteNotification(id: string, token?: string) {
    return notificationRepository.deleteRecord(id, token, false); // hard delete
  }
}

export const notificationService = new NotificationService();
