/* eslint-disable prettier/prettier */
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload/:folder')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 5MB per file
      },

      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',

          'video/mp4',
          'video/webm',
          'video/quicktime',

          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type ${file.mimetype} is not allowed`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('folder') folder: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const key = await this.s3Service.uploadFile(file, folder);

        return {
          key,
          type: this.getFileType(file.mimetype),
          size: file.size,
        };
      }),
    );

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    };
  }

  @Get('url/:key')
  async getFileUrl(@Param('key') key: string) {
    const url = await this.s3Service.getFileUrl(key);

    return {
      url,
    };
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string) {
    await this.s3Service.deleteFile(key);

    return {
      message: 'File deleted successfully',
    };
  }

  private getFileType(
    mimetype: string,
  ): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'FILE' {
    if (mimetype.startsWith('image')) {
      return 'IMAGE';
    }

    if (mimetype.startsWith('video')) {
      return 'VIDEO';
    }

    if (
      mimetype === 'application/pdf' ||
      mimetype.includes('document') ||
      mimetype.includes('text')
    ) {
      return 'DOCUMENT';
    }

    return 'FILE';
  }
}
