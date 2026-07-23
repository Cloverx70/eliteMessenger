import { IsNotEmpty, IsString } from 'class-validator';

export class updateMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
