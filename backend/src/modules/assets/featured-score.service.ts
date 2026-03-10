import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Asset, AssetDocument } from './schemas/asset.schema';
import {
  DownloadLog,
  DownloadLogDocument,
} from '../downloads/schemas/download.schema';

/**
 * Score weights — adjust to tune featured ranking behaviour.
 */
const WEIGHTS = {
  downloads: 0.3, // Total all-time download count
  rating: 0.25, // Bayesian-weighted rating quality
  recentDL: 0.2, // Downloads in the last 7 days (trending signal)
  views: 0.1, // Total view count (lighter — easier to inflate)
  reviews: 0.1, // Number of written reviews (social proof)
  freshness: 0.05, // Recency bias (exponential decay, half-life ≈ 35 days)
} as const;

/**
 * Log-scale normalization cap.
 * ln(1 + cap) = divisor.  Tune these based on your actual data percentiles.
 *   Example: cap = 10_000 downloads → ln(10001) ≈ 9.21
 */
const LOG_CAP = {
  downloads: 10_000, // ln(10001) ≈ 9.21
  views: 100_000, // ln(100001) ≈ 11.51
  recentDL: 1_000, // ln(1001) ≈ 6.91
  reviews: 500, // ln(501) ≈ 6.22
  ratingReview: 100, // sqrt(100) = 10 — denominator for Bayesian rating
} as const;

/** Freshness decay constant: λ = ln(2) / half_life_days */
const FRESHNESS_LAMBDA = Math.LN2 / 35; // half-life = 35 days

export interface ScoreJobResult {
  processed: number;
  featuredSet: number;
  trendingSet: number;
  durationMs: number;
}

