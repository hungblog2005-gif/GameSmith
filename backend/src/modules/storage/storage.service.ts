import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3: S3Client | null = null;
  private readonly bucket: string | null = null;
  private readonly _isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('AZDIGI_ENDPOINT');
    const accessKeyId = config.get<string>('AZDIGI_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AZDIGI_SECRET_ACCESS_KEY');
    const bucket = config.get<string>('AZDIGI_BUCKET_NAME');

    if (endpoint && accessKeyId && secretAccessKey && bucket) {
      this.s3 = new S3Client({
        endpoint,
        region: config.get<string>('AZDIGI_REGION', 'hn1'),
        credentials: { accessKeyId, secretAccessKey },
        // Required for non-AWS S3-compatible providers (path-style vs virtual-hosted)
        forcePathStyle: true,
      });
      this.bucket = bucket;
      this._isConfigured = true;
    } else {
      this._isConfigured = false;
    }
  }

  /** Returns true when AZDIGI cloud storage is fully configured. */
  isConfigured(): boolean {
    return this._isConfigured;
  }

  /**
   * Generate a short-lived signed URL for downloading a private object.
   * @param fileKey  Object key in storage (e.g. "assets/abc123/v1.0.0/pack.zip")
   * @param expiresIn TTL in seconds (default 300 = 5 minutes)
   */
  async generateSignedUrl(fileKey: string, expiresIn = 300): Promise<string> {
    if (!this._isConfigured || !this.s3 || !this.bucket) {
      throw new Error(
        'Cloud storage is not configured. Set AZDIGI_ENDPOINT, AZDIGI_ACCESS_KEY_ID, AZDIGI_SECRET_ACCESS_KEY, and AZDIGI_BUCKET_NAME env vars.',
      );
    }
    const filename = decodeURIComponent(fileKey.split('/').pop() ?? 'download');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      // Forces browser to download rather than display in-browser
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Upload a Buffer to object storage (used when creators publish assets).
   */
  async uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
    if (!this._isConfigured || !this.s3 || !this.bucket) {
      throw new Error('Cloud storage is not configured.');
    }
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Objects are private by default; access only via signed URLs
      }),
    );
  }

  /**
   * Delete an object from storage (used when an asset version is removed).
   */
  async deleteObject(key: string): Promise<void> {
    if (!this._isConfigured || !this.s3 || !this.bucket) {
      throw new Error('Cloud storage is not configured.');
    }
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
