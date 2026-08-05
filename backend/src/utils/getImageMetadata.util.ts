import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export async function getImageMetadata(file: Express.Multer.File): Promise<{
  width: number | null;
  height: number | null;
  blurDataURL: string | null;
}> {
  if (!file.mimetype.startsWith('image/')) {
    return {
      width: null,
      height: null,
      blurDataURL: null,
    };
  }

  if (!file.buffer) {
    throw new BadRequestException(
      `No file buffer was found for ${file.originalname}`,
    );
  }

  try {
    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    const tinyImage = await sharp(file.buffer)
      .resize({
        width: 20,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 40,
      })
      .toBuffer();

    return {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      blurDataURL: `data:image/jpeg;base64,${tinyImage.toString('base64')}`,
    };
  } catch {
    throw new BadRequestException(
      `Could not process image ${file.originalname}`,
    );
  }
}
