import { IsEnum, IsNotEmpty } from 'class-validator';

export class updateMessageStatusDto {
  @IsEnum(['pending', 'sent', 'delivered', 'seen'])
  @IsNotEmpty()
  status: 'pending' | 'sent' | 'delivered' | 'seen';
}
