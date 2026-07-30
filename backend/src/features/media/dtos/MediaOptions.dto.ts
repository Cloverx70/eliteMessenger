import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { AttachmentType } from '../../../database/entities/messageAttachment.entity';

export class MediaOptionsDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsEnum(AttachmentType)
  @IsOptional()
  mediaType?: AttachmentType;

  @IsString()
  @IsOptional()
  senderId?: string;
}
