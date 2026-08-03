import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstname?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastname?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message:
      'Username can contain only letters, numbers, underscores, and periods',
  })
  username?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value !== 'string') return value;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  })
  @IsString()
  @MaxLength(300)
  bio?: string | null;
}
