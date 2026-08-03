import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

export enum NotificationCategory {
  SOCIAL = 'SOCIAL',
  POST = 'POST',
  CHAT = 'CHAT',
  SYSTEM = 'SYSTEM',
}

export enum NotificationType {
  FRIEND_REQUEST_RECEIVED = 'FRIEND_REQUEST_RECEIVED',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',

  POST_LIKED = 'POST_LIKED',
  POST_COMMENTED = 'POST_COMMENTED',
  POST_SHARED = 'POST_SHARED',

  GROUP_ADDED = 'GROUP_ADDED',
  GROUP_REMOVED = 'GROUP_REMOVED',
  GROUP_MENTION = 'GROUP_MENTION',
  GROUP_ROLE_UPDATED = 'GROUP_ROLE_UPDATED',

  ACCOUNT_SECURITY = 'ACCOUNT_SECURITY',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

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

export interface NotificationData {
  preview?: string | null;

  mutualFriendCount?: number;

  groupName?: string | null;
  previousRole?: string | null;
  newRole?: string | null;

  securityEventType?: string | null;
  device?: string | null;
  browser?: string | null;
  location?: string | null;

  title?: string | null;
  message?: string | null;
}

@Entity('notifications')
@Index(['recipientId', 'isRead', 'updatedAt'])
@Index(['recipientId', 'updatedAt'])
@Index(['aggregationKey'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  recipientId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'recipientId',
  })
  recipient: User;

  @Column('uuid', {
    nullable: true,
  })
  actorId: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'actorId',
  })
  actor: User | null;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationEntityType,
    nullable: true,
  })
  entityType: NotificationEntityType | null;

  @Column('uuid', {
    nullable: true,
  })
  entityId: string | null;

  @Column('uuid', {
    nullable: true,
  })
  secondaryEntityId: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  aggregationKey: string | null;

  @Column({
    type: 'int',
    default: 1,
  })
  aggregationCount: number;

  @Column({
    type: 'json',
    nullable: true,
  })
  data: NotificationData | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  isRead: boolean;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
