import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  NotificationCategory,
  NotificationType,
} from '../../../database/entities/notification.entity';

export enum NotificationEntityType {
  USER = 'USER',

  FRIEND_REQUEST = 'FRIEND_REQUEST',

  CHATROOM = 'CHATROOM',
  MESSAGE = 'MESSAGE',

  GROUP = 'GROUP',
  GROUP_MESSAGE = 'GROUP_MESSAGE',

  POST = 'POST',
  COMMENT = 'COMMENT',

  SECURITY_EVENT = 'SECURITY_EVENT',
  SYSTEM = 'SYSTEM',
}

export class CreateNotificationDto {
  @IsUUID()
  recipientId: string;

  @IsOptional()
  @IsUUID()
  actorId?: string | null;

  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(NotificationEntityType)
  entityType?: NotificationEntityType | null;

  @IsOptional()
  @IsUUID()
  entityId?: string | null;

  @IsOptional()
  @IsUUID()
  secondaryEntityId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  aggregationKey?: string | null;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown> | null;
}
