import { IsNotEmpty, IsUUID } from 'class-validator';

export class ChatRoomDto {
  @IsNotEmpty()
  @IsUUID()
  uid1: string;

  @IsNotEmpty()
  @IsUUID()
  uid2: string;
}
