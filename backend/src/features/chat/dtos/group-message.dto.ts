import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { AttachmentType } from '../../../database/entities/messageAttachment.entity';
import { Type } from 'class-transformer';

export class GroupMessageAttachmentDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsEnum(AttachmentType)
  type: AttachmentType;

  @IsOptional()
  size?: number;
}

export class GroupMessageDto {
  @IsUUID()
  gid: string;

  @IsUUID()
  sid: string;

  @IsString()
  text: string;

  @IsString()
  @IsNotEmpty()
  tempId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupMessageAttachmentDto)
  attachments?: GroupMessageAttachmentDto[];
}
