import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { InjectModel } from '@nestjs/mongoose'
import { ConfigService } from '@nestjs/config'
import { Model, Types } from 'mongoose'
import { firstValueFrom } from 'rxjs'

import { Asset, AssetDocument } from '../assets/schemas/asset.schema'
import { User, UserDocument } from '../users/schemas/users.schema'

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name)
  private readonly aiServiceUrl: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(Asset.name) private readonly assetModel: Model<AssetDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000'
  }

  // ---------------------------------------------------------------------------
  // Indexing helpers (called from AssetsService lifecycle hooks)
  // ---------------------------------------------------------------------------

  /** Fire-and-forget: index an asset in the AI service after creation/update. */
  indexAsset(asset: AssetDocument): void {
    const payload = this._buildIndexPayload(asset)
    this.httpService.post(`${this.aiServiceUrl}/index-asset`, payload).subscribe({
      next: () => this.logger.log(`Indexed asset: ${asset._id}`),
      error: (err) => {
        const status = err?.response?.status ?? err?.status
        if (status === 503) {
          this.logger.debug(`Qdrant offline — skipped indexing asset ${asset._id}`)
        } else {
          this.logger.warn(`Failed to index asset ${asset._id}: ${err?.message}`)
        }
      },
    })
  }

  /** Fire-and-forget: remove an asset embedding when the asset is deleted. */
  deleteAssetIndex(assetId: string): void {
    this.httpService.delete(`${this.aiServiceUrl}/index/${assetId}`).subscribe({
      next: () => this.logger.log(`Removed index for asset: ${assetId}`),
      error: (err) => {
        const status = err?.response?.status ?? err?.status
        if (status !== 503 && status !== 404) {
          this.logger.warn(`Failed to remove index for ${assetId}: ${err?.message}`)
        }
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Recommendation APIs
  // ---------------------------------------------------------------------------

  /**
   * Return AI-powered similar assets for a given asset.
   * Falls back to same-category MongoDB query if the AI service is unavailable.
   */
  async getAssetRecommendations(
    assetId: string,
    limit = 10,
  ): Promise<AssetDocument[]> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/similar/${assetId}?limit=${limit}`,
        ),
      )

      const ids: string[] = (res.data?.similar ?? []).map((s: any) => s.asset_id)
      if (!ids.length) return this._fallbackAssetRecommendations(assetId, limit)

      const objectIds = ids.map((id) => new Types.ObjectId(id))
      const assets = await this.assetModel
        .find({ _id: { $in: objectIds }, status: 'published' })
        .populate(['categoryId', 'creatorId'])
        .exec()

      // Preserve the ranking order from Qdrant
      const map = new Map(assets.map((a) => [a._id.toString(), a]))
      return ids
        .map((id) => map.get(id))
        .filter(Boolean) as AssetDocument[]
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      const code = err?.code
      if (status !== 503 && status !== 404 && code !== 'ECONNREFUSED' && code !== 'ECONNRESET' && err?.message !== 'socket hang up') {
        this.logger.warn(`AI service error for asset ${assetId}: ${err?.message}`)
      }
      return this._fallbackAssetRecommendations(assetId, limit)
    }
  }

  /**
   * Return personalised recommendations for a user based on purchase history.
   * Falls back to trending published assets if the AI service is unavailable or
   * the user has no purchase history.
   */
  async getUserRecommendations(userId: string, limit = 10): Promise<AssetDocument[]> {
    try {
      const user = await this.userModel.findById(userId).exec()
      if (!user || !user.purchased_assets?.length) {
        return this._fallbackUserRecommendations(limit)
      }

      const purchasedIds = user.purchased_assets.map((id) => id.toString())

      const res = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/recommendations/user`, {
          asset_ids: purchasedIds,
          limit,
          exclude_ids: purchasedIds,
        }),
      )

      const ids: string[] = (res.data?.recommendations ?? []).map((r: any) => r.asset_id)
      if (!ids.length) return this._fallbackUserRecommendations(limit)

      const objectIds = ids.map((id) => new Types.ObjectId(id))
      const assets = await this.assetModel
        .find({ _id: { $in: objectIds }, status: 'published' })
        .populate(['categoryId', 'creatorId'])
        .exec()

      // Preserve ranking order from Qdrant
      const map = new Map(assets.map((a) => [a._id.toString(), a]))
      return ids
        .map((id) => map.get(id))
        .filter(Boolean) as AssetDocument[]
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      const code = err?.code
      if (status !== 503 && status !== 404 && code !== 'ECONNREFUSED' && code !== 'ECONNRESET' && err?.message !== 'socket hang up') {
        this.logger.warn(`AI service error for user ${userId}: ${err?.message}`)
      }
      return this._fallbackUserRecommendations(limit)
    }
  }

  /**
   * Admin: re-index all published assets in bulk.
   * Useful on first deploy or after model updates.
   */
  async reindexAll(): Promise<{ indexed: number; message: string }> {
    try {
      const assets = await this.assetModel
        .find({ status: 'published' })
        .populate('categoryId')
        .exec()

      if (!assets.length) {
        return { indexed: 0, message: 'No published assets found.' }
      }

      const batch = assets.map((a) => this._buildIndexPayload(a))

      const res = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/index-batch`, { assets: batch }),
      )

      return {
        indexed: res.data?.indexed ?? 0,
        message: `Successfully re-indexed ${res.data?.indexed ?? 0} assets.`,
      }
    } catch (err: any) {
      this.logger.error(`reindexAll failed: ${err?.message}`, err?.stack)
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _buildIndexPayload(asset: AssetDocument) {
    const category =
      typeof asset.categoryId === 'object' && asset.categoryId !== null
        ? (asset.categoryId as any).name ?? ''
        : ''

    // Map file formats + game engines → "style" concept for richer embedding
    const styleTokens: string[] = [
      ...((asset as any).fileFormat ?? []),
      ...((asset as any).gameEngineSupport ?? []),
    ]

    // Pick first available image (thumbnail preferred) for CLIP visual indexing
    const thumbnailUrl = (asset as any).thumbnailUrl ?? null
    const previewImages: string[] = (asset as any).previewImages ?? []
    const image_url = thumbnailUrl || previewImages[0] || null

    return {
      asset_id: asset._id.toString(),
      title: (asset as any).title ?? '',
      description: (asset as any).description ?? '',
      tags: (asset as any).tags ?? [],
      category,
      style: styleTokens.join(' '),
      status: (asset as any).status ?? 'published',
      image_url,
    }
  }

  private async _fallbackAssetRecommendations(
    assetId: string,
    limit: number,
  ): Promise<AssetDocument[]> {
    const asset = await this.assetModel.findById(assetId).exec()
    if (!asset) return []
    return this.assetModel
      .find({ _id: { $ne: asset._id }, categoryId: asset.categoryId, status: 'published' })
      .populate(['categoryId', 'creatorId'])
      .sort({ 'ratings.average': -1, 'stats.downloadCount': -1 })
      .limit(limit)
      .exec()
  }

  /**
   * Image search: send base64 image to AI service → BLIP caption → Qdrant search.
   */
  async imageSearch(
    imageBase64: string,
    limit = 10,
  ): Promise<{ caption: string; results: AssetDocument[] }> {
    if (!imageBase64?.trim()) return { caption: '', results: [] }
    try {
      const res = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/image-search`, {
          image_base64: imageBase64,
          limit,
        }),
      )
      const caption: string = res.data?.caption ?? ''
      const ids: string[] = (res.data?.results ?? []).map((r: any) => r.asset_id)
      if (!ids.length) return { caption, results: [] }

      const objectIds = ids.map((id) => new Types.ObjectId(id))
      const assets = await this.assetModel
        .find({ _id: { $in: objectIds }, status: 'published' })
        .populate(['categoryId', 'creatorId'])
        .exec()

      const map = new Map(assets.map((a) => [a._id.toString(), a]))
      const results = ids.map((id) => map.get(id)).filter(Boolean) as AssetDocument[]
      return { caption, results }
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      const code = err?.code
      if (status !== 503 && status !== 404 && code !== 'ECONNREFUSED' && code !== 'ECONNRESET' && err?.message !== 'socket hang up') {
        this.logger.warn(`Image search failed: ${err?.message}`)
      }
      return { caption: '', results: [] }
    }
  }

  /**
   * Semantic search using AI re-ranking — works WITHOUT Qdrant.
   *
   * Flow:
   *  1. Fetch up to 80 regex-matched candidates + 50 newest published from MongoDB.
   *  2. Deduplicate and send to AI service POST /search-rerank.
   *  3. AI batch-encodes query + all candidates via sentence-transformer (in-memory).
   *  4. Returns results sorted by cosine similarity.
   *  5. Falls back to plain text-match order if AI service is down.
   */
  async searchByQuery(query: string, limit = 10): Promise<AssetDocument[]> {
    if (!query?.trim()) return []

    const q = query.trim()
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

    // Step 1: gather candidates from MongoDB in parallel
    const [textMatches, recentAssets] = await Promise.all([
      this.assetModel
        .find({
          status: 'published',
          $or: [{ title: regex }, { description: regex }, { tags: regex }],
        })
        .populate(['categoryId', 'creatorId'])
        .limit(80)
        .exec(),
      this.assetModel
        .find({ status: 'published' })
        .populate(['categoryId', 'creatorId'])
        .sort({ createdAt: -1 })
        .limit(50)
        .exec(),
    ])

    // Merge & deduplicate (text matches first for priority)
    const seen = new Set<string>()
    const candidates: AssetDocument[] = []
    for (const a of [...textMatches, ...recentAssets]) {
      const id = a._id.toString()
      if (!seen.has(id)) {
        seen.add(id)
        candidates.push(a)
      }
    }
    if (!candidates.length) return []

    // Step 2: AI re-ranking via /search-rerank (no Qdrant needed)
    try {
      const assetItems = candidates.map((a) => ({
        asset_id: a._id.toString(),
        title: (a as any).title ?? '',
        description: ((a as any).description ?? '').slice(0, 300),
        tags: (a as any).tags ?? [],
        category:
          typeof a.categoryId === 'object' && a.categoryId !== null
            ? (a.categoryId as any).name ?? ''
            : '',
      }))

      const res = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/search-rerank`, {
          query: q,
          assets: assetItems,
          limit,
        }),
      )

      const ids: string[] = (res.data?.results ?? []).map((r: any) => r.asset_id)
      if (!ids.length) return candidates.slice(0, limit)

      const map = new Map(candidates.map((a) => [a._id.toString(), a]))
      return ids.map((id) => map.get(id)).filter(Boolean) as AssetDocument[]
    } catch {
      // AI service down — return text-matched candidates as-is
      return candidates.slice(0, limit)
    }
  }

  private _fallbackUserRecommendations(limit: number): Promise<AssetDocument[]> {
    return this.assetModel
      .find({ status: 'published' })
      .populate(['categoryId', 'creatorId'])
      .sort({ 'stats.viewCount': -1, createdAt: -1 })
      .limit(limit)
      .exec()
  }

  private _fallbackTextSearch(query: string, limit: number): Promise<AssetDocument[]> {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return this.assetModel
      .find({
        status: 'published',
        $or: [{ title: regex }, { description: regex }, { tags: regex }],
      })
      .populate(['categoryId', 'creatorId'])
      .limit(limit)
      .exec()
  }
}
