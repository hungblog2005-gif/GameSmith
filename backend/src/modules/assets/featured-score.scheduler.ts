import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FeaturedScoreService } from './featured-score.service';

/**
 * Runs the FeaturedScore job automatically every day at 03:00 AM (server time).
 * Requires @nestjs/schedule to be imported in AppModule.
 */
@Injectable()
export class FeaturedScoreScheduler {
  private readonly logger = new Logger(FeaturedScoreScheduler.name);

  constructor(private readonly featuredScoreService: FeaturedScoreService) {}

  /**
   * Daily at 03:00 — low-traffic window.
   * Cron syntax: ss mm hh day month weekday
   */
  @Cron('0 0 3 * * *', {
    name: 'featured-score-daily',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailyScoreJob(): Promise<void> {
    this.logger.log('Scheduled FeaturedScore job triggered');
    try {
      const result = await this.featuredScoreService.runScoreJob(10, 10);
      this.logger.log(`Job completed: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error('FeaturedScore job failed', (err as Error).stack);
    }
  }
}
