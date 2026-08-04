import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';

import { Friends, FriendStatus } from '../../database/entities/friends.entity';
import {
  Notification,
  NotificationCategory,
  NotificationData,
  NotificationEntityType,
  NotificationType,
} from '../../database/entities/notification.entity';
import { PostAttachment } from '../../database/entities/postAttachment.entity';
import { User } from '../../database/entities/user.entity';
import { S3Service } from '../../utils/s3/s3.service';
import {
  NotificationFilter,
  NotificationQueryDto,
} from './dtos/notification-query.dto';

export enum AccountSecurityEventType {
  NEW_LOGIN = 'NEW_LOGIN',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_CHANGED = 'EMAIL_CHANGED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
}

export enum NotificationCause {
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

export type CreateNotificationCauseInput =
  | {
      cause: NotificationCause.POST_LIKED;
      actorId: string;
      recipientId: string;
      postId: string;
      postPreview?: string | null;
    }
  | {
      cause: NotificationCause.POST_COMMENTED;
      actorId: string;
      recipientId: string;
      postId: string;
      commentId: string;
      commentContent: string;
    }
  | {
      cause: NotificationCause.POST_SHARED;
      actorId: string;
      recipientId: string;
      postId: string;
      postPreview?: string | null;
    }
  | {
      cause: NotificationCause.FRIEND_REQUEST_RECEIVED;
      actorId: string;
      recipientId: string;
      friendRequestId: string;
      mutualFriendCount?: number;
    }
  | {
      cause: NotificationCause.FRIEND_REQUEST_ACCEPTED;
      actorId: string;
      recipientId: string;
      friendRequestId: string;
    }
  | {
      cause: NotificationCause.GROUP_ADDED;
      actorId: string;
      recipientId: string;
      groupId: string;
      groupName: string;
    }
  | {
      cause: NotificationCause.GROUP_REMOVED;
      actorId: string;
      recipientId: string;
      groupId: string;
      groupName: string;
    }
  | {
      cause: NotificationCause.GROUP_MENTION;
      actorId: string;
      recipientId: string;
      groupId: string;
      groupMessageId: string;
      groupName: string;
      preview: string;
    }
  | {
      cause: NotificationCause.GROUP_ROLE_UPDATED;
      actorId: string;
      recipientId: string;
      groupId: string;
      groupName: string;
      previousRole: string;
      newRole: string;
    }
  | {
      cause: NotificationCause.ACCOUNT_SECURITY;
      actorId?: null;
      recipientId: string;
      securityEventType: AccountSecurityEventType;
      eventId?: string | null;
      device?: string | null;
      browser?: string | null;
      location?: string | null;
    }
  | {
      cause: NotificationCause.SYSTEM_ANNOUNCEMENT;
      actorId?: null;
      recipientId: string;
      announcementId?: string | null;
      title: string;
      message: string;
    };

interface CreateNotificationRecord {
  recipientId: string;
  actorId: string | null;
  category: NotificationCategory;
  type: NotificationType;
  entityType: NotificationEntityType | null;
  entityId: string | null;
  secondaryEntityId: string | null;
  aggregationKey: string | null;
  data: NotificationData | null;
}

interface NotificationCursor {
  updatedAt: string;
  id: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Friends)
    private readonly friendsRepo: Repository<Friends>,

    @InjectRepository(PostAttachment)
    private readonly postAttachmentRepo: Repository<PostAttachment>,

