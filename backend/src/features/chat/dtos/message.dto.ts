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

class MessageAttachmentDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsEnum(AttachmentType)
  type: AttachmentType;

  @IsOptional()
  size?: number;
}

export default class MessageDto {
  @IsUUID()
  crid: string;

  @IsUUID()
  sid: string;

  @IsUUID()
  rid: string;

  @IsString()
  text: string;

  @IsString()
  @IsNotEmpty()
  tempId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];
}
