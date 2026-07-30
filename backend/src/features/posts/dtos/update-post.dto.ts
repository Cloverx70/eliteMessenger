import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { PostVisibility } from '../../../database/entities/post.entity';

export class UpdatePostDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const caption = value.trim();
    return caption.length > 0 ? caption : null;
  })
  @IsString()
  @MaxLength(2200)
  caption?: string | null;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  commentsEnabled?: boolean;
}