    private readonly s3Service: S3Service,
  ) {}

  // ============================================================
  // INTERNAL CREATION API
  // ============================================================

  async createFromCause(
    input: CreateNotificationCauseInput,
  ): Promise<Notification | null> {
    if (input.actorId && input.actorId === input.recipientId) {
      return null;
    }

    switch (input.cause) {
      case NotificationCause.POST_LIKED:
        return this.handlePostLiked(input);

      case NotificationCause.POST_COMMENTED:
        return this.handlePostCommented(input);

      case NotificationCause.POST_SHARED:
        return this.handlePostShared(input);

      case NotificationCause.FRIEND_REQUEST_RECEIVED:
        return this.handleFriendRequestReceived(input);

      case NotificationCause.FRIEND_REQUEST_ACCEPTED:
        return this.handleFriendRequestAccepted(input);

      case NotificationCause.GROUP_ADDED:
        return this.handleGroupAdded(input);

      case NotificationCause.GROUP_REMOVED:
        return this.handleGroupRemoved(input);

      case NotificationCause.GROUP_MENTION:
        return this.handleGroupMention(input);

      case NotificationCause.GROUP_ROLE_UPDATED:
        return this.handleGroupRoleUpdated(input);

      case NotificationCause.ACCOUNT_SECURITY:
        return this.handleAccountSecurity(input);

      case NotificationCause.SYSTEM_ANNOUNCEMENT:
        return this.handleSystemAnnouncement(input);

      default:
        return this.assertNever(input);
    }
  }

  private async createNotification(
    input: CreateNotificationRecord,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: input.category,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      secondaryEntityId: input.secondaryEntityId,
      aggregationKey: input.aggregationKey,
      aggregationCount: 1,
      data: input.data,
      isRead: false,
      readAt: null,
    });

    return this.notificationRepo.save(notification);
  }

  private async createOrAggregateNotification(
    input: CreateNotificationRecord & {
      aggregationKey: string;
    },
  ): Promise<Notification> {
    const existing = await this.notificationRepo.findOne({
      where: {
        recipientId: input.recipientId,
        aggregationKey: input.aggregationKey,
        isRead: false,
      },
    });

    if (!existing) {
      return this.createNotification(input);
    }

    existing.actorId = input.actorId;
    existing.aggregationCount = Math.max(existing.aggregationCount, 1) + 1;
    existing.data = {
      ...(existing.data ?? {}),
      ...(input.data ?? {}),
    };

    return this.notificationRepo.save(existing);
  }

  private async handlePostLiked(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.POST_LIKED }
    >,
  ): Promise<Notification> {
    return this.createOrAggregateNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.POST,
      type: NotificationType.POST_LIKED,
      entityType: NotificationEntityType.POST,
      entityId: input.postId,
      secondaryEntityId: null,
      aggregationKey: `POST_LIKED:${input.postId}`,
      data: {
        preview: this.createPreview(input.postPreview, 120),
      },
    });
  }

  private async handlePostCommented(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.POST_COMMENTED }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.POST,
      type: NotificationType.POST_COMMENTED,
      entityType: NotificationEntityType.POST,
      entityId: input.postId,
      secondaryEntityId: input.commentId,
      aggregationKey: null,
      data: {
        preview: this.createPreview(input.commentContent, 150),
      },
    });
  }

  private async handlePostShared(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.POST_SHARED }
    >,
  ): Promise<Notification> {
    return this.createOrAggregateNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.POST,
      type: NotificationType.POST_SHARED,
      entityType: NotificationEntityType.POST,
      entityId: input.postId,
      secondaryEntityId: null,
      aggregationKey: `POST_SHARED:${input.postId}`,
      data: {
        preview: this.createPreview(input.postPreview, 120),
      },
    });
  }

  private async handleFriendRequestReceived(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.FRIEND_REQUEST_RECEIVED }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.SOCIAL,
      type: NotificationType.FRIEND_REQUEST_RECEIVED,
      entityType: NotificationEntityType.FRIEND_REQUEST,
      entityId: input.friendRequestId,
      secondaryEntityId: null,
      aggregationKey: `FRIEND_REQUEST_RECEIVED:${input.friendRequestId}`,
      data: {
        mutualFriendCount: Math.max(input.mutualFriendCount ?? 0, 0),
      },
    });
  }

  private async handleFriendRequestAccepted(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.FRIEND_REQUEST_ACCEPTED }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.SOCIAL,
      type: NotificationType.FRIEND_REQUEST_ACCEPTED,
      entityType: NotificationEntityType.FRIEND_REQUEST,
      entityId: input.friendRequestId,
      secondaryEntityId: null,
      aggregationKey: `FRIEND_REQUEST_ACCEPTED:${input.friendRequestId}`,
      data: null,
    });
  }

  private async handleGroupAdded(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.GROUP_ADDED }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.CHAT,
      type: NotificationType.GROUP_ADDED,
      entityType: NotificationEntityType.GROUP,
      entityId: input.groupId,
      secondaryEntityId: null,
      aggregationKey: null,
      data: {
        groupName: this.createPreview(input.groupName, 100),
      },
    });
  }

  private async handleGroupRemoved(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.GROUP_REMOVED }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.CHAT,
      type: NotificationType.GROUP_REMOVED,
      entityType: NotificationEntityType.GROUP,
      entityId: input.groupId,
      secondaryEntityId: null,
      aggregationKey: null,
      data: {
        groupName: this.createPreview(input.groupName, 100),
      },
    });
  }

  private async handleGroupMention(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.GROUP_MENTION }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.CHAT,
      type: NotificationType.GROUP_MENTION,
      entityType: NotificationEntityType.GROUP,
      entityId: input.groupId,
      secondaryEntityId: input.groupMessageId,
      aggregationKey: null,
      data: {
        groupName: this.createPreview(input.groupName, 100),
        preview: this.createPreview(input.preview, 150),
      },
    });
  }

  private async handleGroupRoleUpdated(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.GROUP_ROLE_UPDATED }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      category: NotificationCategory.CHAT,
      type: NotificationType.GROUP_ROLE_UPDATED,
      entityType: NotificationEntityType.GROUP,
      entityId: input.groupId,
      secondaryEntityId: null,
      aggregationKey: null,
      data: {
        groupName: this.createPreview(input.groupName, 100),
        previousRole: input.previousRole,
        newRole: input.newRole,
      },
    });
  }

  private async handleAccountSecurity(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.ACCOUNT_SECURITY }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: null,
      category: NotificationCategory.SYSTEM,
      type: NotificationType.ACCOUNT_SECURITY,
      entityType: NotificationEntityType.SECURITY_EVENT,
      entityId: input.eventId ?? null,
      secondaryEntityId: null,
      aggregationKey: null,
      data: {
        securityEventType: input.securityEventType,
        device: this.createPreview(input.device, 100),
        browser: this.createPreview(input.browser, 100),
        location: this.createPreview(input.location, 150),
      },
    });
  }

  private async handleSystemAnnouncement(
    input: Extract<
      CreateNotificationCauseInput,
      { cause: NotificationCause.SYSTEM_ANNOUNCEMENT }
    >,
  ): Promise<Notification> {
    return this.createNotification({
      recipientId: input.recipientId,
      actorId: null,
      category: NotificationCategory.SYSTEM,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      entityType: NotificationEntityType.SYSTEM,
      entityId: input.announcementId ?? null,
      secondaryEntityId: null,
      aggregationKey: null,
      data: {
        title: this.createPreview(input.title, 120),
        message: this.createPreview(input.message, 500),
      },
    });
  }

  // ============================================================
  // USER-FACING READ API
  // ============================================================

  async getNotifications(recipientId: string, query: NotificationQueryDto) {
    const limit = Math.min(Math.max(query.limit || 20, 1), 50);

    const queryBuilder = this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .where('notification.recipientId = :recipientId', {
        recipientId,
      });

    this.applyFilter(queryBuilder, query.filter);

    const normalizedSearch = query.search?.trim().toLowerCase();

    if (normalizedSearch) {
      queryBuilder.andWhere(
        new Brackets((searchBuilder) => {
          searchBuilder
            .where('LOWER(actor.username) LIKE :search', {
              search: `%${normalizedSearch}%`,
            })
            .orWhere('LOWER(actor.firstname) LIKE :search', {
              search: `%${normalizedSearch}%`,
            })
            .orWhere('LOWER(actor.lastname) LIKE :search', {
              search: `%${normalizedSearch}%`,
            })
            .orWhere(
              `LOWER(
                COALESCE(
                  JSON_UNQUOTE(JSON_EXTRACT(notification.data, '$.preview')),
                  ''
                )
              ) LIKE :search`,
              {
                search: `%${normalizedSearch}%`,
              },
            )
            .orWhere(
              `LOWER(
                COALESCE(
                  JSON_UNQUOTE(JSON_EXTRACT(notification.data, '$.groupName')),
                  ''
                )
              ) LIKE :search`,
              {
                search: `%${normalizedSearch}%`,
              },
            );
        }),
      );
    }

    if (query.cursor) {
      const cursor = this.decodeCursor(query.cursor);

      queryBuilder.andWhere(
        `(
          notification.updatedAt < :cursorUpdatedAt
          OR (
            notification.updatedAt = :cursorUpdatedAt
            AND notification.id < :cursorId
          )
        )`,
        {
          cursorUpdatedAt: cursor.updatedAt,
          cursorId: cursor.id,
        },
      );
    }

    const notifications = await queryBuilder
      .orderBy('notification.updatedAt', 'DESC')
      .addOrderBy('notification.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = notifications.length > limit;
    const pageItems = hasMore ? notifications.slice(0, limit) : notifications;

    const thumbnailMap = await this.getPostThumbnailMap(pageItems);

    const items = await Promise.all(
      pageItems.map((notification) =>
        this.serializeNotification(
          notification,
          thumbnailMap.get(notification.entityId ?? '') ?? null,
        ),
      ),
    );

    const lastItem = pageItems.at(-1);

    return {
      message: 'Notifications returned successfully',
      code: 200,
      data: {
        items,
        nextCursor:
          hasMore && lastItem
            ? this.encodeCursor({
                updatedAt: lastItem.updatedAt.toISOString(),
                id: lastItem.id,
              })
            : null,
      },
    };
  }

  async getNotificationDetail(recipientId: string, notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: {
        id: notificationId,
        recipientId,
      },
      relations: {
        actor: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const thumbnailMap = await this.getPostThumbnailMap([notification]);

    const mutualFriends =
      notification.type === NotificationType.FRIEND_REQUEST_RECEIVED &&
      notification.actorId
        ? await this.getMutualFriends(recipientId, notification.actorId)
        : [];

    const serializedNotification = await this.serializeNotification(
      notification,
      thumbnailMap.get(notification.entityId ?? '') ?? null,
    );

    return {
      message: 'Notification returned successfully',
      code: 200,
      data: {
        ...serializedNotification,
        mutualFriends,
      },
    };
  }

  async getUnreadCount(recipientId: string) {
    const count = await this.notificationRepo.count({
      where: {
        recipientId,
        isRead: false,
      },
    });

    return {
      message: 'Unread notification count returned successfully',
      code: 200,
      data: {
        count,
      },
    };
  }

  async markAsRead(recipientId: string, notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: {
        id: notificationId,
        recipientId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();

      await this.notificationRepo.save(notification);
    }

    return this.getNotificationDetail(recipientId, notificationId);
  }

  async markAllAsRead(recipientId: string) {
    const now = new Date();

    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({
        isRead: true,
        readAt: now,
      })
      .where('recipientId = :recipientId', {
        recipientId,
      })
      .andWhere('isRead = :isRead', {
        isRead: false,
      })
      .execute();

    return {
      message: 'All notifications marked as read',
      code: 200,
      data: {
        readAt: now,
      },
    };
  }

  async deleteNotification(recipientId: string, notificationId: string) {
    const result = await this.notificationRepo.softDelete({
      id: notificationId,
      recipientId,
    });

    if (!result.affected) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Notification deleted successfully',
      code: 200,
    };
  }

  private applyFilter(
    queryBuilder: SelectQueryBuilder<Notification>,
    filter: NotificationFilter,
  ) {
    switch (filter) {
      case NotificationFilter.UNREAD:
        queryBuilder.andWhere('notification.isRead = :isRead', {
          isRead: false,
        });
        break;

      case NotificationFilter.MENTIONS:
        queryBuilder.andWhere('notification.type = :mentionType', {
          mentionType: NotificationType.GROUP_MENTION,
        });
        break;

      case NotificationFilter.SOCIAL:
        queryBuilder.andWhere('notification.category = :socialCategory', {
          socialCategory: NotificationCategory.SOCIAL,
        });
        break;

      case NotificationFilter.GROUPS:
        queryBuilder.andWhere('notification.category = :chatCategory', {
          chatCategory: NotificationCategory.CHAT,
        });
        break;

      case NotificationFilter.POSTS:
        queryBuilder.andWhere('notification.category = :postCategory', {
          postCategory: NotificationCategory.POST,
        });
        break;

      case NotificationFilter.SYSTEM:
        queryBuilder.andWhere('notification.category = :systemCategory', {
          systemCategory: NotificationCategory.SYSTEM,
        });
        break;

      case NotificationFilter.ALL:
      default:
        break;
    }
  }

  private async getPostThumbnailMap(
    notifications: Notification[],
  ): Promise<Map<string, string | null>> {
    const postIds = [
      ...new Set(
        notifications
          .filter(
            (notification) =>
              notification.entityType === NotificationEntityType.POST &&
              Boolean(notification.entityId),
          )
          .map((notification) => notification.entityId as string),
      ),
    ];

    if (postIds.length === 0) {
      return new Map();
    }

    const attachments = await this.postAttachmentRepo.find({
      where: {
        postId: In(postIds),
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
      },
    });

    const firstAttachmentByPost = new Map<string, PostAttachment>();

    for (const attachment of attachments) {
      if (!firstAttachmentByPost.has(attachment.postId)) {
        firstAttachmentByPost.set(attachment.postId, attachment);
      }
    }

    const result = new Map<string, string | null>();

    await Promise.all(
      postIds.map(async (postId) => {
        const attachment = firstAttachmentByPost.get(postId);

        if (!attachment) {
          result.set(postId, null);
          return;
        }

        result.set(postId, await this.resolveStoredFileUrl(attachment.key));
      }),
    );

    return result;
  }

  private async getMutualFriends(firstUserId: string, secondUserId: string) {
    const friendships = await this.friendsRepo
      .createQueryBuilder('friend')
      .where('friend.status = :acceptedStatus', {
        acceptedStatus: FriendStatus.ACCEPTED,
      })
      .andWhere(
        `(
          friend.user1Id IN (:...userIds)
          OR friend.user2Id IN (:...userIds)
        )`,
        {
          userIds: [firstUserId, secondUserId],
        },
      )
      .getMany();

    const firstUserFriends = new Set<string>();
    const secondUserFriends = new Set<string>();

    for (const friendship of friendships) {
      if (friendship.user1Id === firstUserId) {
        firstUserFriends.add(friendship.user2Id);
      } else if (friendship.user2Id === firstUserId) {
        firstUserFriends.add(friendship.user1Id);
      }

      if (friendship.user1Id === secondUserId) {
        secondUserFriends.add(friendship.user2Id);
      } else if (friendship.user2Id === secondUserId) {
        secondUserFriends.add(friendship.user1Id);
      }
    }

    firstUserFriends.delete(firstUserId);
    firstUserFriends.delete(secondUserId);
    secondUserFriends.delete(firstUserId);
    secondUserFriends.delete(secondUserId);

    const mutualIds = [...firstUserFriends].filter((friendId) =>
      secondUserFriends.has(friendId),
    );

    if (mutualIds.length === 0) {
      return [];
    }

    const users = await this.userRepo.find({
      where: {
        id: In(mutualIds.slice(0, 12)),
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    const mutualUsers = mutualIds
      .map((userId) => userMap.get(userId))
      .filter((user): user is User => Boolean(user));

    return Promise.all(mutualUsers.map((user) => this.safeUser(user)));
  }

  private async serializeNotification(
    notification: Notification,
    thumbnailUrl: string | null,
  ) {
    return {
      id: notification.id,
      category: notification.category,
      type: notification.type,

      actor: await this.safeUser(notification.actor),

      entityType: notification.entityType,
      entityId: notification.entityId,
      secondaryEntityId: notification.secondaryEntityId,

      aggregationCount: notification.aggregationCount,
      data: notification.data,
      thumbnailUrl,

      target: this.resolveTarget(notification),

      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,

      // Correct spelling.
      recipientId: notification.recipientId,

      // Temporary compatibility for any frontend code using the old typo.
      recepientId: notification.recipientId,
    };
  }

  private resolveTarget(notification: Notification) {
    switch (notification.type) {
      case NotificationType.FRIEND_REQUEST_RECEIVED:
      case NotificationType.FRIEND_REQUEST_ACCEPTED:
        return {
          href: notification.actor?.id
            ? `/profile/${notification.actor.id}`
            : '/friends',
          available: true,
        };

      case NotificationType.POST_LIKED:
      case NotificationType.POST_COMMENTED:
      case NotificationType.POST_SHARED:
        return {
          href: notification.entityId
            ? `/discover?post=${notification.entityId}${
                notification.secondaryEntityId
                  ? `&comment=${notification.secondaryEntityId}`
                  : ''
              }`
            : null,
          available: Boolean(notification.entityId),
        };

      case NotificationType.GROUP_ADDED:
      case NotificationType.GROUP_MENTION:
      case NotificationType.GROUP_ROLE_UPDATED:
        return {
          href: notification.entityId
            ? `/groups/${notification.entityId}${
                notification.secondaryEntityId
                  ? `?message=${notification.secondaryEntityId}`
                  : ''
              }`
            : null,
          available: Boolean(notification.entityId),
        };

      case NotificationType.GROUP_REMOVED:
        return {
          href: null,
          available: false,
        };

      case NotificationType.ACCOUNT_SECURITY:
        return {
          href: '/settings/security',
          available: true,
        };

      case NotificationType.SYSTEM_ANNOUNCEMENT:
      default:
        return {
          href: null,
          available: false,
        };
    }
  }

  private async resolveStoredFileUrl(
    value?: string | null,
  ): Promise<string | null> {
    if (!value) {
      return null;
    }

    // External/demo URLs are already usable and must not be sent to S3.
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    try {
      const { url } = await this.s3Service.getFileUrl(value);
      return url || null;
    } catch {
      // A broken profile picture or post thumbnail must not break
      // the complete notifications response.
      return null;
    }
  }

  private async safeUser(user?: User | null) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,

      // Resolve the stored S3 key only for this response object.
      // The TypeORM entity is not changed and is never saved.
      userPfpUrl: await this.resolveStoredFileUrl(user.userPfpUrl),

      isActive: user.isActive,
      lastSeen: user.lastSeen ?? null,
    };
  }

  private createPreview(
    value: string | null | undefined,
    maximumLength: number,
  ): string | null {
    const normalized = value?.trim();

    if (!normalized) {
      return null;
    }

    return normalized.slice(0, maximumLength);
  }

  private encodeCursor(cursor: NotificationCursor): string {
    return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
  }

  private decodeCursor(cursor: string): NotificationCursor {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as Partial<NotificationCursor>;

      if (
        !parsed.updatedAt ||
        !parsed.id ||
        Number.isNaN(new Date(parsed.updatedAt).getTime())
      ) {
        throw new Error('Invalid notification cursor');
      }

      return {
        updatedAt: parsed.updatedAt,
        id: parsed.id,
      };
    } catch {
      throw new BadRequestException('Invalid notification cursor');
    }
  }

  private assertNever(input: never): never {
    throw new BadRequestException(
      `Unsupported notification cause: ${JSON.stringify(input)}`,
    );
  }
}
