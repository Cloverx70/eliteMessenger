import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { PostAttachmentType } from '../../../database/entities/postAttachment.entity';

export enum DiscoverFeedTab {
  FOR_YOU = 'FOR_YOU',
  FOLLOWING = 'FOLLOWING',
  TRENDING = 'TRENDING',
  EXPLORE = 'EXPLORE',
}

export class FeedQueryDto {
  @IsOptional()
  @IsEnum(DiscoverFeedTab)
  tab: DiscoverFeedTab = DiscoverFeedTab.FOR_YOU;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit: number = 15;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(PostAttachmentType)
  mediaType?: PostAttachmentType;
}
