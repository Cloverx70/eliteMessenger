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
  /**
   * The user who receives the notification.
   */
  @IsUUID()
  recipientId: string;

  /**
   * The user who caused the notification.
   *
   * Null for system notifications.
   */
  @IsOptional()
  @IsUUID()
  actorId?: string | null;

  /**
   * Used by the frontend to filter notifications.
   */
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  /**
   * Determines the notification behavior and displayed text.
   */
  @IsEnum(NotificationType)
  type: NotificationType;

  /**
   * The type of resource connected to the notification.
   *
   * Examples:
   * POST
   * CHATROOM
   * GROUP
   * FRIEND_REQUEST
   */
  @IsOptional()
  @IsEnum(NotificationEntityType)
  entityType?: NotificationEntityType | null;

  /**
   * The main resource ID.
   *
   * Examples:
   * postId
   * chatroomId
   * groupId
   * friendRequestId
   */
  @IsOptional()
  @IsUUID()
  entityId?: string | null;

  /**
   * A second resource ID when required.
   *
   * Examples:
   * commentId
   * messageId
   * groupMessageId
   */
  @IsOptional()
  @IsUUID()
  secondaryEntityId?: string | null;

  /**
   * Used for grouping similar notifications.
   *
   * Examples:
   * POST_LIKED:postId
   * DIRECT_MESSAGE:chatroomId
   * GROUP_MESSAGE:groupId
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  aggregationKey?: string | null;

  /**
   * Small extra values needed to render the notification.
   *
   * Do not store entire User, Post, or Message entities here.
   */
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown> | null;
}
