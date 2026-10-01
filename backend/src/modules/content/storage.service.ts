import { BadRequestException, Inject, Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { AppConfig, InjectConfig } from '../../config';

export type StoredVideo = { objectKey: string; contentType: string; sizeBytes: number; checksumSha256: string };

@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly client?: S3Client;
  private readonly bucket?: string;
  constructor(@InjectConfig() config: AppConfig) {
    const storage = config.storage;
    if (!storage) return;
    this.bucket = storage.bucket;
    this.client = new S3Client({ region: storage.region, endpoint: storage.endpoint, forcePathStyle: !!storage.endpoint,
      credentials: storage.accessKeyId ? { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey! } : undefined,
      maxAttempts: 2, requestHandler: { requestTimeout: 5000, connectionTimeout: 2000 }, requestChecksumCalculation: 'WHEN_REQUIRED' });
  }
  onModuleDestroy() { this.client?.destroy(); }
  private configured() {
    if (!this.client || !this.bucket) throw new ServiceUnavailableException('Recording storage is not configured');
    return { client: this.client, bucket: this.bucket };
  }
  async upload(row: StoredVideo) {
    const { client, bucket } = this.configured();
    const headers = { 'Content-Type': row.contentType, 'x-amz-checksum-sha256': row.checksumSha256, 'If-None-Match': '*' };
    const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: row.objectKey,
      ContentType: row.contentType, ContentLength: row.sizeBytes, ChecksumSHA256: row.checksumSha256, IfNoneMatch: '*' }),
    { expiresIn: 300, signableHeaders: new Set(['content-type', 'content-length', 'if-none-match']), unhoistableHeaders: new Set(['x-amz-checksum-sha256']) })
      .catch(() => { throw new ServiceUnavailableException('Could not authorize recording storage'); });
    return { url, method: 'PUT', headers, sizeBytes: row.sizeBytes, expiresIn: 300 };
  }
  async verify(row: StoredVideo, versionId: string) {
    const { client, bucket } = this.configured();
    if (versionId === 'null') throw new BadRequestException('Bucket versioning must be enabled');
    try {
      const metadata = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: row.objectKey, VersionId: versionId, ChecksumMode: 'ENABLED' }));
      if (metadata.VersionId !== versionId || metadata.ContentLength !== row.sizeBytes || metadata.ContentType !== row.contentType || metadata.ChecksumSHA256 !== row.checksumSha256) {
        throw new BadRequestException('Uploaded object version, size, type or checksum does not match the recording');
      }
      const data = await client.send(new GetObjectCommand({ Bucket: bucket, Key: row.objectKey, VersionId: versionId, Range: 'bytes=0-31' }));
      if (!data.Body || data.$metadata.httpStatusCode !== 206 || data.ContentLength === undefined || data.ContentLength > 32) {
        (data.Body as Readable | undefined)?.destroy();
        throw new BadRequestException('Storage did not honor the bounded verification range');
      }
      const bytes = Buffer.from(await data.Body!.transformToByteArray());
      const valid = row.contentType === 'video/mp4' ? bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp'
        : bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
      if (!valid) throw new BadRequestException('File signature does not match MP4/WebM');
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) throw new BadRequestException('Upload the specified object version before completing');
      throw new ServiceUnavailableException('Could not verify recording storage');
    }
  }
  async playback(row: StoredVideo, versionId: string) {
    const { client, bucket } = this.configured();
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: row.objectKey, VersionId: versionId,
      ResponseContentType: row.contentType, ResponseContentDisposition: 'inline' }), { expiresIn: 120 })
      .catch(() => { throw new ServiceUnavailableException('Could not authorize recording storage'); });
    return { url, expiresIn: 120 };
  }
}
