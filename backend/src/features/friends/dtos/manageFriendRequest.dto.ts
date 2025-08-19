import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { FriendStatus } from 'src/database/entities/friends.entity';

export class manageFriendRequestDto {
  @IsUUID()
  @IsNotEmpty()
  requestId: string; //request id

  @IsEnum(FriendStatus)
  @IsNotEmpty()
  status: FriendStatus;
}
