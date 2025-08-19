import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export default class MessageDto {
  @IsUUID()
  sid: string;

  @IsUUID()
  rid: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  attachments?: Express.Multer.File[];
}
