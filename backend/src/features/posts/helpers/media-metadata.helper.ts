import { extname, join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';

import { BadRequestException } from '@nestjs/common';
import { execFile } from 'node:child_process';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import sharp from 'sharp';
import { tmpdir } from 'node:os';

export interface ImageMediaMetadata {
  width: number | null;
  height: number | null;
  blurDataURL: string | null;
}

export interface VideoMediaMetadata {
  width: number | null;
  height: number | null;
  duration: number | null;
}
export interface ImageMediaMetadata {
  width: number | null;
  height: number | null;
  blurDataURL: string | null;
}

export interface ImageMediaMetadata {
  width: number | null;
  height: number | null;
  blurDataURL: string | null;
}

export async function getImageMetadata(
  file: Express.Multer.File,
): Promise<ImageMediaMetadata> {
  try {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new Error('Uploaded image buffer is missing or empty');
    }

    const metadata = await sharp(file.buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }

    const blurBuffer = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 24,
        withoutEnlargement: true,
      })
      .flatten({
        background: {
          r: 255,
          g: 255,
          b: 255,
        },
      })
      .jpeg({
        quality: 40,
      })
      .toBuffer();

    return {
      width: metadata.width,
      height: metadata.height,
      blurDataURL: `data:image/jpeg;base64,${blurBuffer.toString('base64')}`,
    };
  } catch (error: unknown) {
    console.error('Sharp image-processing error:', {
      filename: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      bufferLength: file?.buffer?.length,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    const reason =
      error instanceof Error ? error.message : 'Unknown image-processing error';

    throw new BadRequestException(
      `Invalid or unsupported image "${file?.originalname ?? 'unknown'}": ${reason}`,
    );
  }
}

export async function getVideoMetadata(
  file: Express.Multer.File,
): Promise<VideoMediaMetadata> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'elite-post-video-'));
  const extension = extname(file.originalname) || '.mp4';
  const temporaryFile = join(temporaryDirectory, `upload${extension}`);

  try {
    await writeFile(temporaryFile, file.buffer);

    const output = await new Promise<string>((resolve, reject) => {
      execFile(
        ffprobeInstaller.path,
        [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=width,height:format=duration',
          '-of',
          'json',
          temporaryFile,
        ],
        { windowsHide: true, maxBuffer: 2 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }

          resolve(stdout);
        },
      );
    });

    const parsed = JSON.parse(output) as {
      streams?: Array<{ width?: number; height?: number }>;
      format?: { duration?: string };
    };

    const stream = parsed.streams?.[0];
    const rawDuration = Number.parseFloat(parsed.format?.duration ?? '');

    return {
      width: stream?.width ?? null,
      height: stream?.height ?? null,
      duration:
        Number.isFinite(rawDuration) && rawDuration > 0
          ? Math.round(rawDuration)
          : null,
    };
  } catch {
    throw new BadRequestException(
      `Invalid or unsupported video: ${file.originalname}`,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
