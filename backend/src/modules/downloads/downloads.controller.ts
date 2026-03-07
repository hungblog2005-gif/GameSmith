import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { DownloadsService } from './downloads.service';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  /**
   * GET /assets/my-history
   *
   * Returns the authenticated user's download history, newest first.
   * Declared BEFORE :id/download to avoid route shadowing.
   */
  @Get('my-history')
  getMyHistory(
    @Req() req: Request & { user: { sub: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.downloadsService.getMyHistory(req.user.sub, page, limit);
  }

  /**
   * GET /assets/:id/download
   *
   * Returns a short-lived signed URL (5 min) to download the asset file.
   * Requires a valid JWT. Returns 403 if the user has not purchased the asset.
   * Rate-limited to 5 requests per minute per user.
   */
  @Get(':id/download')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  download(
    @Param('id') assetId: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.downloadsService.requestDownload(req.user.sub, assetId);
  }
}
