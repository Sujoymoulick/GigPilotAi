import { analyticsRepository, userRepository } from '../repositories';

export class AnalyticsService {
  // Aggregate dashboard stats for the frontend charts
  public async getDashboardData(userId: string, token?: string) {
    const logs = await analyticsRepository.getByUser(userId, token);
    const profile = await userRepository.queryById<any>(userId, token);

    let totalCreditsUsed = 0;
    let totalWordsGenerated = 0;
    let totalTimeSavedMinutes = 0;
    const toolCounts: Record<string, number> = {};

    logs.forEach((log: any) => {
      totalCreditsUsed += log.credits_used || log.creditsUsed || 0;
      totalWordsGenerated += log.words_generated || log.wordsGenerated || 0;
      totalTimeSavedMinutes += log.time_saved_minutes || log.timeSavedMinutes || 0;
      
      const usageList = log.tool_usage || log.toolUsage;
      if (usageList) {
        usageList.forEach((usage: any) => {
          toolCounts[usage.tool] = (toolCounts[usage.tool] || 0) + (usage.count || 0);
        });
      }
    });

    let favoriteTool = 'Proposal Generator';
    let maxCount = 0;
    Object.entries(toolCounts).forEach(([tool, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteTool = tool;
      }
    });

    return {
      creditsRemaining: profile ? profile.credits_remaining : 450,
      totalCreditsUsed,
      totalWordsGenerated,
      totalTimeSavedMinutes,
      favoriteTool,
      timeSavedHours: Math.round(totalTimeSavedMinutes / 60),
      growthPercentage: 24,
      dailyUsage: logs.slice(-7), // Last 7 days
      monthlyUsage: logs, // Last 30 days
      toolUsage: Object.entries(toolCounts).map(([tool, count]) => ({ tool, count }))
    };
  }
}

export const analyticsService = new AnalyticsService();
