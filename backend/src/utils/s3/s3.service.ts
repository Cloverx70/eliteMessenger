import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

interface UploadedProfilePicture {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface SignedFileUrls {
  url: string;
  blurUrl?: string;
}
@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('AWS_BUCKET_NAME')!;

    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION'),

      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  /**
   * Upload File
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      const extension = file.originalname.split('.').pop();

      const key = `${folder}/${randomUUID()}.${extension}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return key;
    } catch (err) {
      console.error(err);

      throw new InternalServerErrorException('Could not upload file.');
    }
  }

  /**
   * Delete File
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err) {
      console.error(err);

      throw new InternalServerErrorException('Could not delete file.');
    }
  }

  /**
   * Get Signed URL
   */

  async getFileUrl(
    key: string,
    expiresIn = 3600,
    blurKey?: string | null,
  ): Promise<SignedFileUrls> {
    try {
      const createSignedUrl = async (objectKey: string): Promise<string> => {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        });

        return getSignedUrl(this.s3, command, {
          expiresIn,
        });
      };

      const [url, blurUrl] = await Promise.all([
        createSignedUrl(key),
        blurKey ? createSignedUrl(blurKey) : Promise.resolve(undefined),
      ]);

      return {
        url,
        ...(blurUrl ? { blurUrl } : {}),
      };
    } catch (error) {
      console.error('Failed to generate signed file URL:', error);

      throw new NotFoundException('Could not generate file URL.');
    }
  }

  async uploadProfilePicture(userId: string, file: UploadedProfilePicture) {
    const buffer = await sharp(file.buffer)
      .rotate()
      .resize(512, 512, {
        fit: 'cover',
        position: 'centre',
      })
      .webp({
        quality: 85,
      })
      .toBuffer();

    const key = `profile-pictures/${userId}/` + `${randomUUID()}.webp`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      key,
      url: await this.getFileUrl(key, 10000),
    };
  }
}
