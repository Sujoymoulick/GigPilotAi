import { settingsRepository, userRepository } from '../repositories';

export class SettingsService {
  public async getSettings(userId: string, token?: string) {
    const settings = await settingsRepository.getByUser(userId, token);
    return settings || {};
  }

  public async updateSettings(userId: string, body: any, token?: string) {
    let settings = await settingsRepository.getByUser(userId, token);
    if (settings) {
      settings = await settingsRepository.updateRecord(settings.id, body, token);
    } else {
      settings = await settingsRepository.insertRecord({
        user_id: userId,
        ...body
      }, token);
    }

    // Update user profile name if provided
    if (body.fullName) {
      await userRepository.updateRecord(userId, {
        full_name: body.fullName,
        fullName: body.fullName
      }, token);
    }

    return settings;
  }
}

export const settingsService = new SettingsService();