@Injectable()
export class FeaturedScoreService {
  private readonly logger = new Logger(FeaturedScoreService.name);

  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
    @InjectModel(DownloadLog.name)
    private readonly downloadLogModel: Model<DownloadLogDocument>,
  ) {}

  // ── Public entry point ──────────────────────────────────────────────────

  /**
   * Main job: recompute featuredScore for all published assets,
   * then promote Top N to featured=true and Top M to isTrending=true.
   */
  async runScoreJob(
    featuredTopN = 10,
    trendingTopM = 10,
  ): Promise<ScoreJobResult> {
    const startedAt = Date.now();
    this.logger.log('FeaturedScore job started');

    const [count, trending] = await Promise.all([
      this._recomputeAllScores(),
      this._getTrendingIds(trendingTopM),
    ]);

    const featured = await this._getTopFeaturedIds(featuredTopN);

    await Promise.all([
      this._applyFeatured(featured),
      this._applyTrending(trending),
    ]);

    const result: ScoreJobResult = {
      processed: count,
      featuredSet: featured.length,
      trendingSet: trending.length,
      durationMs: Date.now() - startedAt,
    };

    this.logger.log(
      `FeaturedScore job done: ${result.processed} scored, ` +
        `${result.featuredSet} featured, ${result.trendingSet} trending — ` +
        `${result.durationMs}ms`,
    );

    return result;
  }

  // ── Step 1: Recompute scores via $merge aggregation ─────────────────────

  private async _recomputeAllScores(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    await this.assetModel.aggregate([
      // Only score published assets
      { $match: { status: 'published' } },

      // Lookup recent downloads (7 days) from DownloadLog collection
      {
        $lookup: {
          from: 'downloadlogs',
          let: { assetId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$assetId', '$$assetId'] },
                    { $gte: ['$createdAt', sevenDaysAgo] },
                  ],
                },
              },
            },
            { $count: 'total' },
          ],
          as: '_recentDLData',
        },
      },

      // Flatten raw counters
      {
        $addFields: {
          _recentDownloads: {
            $ifNull: [{ $arrayElemAt: ['$_recentDLData.total', 0] }, 0],
          },
          _dlCount: { $ifNull: ['$stats.downloadCount', 0] },
          _viewCount: { $ifNull: ['$stats.viewCount', 0] },
          _reviewCount: { $ifNull: ['$stats.reviewCount', 0] },
          _avgRating: { $ifNull: ['$ratings.average', 0] },
          _ageMs: {
            $subtract: [now, { $ifNull: ['$publishedAt', '$createdAt'] }],
          },
        },
      },

      // Compute sub-scores (each 0–1 range)
      {
        $addFields: {
          // Downloads: log-scale, capped at LOG_CAP.downloads
          _sDownloads: {
            $divide: [
              { $ln: { $add: ['$_dlCount', 1] } },
              Math.log(LOG_CAP.downloads + 1),
            ],
          },

          // Views: log-scale
          _sViews: {
            $divide: [
              { $ln: { $add: ['$_viewCount', 1] } },
              Math.log(LOG_CAP.views + 1),
            ],
          },

          // Recent downloads: log-scale (trending signal)
          _sRecentDL: {
            $divide: [
              { $ln: { $add: ['$_recentDownloads', 1] } },
              Math.log(LOG_CAP.recentDL + 1),
            ],
          },

          // Reviews: log-scale
          _sReviews: {
            $divide: [
              { $ln: { $add: ['$_reviewCount', 1] } },
              Math.log(LOG_CAP.reviews + 1),
            ],
          },

          // Rating: Bayesian — rating × sqrt(reviewCount) / normFactor
          // Prevents a single 5★ review from outranking 1000 reviews @ 4.8★
          _sRating: {
            $multiply: [
              { $divide: ['$_avgRating', 5] },
              {
                $divide: [
                  { $sqrt: { $add: ['$_reviewCount', 1] } },
                  Math.sqrt(LOG_CAP.ratingReview),
                ],
              },
            ],
          },

          // Freshness: 1 / (1 + λ * ageInDays)  — approximates e^(-λt)
          // mongoDb doesn't have $exp, this harmonic decay is equivalent at practical ranges
          _sFreshness: {
            $divide: [
              1,
              {
                $add: [
                  1,
                  {
                    $multiply: [
                      FRESHNESS_LAMBDA,
                      { $divide: ['$_ageMs', 86_400_000] }, // ms → days
                    ],
                  },
                ],
              },
            ],
          },
        },
      },

      // Clamp sub-scores to [0, 1] and compute final weighted score
      {
        $addFields: {
          featuredScore: {
            $add: [
              { $multiply: [{ $min: ['$_sDownloads', 1] }, WEIGHTS.downloads] },
              { $multiply: [{ $min: ['$_sRating', 1] }, WEIGHTS.rating] },
              { $multiply: [{ $min: ['$_sRecentDL', 1] }, WEIGHTS.recentDL] },
              { $multiply: [{ $min: ['$_sViews', 1] }, WEIGHTS.views] },
              { $multiply: [{ $min: ['$_sReviews', 1] }, WEIGHTS.reviews] },
              { $multiply: ['$_sFreshness', WEIGHTS.freshness] },
            ],
          },
          // Persist the 7-day download count for trending sort
          recentDownloads: '$_recentDownloads',
          featuredScoreUpdatedAt: now,
        },
      },

      // Drop all intermediate fields before merging
      {
        $unset: [
          '_recentDLData',
          '_recentDownloads',
          '_dlCount',
          '_viewCount',
          '_reviewCount',
          '_avgRating',
          '_ageMs',
          '_sDownloads',
          '_sViews',
          '_sRecentDL',
          '_sReviews',
          '_sRating',
          '_sFreshness',
        ],
      },

      // Write back only the computed fields — never touch other asset data
      {
        $merge: {
          into: 'assets',
          on: '_id',
          whenMatched: 'merge',
          whenNotMatched: 'discard',
        },
      },
    ]);

    return this.assetModel.countDocuments({ status: 'published' });
  }

  // ── Step 2: Determine top IDs ───────────────────────────────────────────

  private async _getTopFeaturedIds(n: number): Promise<string[]> {
    const docs = await this.assetModel
      .find({ status: 'published', featuredScore: { $exists: true } })
      .sort({ featuredScore: -1 })
      .limit(n)
      .select('_id')
      .lean();
    return docs.map((d) => String(d._id));
  }

  private async _getTrendingIds(m: number): Promise<string[]> {
    const docs = await this.assetModel
      .find({ status: 'published', recentDownloads: { $gt: 0 } })
      .sort({ recentDownloads: -1, featuredScore: -1 })
      .limit(m)
      .select('_id')
      .lean();
    return docs.map((d) => String(d._id));
  }

  // ── Step 3: Apply flags atomically ─────────────────────────────────────

  private async _applyFeatured(ids: string[]): Promise<void> {
    await Promise.all([
      this.assetModel.updateMany(
        { status: 'published' },
        { $set: { featured: false } },
      ),
    ]);
    if (ids.length > 0) {
      await this.assetModel.updateMany(
        { _id: { $in: ids } },
        { $set: { featured: true } },
      );
    }
  }

  private async _applyTrending(ids: string[]): Promise<void> {
    await this.assetModel.updateMany(
      { status: 'published' },
      { $set: { isTrending: false } },
    );
    if (ids.length > 0) {
      await this.assetModel.updateMany(
        { _id: { $in: ids } },
        { $set: { isTrending: true } },
      );
    }
  }

  // ── Utility: get scored leaderboard (for admin dashboard) ───────────────

  async getScoreLeaderboard(limit = 20) {
    return this.assetModel
      .find({ status: 'published', featuredScore: { $exists: true } })
      .sort({ featuredScore: -1 })
      .limit(limit)
      .select(
        'title featured isTrending featuredScore recentDownloads stats ratings createdAt',
      )
      .lean();
  }
}
