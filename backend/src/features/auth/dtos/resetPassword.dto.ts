import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'passwords should at least be 8 characters long' })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'passwords should at least be 8 characters long' })
  confirmNewPassword: string;

  @IsNotEmpty()
  @IsString()
  token: string;
}
