import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

import { FriendStatus } from '../../../database/entities/friends.entity';

export class manageFriendRequestDto {
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

  @IsEnum(FriendStatus)
  @IsNotEmpty()
  status: FriendStatus;
}
