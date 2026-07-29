import { env } from '../config/env';

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  createdAt: number;
}

class InProcessQueue {
  private workers: ((job: Job) => Promise<void>)[] = [];
  
  constructor(public name: string) {}

  public async add(name: string, data: any, delayMs: number = 0): Promise<void> {
    const job: Job = {
      id: `job_${this.name}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      data,
      createdAt: Date.now(),
    };
    
    console.log(`[Queue ${this.name}] Added job: ${name} (ID: ${job.id})`);
    
    if (delayMs > 0) {
      const timer = setTimeout(() => this.triggerWorker(job), delayMs);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    } else {
      // Run asynchronously on the next event loop tick
      process.nextTick(() => this.triggerWorker(job));
    }
  }

  public process(worker: (job: Job) => Promise<void>): void {
    this.workers.push(worker);
  }

  private async triggerWorker(job: Job) {
    for (const worker of this.workers) {
      try {
        console.log(`[Queue ${this.name}] Processing job: ${job.name} (ID: ${job.id})`);
        await worker(job);
        console.log(`[Queue ${this.name}] Completed job: ${job.name} (ID: ${job.id})`);
      } catch (err: any) {
        console.error(`[Queue ${this.name}] Failed job: ${job.name} (ID: ${job.id}) - Error:`, err.message);
      }
    }
  }
}

// Queue registry
export const aiGenerationQueue = new InProcessQueue('AI Generation');
export const emailQueue = new InProcessQueue('Email');
export const socialPostQueue = new InProcessQueue('Scheduled Social Posts');
export const notificationsQueue = new InProcessQueue('Notifications');
export const cleanupQueue = new InProcessQueue('Cleanup');
export const analyticsQueue = new InProcessQueue('Analytics');

// Register worker handlers for core tasks
socialPostQueue.process(async (job) => {
  if (job.name === 'publish-post') {
    const { scheduledPostId } = job.data;
    console.log(`[Social Worker] Processing scheduled post execution: ${scheduledPostId}`);
    try {
      // Trigger API endpoint for processing scheduled posts
      const API_URL = `http://localhost:${env.PORT || 3000}`;
      const res = await fetch(`${API_URL}/api/social/scheduler/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json() as any;
      console.log('[Social Worker] Scheduler run result:', data);
    } catch (e: any) {
      console.error('[Social Worker] Failed to run scheduler:', e.message);
    }
  }
});

emailQueue.process(async (job) => {
  if (job.name === 'send-magic-link') {
    const { email, magicUrl } = job.data;
    console.log(`[Email Worker] Sending Magic Link to ${email}: ${magicUrl}`);
  }
});

aiGenerationQueue.process(async (job) => {
  console.log(`[AI Worker] Async tracking of AI usage for user: ${job.data.userId}`);
});

notificationsQueue.process(async (job) => {
  console.log(`[Notification Worker] Dispatching notifications: ${job.data.title}`);
});

cleanupQueue.process(async (job) => {
  console.log(`[Cleanup Worker] Running database cleanup for soft-deleted records.`);
});

analyticsQueue.process(async (job) => {
  console.log(`[Analytics Worker] Aggregating daily API logs...`);
});

// Run cleanup periodically (only in non-test mode)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    cleanupQueue.add('daily-cleanup', {});
  }, 24 * 60 * 60 * 1000); // Daily
}
