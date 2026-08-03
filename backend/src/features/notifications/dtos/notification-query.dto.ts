import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum NotificationFilter {
  ALL = 'ALL',
  UNREAD = 'UNREAD',
  MENTIONS = 'MENTIONS',
  SOCIAL = 'SOCIAL',
  GROUPS = 'GROUPS',
  POSTS = 'POSTS',
  SYSTEM = 'SYSTEM',
}

export class NotificationQueryDto {
  @IsOptional()
  @IsEnum(NotificationFilter)
  filter: NotificationFilter = NotificationFilter.ALL;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
  })
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
  })
  @IsString()
  @MaxLength(500)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
