import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
