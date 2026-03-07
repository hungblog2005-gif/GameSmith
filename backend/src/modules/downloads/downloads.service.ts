import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Asset, AssetDocument } from '../assets/schemas/asset.schema';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { DownloadLog, DownloadLogDocument } from './schemas/download.schema';

@Injectable()
export class DownloadsService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
    @InjectModel(DownloadLog.name)
    private readonly downloadLogModel: Model<DownloadLogDocument>,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Verify purchase and return download URLs for all files of the asset.
   */
  async requestDownload(userId: string, assetId: string) {
    // 1. Find asset (explicitly select assetFiles + legacy fileKey)
    const asset = await this.assetModel
      .findOne({ _id: assetId, status: 'published' })
      .select('+assetFiles +fileKey')
      .lean()
      .exec();

    if (!asset) {
      throw new NotFoundException('Asset not found or not available');
    }

    // 2. Purchase check — skip for free/zero-price assets
    const isPurchaseRequired = !asset.isFree && asset.price > 0;
    if (isPurchaseRequired) {
      const purchased = await this.usersService.hasPurchased(userId, assetId);
      if (!purchased) {
        throw new ForbiddenException(
          'You have not purchased this asset. Please complete your purchase first.',
        );
      }
    }

    // 3. Collect file list — prefer assetFiles array, fallback to legacy fileKey
    const assetFiles: Array<{ fileKey: string; filename: string; format: string; fileSize?: string | null }> =
      (asset as any).assetFiles?.length
        ? (asset as any).assetFiles
        : asset.fileKey
          ? [{ fileKey: asset.fileKey, filename: asset.title, format: asset.fileFormat?.[0] ?? 'zip' }]
          : [];

    if (assetFiles.length === 0) {
      throw new BadRequestException(
        'Download file is not yet available for this asset. Please check back later.',
      );
    }

    // 4. Generate download URL for each file
    const isCloud = this.storageService.isConfigured();

    const files = await Promise.all(
      assetFiles.map(async (f) => {
        // Cloud: signed URL (absolute). Local: relative path — frontend proxy handles routing
        const downloadUrl = isCloud
          ? await this.storageService.generateSignedUrl(f.fileKey, 300)
          : `/uploads/assets/${f.fileKey}`;
        return {
          filename: f.filename,
          format:   f.format,
          fileSize: f.fileSize ?? null,
          downloadUrl,
        };
      }),
    );

    // 5. Persist download log + increment counter — fire-and-forget
    const source: 'cloud' | 'local' = isCloud ? 'cloud' : 'local';
    this.downloadLogModel
      .create({
        userId:     new Types.ObjectId(userId),
        assetId:    new Types.ObjectId(assetId),
        assetTitle: asset.title,
        version:    asset.version ?? '1.0.0',
        fileKey:    assetFiles[0]?.fileKey ?? null,
        source,
      })
      .catch(() => {});

    this.assetModel
      .updateOne({ _id: assetId }, { $inc: { 'stats.downloadCount': 1 } })
      .exec()
      .catch(() => {});

    return {
      files,
      version:    asset.version ?? '1.0.0',
      assetTitle: asset.title,
      expiresIn:  300,
    };
  }

  /**
   * Return paginated download history for a user (newest first).
   */
  async getMyHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { userId: new Types.ObjectId(userId) };

    const [downloads, total] = await Promise.all([
      this.downloadLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assetId', 'title slug thumbnailUrl previewImages price isFree')
        .lean()
        .exec(),
      this.downloadLogModel.countDocuments(query).exec(),
    ]);

    return {
      downloads,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
