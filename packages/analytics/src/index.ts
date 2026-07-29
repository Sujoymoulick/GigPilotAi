export interface AnalyticsEvent {
  userId: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];

  public track(userId: string, eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      userId,
      eventName,
      properties,
      timestamp: new Date().toISOString()
    };
    this.events.push(event);
    console.log(`[Analytics] Tracked ${eventName} for user ${userId}`, properties);
  }

  public calculateTimeSaved(generationsCount: number): number {
    // Average 45 minutes saved per AI gig/proposal generation
    return generationsCount * 0.75; // in hours
  }
}

export const analytics = new AnalyticsTracker();
