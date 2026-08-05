import { IsEnum, IsUUID } from 'class-validator';

import { PostShareTarget } from '../../../database/entities/postShare.entity';

export class SharePostDto {
  @IsEnum(PostShareTarget)
  targetType: PostShareTarget;

  @IsUUID()
  targetId: string;
}
