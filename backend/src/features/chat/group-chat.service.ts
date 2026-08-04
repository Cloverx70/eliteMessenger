import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';

import { AddGroupMembersDto } from './dtos/add-group-members.dto';
import { CreateGroupDto } from './dtos/create-group.dto';
import { GroupMessageDto } from './dtos/group-message.dto';
import { UpdateGroupMemberRoleDto } from './dtos/update-group-member-role.dto';
import { UpdateGroupMessageDto } from './dtos/update-group-message.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { GroupChat } from '../../database/entities/groupChat.entity';
import {
  GroupMember,
  GroupMemberRole,
} from '../../database/entities/groupMember.entity';
import { GroupMessage } from '../../database/entities/groupMessage.entity';
import { GroupMessageAttachment } from '../../database/entities/groupMessageAttachment.entity';
import { GroupMessageReceipt } from '../../database/entities/groupMessageReceipt.entity';
import { AttachmentType } from '../../database/entities/messageAttachment.entity';
import { User } from '../../database/entities/user.entity';
import { handleError } from '../../utils/handleError.util';
import { isValidUrl } from '../../utils/isValidURL';
import { S3Service } from '../../utils/s3/s3.service';
import {
  CreateNotificationCauseInput,
  NotificationCause,
  NotificationsService,
} from '../notifications/notifications.service';
import { group } from 'console';
import { Friends, FriendStatus } from '../../database/entities/friends.entity';
export type GroupMessageStatus = 'sent' | 'delivered' | 'seen';

export type GroupReceiptSummary = {
  totalRecipients: number;
  deliveredCount: number;
  seenCount: number;
  status: GroupMessageStatus;
};

@Injectable()
export class GroupChatService {
  constructor(
    @InjectRepository(GroupChat)
    private readonly groupRepo: Repository<GroupChat>,
    @InjectRepository(GroupMember)
    private readonly memberRepo: Repository<GroupMember>,
    @InjectRepository(GroupMessage)
    private readonly messageRepo: Repository<GroupMessage>,
    @InjectRepository(GroupMessageReceipt)
    private readonly receiptRepo: Repository<GroupMessageReceipt>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationsService,
  ) {}

  private async hydrateUserPfp(user?: User | null): Promise<User | null> {
    if (!user) return null;

    const storedValue = user.userPfpUrl;

    if (!storedValue) {
      user.userPfpUrl = null;
      return user;
    }

    // External/demo URLs are already ready for the frontend.
    if (/^https?:\/\//i.test(storedValue)) {
      return user;
    }

    // Replace the stored S3 key only on this in-memory entity.
    // No repository.save() call is made, so the database still stores the key.
    const { url } = await this.s3Service.getFileUrl(storedValue);
    user.userPfpUrl = url;

    return user;
  }

  private async safeUser(user?: User | null) {
    const hydratedUser = await this.hydrateUserPfp(user);

    if (!hydratedUser) return null;

    return {
      id: hydratedUser.id,
      username: hydratedUser.username,
      firstname: hydratedUser.firstname,
      lastname: hydratedUser.lastname,
      userPfpUrl: hydratedUser.userPfpUrl ?? null,
      isActive: hydratedUser.isActive,
      lastSeen: hydratedUser.lastSeen ?? null,
    };
  }

  private statusFromCounts(
    totalRecipients: number,
    deliveredCount: number,
    seenCount: number,
  ): GroupMessageStatus {
    if (totalRecipients > 0 && seenCount === totalRecipients) return 'seen';
    if (totalRecipients > 0 && deliveredCount === totalRecipients) {
      return 'delivered';
    }

    return 'sent';
  }

  async EnsureMember(groupId: string, userId: string) {
    const membership = await this.memberRepo.findOne({
      where: { groupId, userId },
      relations: { group: true },
    });

    if (!membership || !membership.group || membership.group.deletedAt) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return membership;
  }

  private async ensureManager(groupId: string, userId: string) {
    const membership = await this.EnsureMember(groupId, userId);

    if (
      membership.role !== GroupMemberRole.OWNER &&
      membership.role !== GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Only group owners and admins can do this');
    }

    return membership;
  }

  async GetMessageReceiptSummary(
    messageId: string,
  ): Promise<GroupReceiptSummary> {
    const receipts = await this.receiptRepo.find({ where: { messageId } });

    const totalRecipients = receipts.length;
    const deliveredCount = receipts.filter((receipt) =>
      Boolean(receipt.deliveredAt),
    ).length;
    const seenCount = receipts.filter((receipt) =>
      Boolean(receipt.seenAt),
    ).length;

    return {
      totalRecipients,
      deliveredCount,
      seenCount,
      status: this.statusFromCounts(totalRecipients, deliveredCount, seenCount),
    };
  }

  private async serializeMessage(
    message: GroupMessage,
    suppliedSummary?: GroupReceiptSummary,
  ) {
    const summary =
      suppliedSummary ??
      (message.receipts
        ? {
            totalRecipients: message.receipts.length,

            deliveredCount: message.receipts.filter((receipt) =>
              Boolean(receipt.deliveredAt),
            ).length,

            seenCount: message.receipts.filter((receipt) =>
              Boolean(receipt.seenAt),
            ).length,

            status: this.statusFromCounts(
              message.receipts.length,

              message.receipts.filter((receipt) => Boolean(receipt.deliveredAt))
                .length,

              message.receipts.filter((receipt) => Boolean(receipt.seenAt))
                .length,
            ),
          }
        : await this.GetMessageReceiptSummary(message.id));

    /*
     * Normal message attachments
     */
    const attachments = await Promise.all(
      (message.attachments ?? []).map(async (attachment) => {
        const { url } = await this.s3Service.getFileUrl(attachment.key);

        return {
          id: attachment.id,
          type: attachment.type,
          size: attachment.size ?? null,
          createdAt: attachment.createdAt,
          url,
        };
      }),
    );

    /*
     * Shared Discover post
     */
    const sharedPost = message.sharedPost
      ? {
          id: message.sharedPost.id,
          authorId: message.sharedPost.authorId,
          caption: message.sharedPost.caption,
          visibility: message.sharedPost.visibility,
          commentsEnabled: message.sharedPost.commentsEnabled,

          likeCount: message.sharedPost.likeCount,
          commentCount: message.sharedPost.commentCount,
          shareCount: message.sharedPost.shareCount,

          createdAt: message.sharedPost.createdAt,
          updatedAt: message.sharedPost.updatedAt,

          author: await this.safeUser(message.sharedPost.author),

          attachments: await Promise.all(
            [...(message.sharedPost.attachments ?? [])]
              .sort(
                (firstAttachment, secondAttachment) =>
                  firstAttachment.displayOrder - secondAttachment.displayOrder,
              )
              .map(async (attachment) => {
                const { url } = await this.s3Service.getFileUrl(attachment.key);

                const { key, post, ...safeAttachment } = attachment;

                return {
                  ...safeAttachment,
                  url,
                };
              }),
          ),
        }
      : null;

    return {
      id: message.id,
      message: message.message ?? '',

      groupId: message.groupId,

      senderId: message.senderId ?? null,
      sid: message.senderId ?? null,

      sender: await this.safeUser(message.sender),

      attachments,

      sharedPostId: message.sharedPostId ?? null,
      sharedPost,

      status: summary.status,
      receiptSummary: summary,

      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      deletedAt: message.deletedAt ?? null,
    };
  }
  async CreateGroup(creatorId: string, dto: CreateGroupDto) {
    try {
      const uniqueMemberIds = [...new Set(dto.memberIds)].filter(
        (memberId) => memberId !== creatorId,
      );

      if (uniqueMemberIds.length === 0) {
        throw new BadRequestException(
          'A group must contain at least one other member',
        );
      }

      const users = await this.userRepo.find({
        where: { id: In(uniqueMemberIds) },
      });

      if (users.length !== uniqueMemberIds.length) {
        throw new BadRequestException(
          'One or more selected users do not exist',
        );
      }

      const group = await this.dataSource.transaction(async (manager) => {
        const createdGroup = manager.create(GroupChat, {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          imageUrl: dto.imageUrl || null,
          creatorId,
        });

        const savedGroup = await manager.save(GroupChat, createdGroup);

        const memberships = [
          manager.create(GroupMember, {
            groupId: savedGroup.id,
            userId: creatorId,
            role: GroupMemberRole.OWNER,
          }),
          ...uniqueMemberIds.map((userId) =>
            manager.create(GroupMember, {
              groupId: savedGroup.id,
              userId,
              role: GroupMemberRole.MEMBER,
            }),
          ),
        ];

        await manager.save(GroupMember, memberships);
        return savedGroup;
      });

      for (const memberId of uniqueMemberIds) {
        const groupAddedNotification: CreateNotificationCauseInput = {
          cause: NotificationCause.GROUP_ADDED,
          actorId: creatorId,
          recipientId: memberId,
          groupId: group.id,
          groupName: group.name,
        };

        await this.notificationService.createFromCause(groupAddedNotification);
      }

      return {
        message: 'Group created successfully',
        code: 201,
        data: {
          id: group.id,
          name: group.name,
          description: group.description ?? null,
          imageUrl: group.imageUrl ?? null,
          creatorId: group.creatorId ?? creatorId,
          memberCount: uniqueMemberIds.length + 1,
          currentMemberRole: GroupMemberRole.OWNER,
          lastMessage: null,
          lastMessageDate: null,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        },
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async GetUserGroups(
    userId: string,
    query = '',
    filter: 'all' | 'unread' = 'all',
  ) {
    try {
      const groups = await this.groupRepo
        .createQueryBuilder('group')
        .innerJoin(
          'group.members',
          'currentMembership',
          'currentMembership.userId = :userId',
          { userId },
        )
        .where('group.deletedAt IS NULL')
        .orderBy('group.lastMessageDate', 'DESC')
        .addOrderBy('group.createdAt', 'DESC')
        .getMany();

      if (groups.length === 0) {
        return {
          message: 'Groups returned successfully',
          code: 200,
          data: [],
        };
      }

      const groupIds = groups.map((group) => group.id);

      const memberCountsRaw = await this.memberRepo
        .createQueryBuilder('member')
        .select('member.groupId', 'groupId')
        .addSelect('COUNT(member.id)', 'memberCount')
        .where('member.groupId IN (:...groupIds)', { groupIds })
        .groupBy('member.groupId')
        .getRawMany<{ groupId: string; memberCount: string }>();

      const memberCountMap = new Map(
        memberCountsRaw.map((item) => [item.groupId, Number(item.memberCount)]),
      );

      const unreadReceipts = await this.receiptRepo
        .createQueryBuilder('receipt')
        .innerJoinAndSelect('receipt.message', 'message')
        .where('receipt.userId = :userId', { userId })
        .andWhere('receipt.seenAt IS NULL')
        .andWhere('message.groupId IN (:...groupIds)', { groupIds })
        .andWhere('message.deletedAt IS NULL')
        .orderBy('message.createdAt', 'ASC')
        .getMany();

      const unreadMap = unreadReceipts.reduce(
        (acc, receipt) => {
          const groupId = receipt.message.groupId;
          if (!acc[groupId]) acc[groupId] = [];

          acc[groupId].push({
            id: receipt.message.id,
            groupId,
            senderId: receipt.message.senderId ?? null,
            message: receipt.message.message ?? '',
            createdAt: receipt.message.createdAt,
          });

          return acc;
        },
        {} as Record<string, any[]>,
      );

      const senderIds = [
        ...new Set(
          groups
            .map((group) => group.lastMessageSenderId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const lastSenders = senderIds.length
        ? await this.userRepo.find({ where: { id: In(senderIds) } })
        : [];

      const senderEntries = await Promise.all(
        lastSenders.map(async (sender) => {
          const safeSender = await this.safeUser(sender);

          return [sender.id, safeSender] as const;
        }),
      );

      const senderMap = new Map(senderEntries);

      let result = groups.map((group) => ({
        id: group.id,
        type: 'group' as const,
        name: group.name,
        description: group.description ?? null,
        imageUrl: group.imageUrl ?? null,
        creatorId: group.creatorId ?? null,
        memberCount: memberCountMap.get(group.id) ?? 0,
        lastMessage: group.lastMessage ?? null,
        lastMessageDate: group.lastMessageDate ?? null,
        lastMessageSenderId: group.lastMessageSenderId ?? null,
        lastMessageSender: group.lastMessageSenderId
          ? (senderMap.get(group.lastMessageSenderId) ?? null)
          : null,
        unreadMessages: unreadMap[group.id] ?? [],
        unreadCount: unreadMap[group.id]?.length ?? 0,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      }));

      const normalizedQuery = query.trim().toLowerCase();

      if (normalizedQuery) {
        const searchableMemberships = await this.memberRepo.find({
          where: { groupId: In(groupIds) },
          relations: { user: true },
        });

        const groupsMatchingMember = new Set(
          searchableMemberships
            .filter((membership) =>
              [
                membership.user?.username,
                membership.user?.firstname,
                membership.user?.lastname,
                `${membership.user?.firstname ?? ''} ${membership.user?.lastname ?? ''}`,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
            )
            .map((membership) => membership.groupId),
        );

        result = result.filter(
          (group) =>
            [group.name, group.description, group.lastMessage]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery) || groupsMatchingMember.has(group.id),
        );
      }

      if (filter === 'unread') {
        result = result.filter((group) => group.unreadCount > 0);
      }

      return {
        message: 'Groups returned successfully',
        code: 200,
        data: result,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async GetGroupMessages(
    userId: string,
    groupId: string,
    limit = 50,
    page = 1,
  ) {
    try {
      const membership = await this.EnsureMember(groupId, userId);
      const group = membership.group;

      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const safePage = Math.max(Number(page) || 1, 1);

      const [messages, total] = await this.messageRepo.findAndCount({
        where: {
          groupId,
        },

        relations: {
          attachments: true,
          sender: true,
          receipts: true,

          sharedPost: {
            author: true,
            attachments: true,
          },
        },

        order: {
          createdAt: 'ASC',
        },

        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      });

      const serializedMessages = await Promise.all(
        messages.map((message) => this.serializeMessage(message)),
      );

      const memberCount = await this.memberRepo.count({ where: { groupId } });

      return {
        message: 'Group messages returned successfully',
        code: 200,
        data: {
          totalPages: Math.ceil(total / safeLimit),
          pageIndex: safePage,
          limit: safeLimit,
          groupMessages: serializedMessages,
          group: {
            id: group.id,
            name: group.name,
            description: group.description ?? null,
            imageUrl: group.imageUrl ?? null,
            creatorId: group.creatorId ?? null,
            memberCount,
            currentMemberRole: membership.role,
            lastMessage: group.lastMessage ?? null,
            lastMessageDate: group.lastMessageDate ?? null,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          },
        },
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async GetGroupInfo(userId: string, groupId: string) {
    try {
      const currentMembership = await this.EnsureMember(groupId, userId);

      const memberships = await this.memberRepo.find({
        where: { groupId },
        relations: { user: true },
        order: { joinedAt: 'ASC' },
      });

      const messages = await this.messageRepo.find({
        where: { groupId },
        relations: { attachments: true },
        order: { createdAt: 'ASC' },
      });

      const media: { url: string; type: AttachmentType }[] = [];
      const links: { url: string; name: string }[] = [];

      for (const message of messages) {
        if (message.message && isValidUrl(message.message)) {
          const url = new URL(message.message);
          links.push({
            url: url.href,
            name: url.hostname.replace('www.', ''),
          });
        }

        for (const attachment of message.attachments ?? []) {
          media.push({
            url: (await this.s3Service.getFileUrl(attachment.key)).url,
            type: attachment.type,
          });
        }
      }

      const group = currentMembership.group;

      return {
        message: 'Group information returned successfully',
        code: 200,
        data: {
          group: {
            id: group.id,
            name: group.name,
            description: group.description ?? null,
            imageUrl: group.imageUrl ?? null,
            creatorId: group.creatorId ?? null,
            currentMemberRole: currentMembership.role,
            memberCount: memberships.length,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          },
          members: await Promise.all(
            memberships.map(async (membership) => ({
              id: membership.id,
              groupId: membership.groupId,
              userId: membership.userId,
              role: membership.role,
              joinedAt: membership.joinedAt,
              user: await this.safeUser(membership.user),
            })),
          ),
          media,
          links,
        },
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async UpdateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    try {
      await this.ensureManager(groupId, userId);

      const group = await this.groupRepo.findOneBy({ id: groupId });
      if (!group) throw new NotFoundException('Group not found');

      if (dto.name !== undefined) group.name = dto.name.trim();
      if (dto.description !== undefined) {
        group.description = dto.description.trim() || null;
      }
      if (dto.imageUrl !== undefined) group.imageUrl = dto.imageUrl || null;

      await this.groupRepo.save(group);

      return {
        message: 'Group updated successfully',
        code: 200,
        data: group,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async AddMembers(actorId: string, groupId: string, dto: AddGroupMembersDto) {
    try {
      await this.ensureManager(groupId, actorId);

      const memberIds = [...new Set(dto.memberIds)].filter(
        (userId) => userId !== actorId,
      );

      const users = await this.userRepo.find({ where: { id: In(memberIds) } });
      if (users.length !== memberIds.length) {
        throw new BadRequestException('One or more users do not exist');
      }

      const existing = await this.memberRepo.find({
        where: { groupId, userId: In(memberIds) },
      });
      const existingIds = new Set(existing.map((member) => member.userId));

      const newMemberships = memberIds
        .filter((userId) => !existingIds.has(userId))
        .map((userId) =>
          this.memberRepo.create({
            groupId,
            userId,
            role: GroupMemberRole.MEMBER,
          }),
        );

      if (newMemberships.length > 0) {
        await this.memberRepo.save(newMemberships);
      }

      for (const member of newMemberships) {
        const groupAddedNotification: CreateNotificationCauseInput = {
          cause: NotificationCause.GROUP_ADDED,
          actorId: actorId,
          recipientId: member.id,
          groupId: groupId,
          groupName: group.name,
        };

        await this.notificationService.createFromCause(groupAddedNotification);
      }

      return {
        message: 'Members added successfully',
        code: 200,
        data: {
          addedMemberIds: newMemberships.map((member) => member.userId),
        },
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async RemoveMember(actorId: string, groupId: string, memberUserId: string) {
    try {
      const actor = await this.ensureManager(groupId, actorId);
      const target = await this.memberRepo.findOneBy({
        groupId,
        userId: memberUserId,
      });

      if (!target) throw new NotFoundException('Group member not found');
      if (target.role === GroupMemberRole.OWNER) {
        throw new BadRequestException('The group owner cannot be removed');
      }

      if (
        actor.role === GroupMemberRole.ADMIN &&
        target.role !== GroupMemberRole.MEMBER
      ) {
        throw new ForbiddenException('Admins can only remove regular members');
      }

      await this.memberRepo.remove(target);

      const groupRoleUpdatedNotification: CreateNotificationCauseInput = {
        cause: NotificationCause.GROUP_REMOVED,
        actorId: actorId,
        recipientId: memberUserId,
        groupId: groupId,
        groupName: group.name,
      };

      await this.notificationService.createFromCause(
        groupRoleUpdatedNotification,
      );

      return { message: 'Member removed successfully', code: 200 };
    } catch (error: any) {
      handleError(error);
    }
  }
  async UpdateMemberRole(
    actorId: string,
    groupId: string,
    memberUserId: string,
    dto: UpdateGroupMemberRoleDto,
  ) {
    try {
      const actor = await this.EnsureMember(groupId, actorId);

      const target = await this.memberRepo.findOneBy({
        groupId,
        userId: memberUserId,
      });

      if (!target) {
        throw new NotFoundException('Group member not found');
      }

      const previousRole = target.role;

      if (dto.role === GroupMemberRole.OWNER) {
        if (actor.role !== GroupMemberRole.OWNER) {
          throw new ForbiddenException('Only the owner can transfer ownership');
        }

        if (actor.userId === target.userId) {
          return {
            message: 'User is already the group owner',
            code: 200,
          };
        }

        const group = await this.groupRepo.findOne({
          where: {
            id: groupId,
          },
        });

        if (!group) {
          throw new NotFoundException('Group not found');
        }

        await this.dataSource.transaction(async (manager) => {
          actor.role = GroupMemberRole.ADMIN;

          target.role = GroupMemberRole.OWNER;

          await manager.save(GroupMember, [actor, target]);

          await manager.update(GroupChat, groupId, {
            creatorId: target.userId,
          });
        });

        await this.notificationService.createFromCause({
          cause: NotificationCause.GROUP_ROLE_UPDATED,

          actorId: actor.userId,
          recipientId: target.userId,

          groupId,
          groupName: group.name,

          previousRole,
          newRole: GroupMemberRole.OWNER,
        });

        return {
          message: 'Ownership transferred successfully',
          code: 200,
        };
      }

      if (actor.role !== GroupMemberRole.OWNER) {
        throw new ForbiddenException('Only the owner can change member roles');
      }

      if (target.role === GroupMemberRole.OWNER) {
        throw new BadRequestException(
          'Transfer ownership before changing the owner role',
        );
      }

      if (previousRole === dto.role) {
        return {
          message: 'Member already has this role',
          code: 200,
        };
      }

      const group = await this.groupRepo.findOne({
        where: {
          id: groupId,
        },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      target.role = dto.role;

      await this.memberRepo.save(target);

      const notification: CreateNotificationCauseInput = {
        cause: NotificationCause.GROUP_ROLE_UPDATED,

        actorId: actor.userId,
        recipientId: target.userId,

        groupId,
        groupName: group.name,

        previousRole,

        newRole: dto.role,
      };

      await this.notificationService.createFromCause(notification);

      return {
        message: 'Member role updated successfully',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }
  async LeaveGroup(userId: string, groupId: string) {
    try {
      const membership = await this.EnsureMember(groupId, userId);
      const memberCount = await this.memberRepo.count({ where: { groupId } });

      if (membership.role === GroupMemberRole.OWNER && memberCount > 1) {
        throw new BadRequestException(
          'Transfer group ownership before leaving',
        );
      }

      if (memberCount === 1) {
        await this.groupRepo.softDelete(groupId);
      }

      await this.memberRepo.remove(membership);

      return { message: 'You left the group successfully', code: 200 };
    } catch (error: any) {
      handleError(error);
    }
  }

  async DeleteGroup(userId: string, groupId: string) {
    try {
      const membership = await this.EnsureMember(groupId, userId);
      if (membership.role !== GroupMemberRole.OWNER) {
        throw new ForbiddenException('Only the owner can delete the group');
      }

      await this.groupRepo.softDelete(groupId);

      return { message: 'Group deleted successfully', code: 200 };
    } catch (error: any) {
      handleError(error);
    }
  }

  async SendMessage(dto: GroupMessageDto) {
    try {
      const hasText = Boolean(dto.text?.trim());
      const hasAttachments = (dto.attachments?.length ?? 0) > 0;

      if (!hasText && !hasAttachments) {
        throw new BadRequestException('Message cannot be empty');
      }

      await this.EnsureMember(dto.gid, dto.sid);

      const result = await this.dataSource.transaction(async (manager) => {
        const group = await manager.findOne(GroupChat, {
          where: { id: dto.gid },
        });
        if (!group) throw new NotFoundException('Group not found');

        const members = await manager.find(GroupMember, {
          where: { groupId: dto.gid },
        });

        const newMessage = manager.create(GroupMessage, {
          groupId: dto.gid,
          senderId: dto.sid,
          message: dto.text?.trim() || null,
          attachments:
            dto.attachments?.map((attachment) =>
              manager.create(GroupMessageAttachment, {
                key: attachment.key,
                type: attachment.type,
                size: attachment.size,
              }),
            ) ?? [],
        });

        const savedMessage = await manager.save(GroupMessage, newMessage);

        const recipientIds = members
          .map((member) => member.userId)
          .filter((memberId) => memberId !== dto.sid);

        if (recipientIds.length > 0) {
          const receipts = recipientIds.map((userId) =>
            manager.create(GroupMessageReceipt, {
              messageId: savedMessage.id,
              userId,
              deliveredAt: null,
              seenAt: null,
            }),
          );

          await manager.save(GroupMessageReceipt, receipts);
        }

        group.lastMessage =
          dto.text?.trim() ||
          (dto.attachments?.length === 1
            ? 'Sent an attachment'
            : `Sent ${dto.attachments?.length ?? 0} attachments`);
        group.lastMessageDate = new Date();
        group.lastMessageSenderId = dto.sid;
        await manager.save(GroupChat, group);

        const completeMessage = await manager.findOne(GroupMessage, {
          where: {
            id: savedMessage.id,
          },

          relations: {
            attachments: true,
            sender: true,
            receipts: true,

            sharedPost: {
              author: true,
              attachments: true,
            },
          },
        });

        if (!completeMessage) {
          throw new NotFoundException('Saved group message was not found');
        }

        return { completeMessage, recipientIds };
      });

      const newMessage = await this.serializeMessage(result.completeMessage);

      return {
        message: 'Group message sent successfully',
        code: 200,
        newMessage,
        recipientIds: result.recipientIds,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async UpdateMessage(
    userId: string,
    messageId: string,
    dto: UpdateGroupMessageDto,
  ) {
    try {
      const message = await this.messageRepo.findOne({
        where: { id: messageId },
      });

      if (!message) throw new NotFoundException('Group message not found');
      if (message.senderId !== userId) {
        throw new ForbiddenException('You can only edit your own messages');
      }

      message.message = dto.message.trim();
      await this.messageRepo.save(message);

      const latestMessage = await this.messageRepo.findOne({
        where: { groupId: message.groupId },
        order: { createdAt: 'DESC' },
      });

      if (latestMessage?.id === message.id) {
        await this.groupRepo.update(message.groupId, {
          lastMessage: message.message,
        });
      }

      return { message: 'Group message updated successfully', code: 200 };
    } catch (error: any) {
      handleError(error);
    }
  }

  async DeleteMessage(userId: string, messageId: string) {
    try {
      const message = await this.messageRepo.findOne({
        where: { id: messageId },
      });

      if (!message) throw new NotFoundException('Group message not found');
      if (message.senderId !== userId) {
        throw new ForbiddenException('You can only delete your own messages');
      }

      const groupId = message.groupId;
      await this.messageRepo.softDelete(messageId);

      const latestMessage = await this.messageRepo.findOne({
        where: { groupId },
        order: { createdAt: 'DESC' },
      });

      await this.groupRepo.update(groupId, {
        lastMessage: latestMessage?.message ?? null,
        lastMessageDate: latestMessage?.createdAt ?? null,
        lastMessageSenderId: latestMessage?.senderId ?? null,
      });

      return { message: 'Group message deleted successfully', code: 200 };
    } catch (error: any) {
      handleError(error);
    }
  }

  async MarkMessageDelivered(messageId: string, userIds: string[]) {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length > 0) {
      await this.receiptRepo
        .createQueryBuilder()
        .update(GroupMessageReceipt)
        .set({ deliveredAt: new Date() })
        .where('messageId = :messageId', { messageId })
        .andWhere('userId IN (:...userIds)', { userIds: uniqueUserIds })
        .andWhere('deliveredAt IS NULL')
        .execute();
    }

    return this.GetMessageReceiptSummary(messageId);
  }

  async MarkPendingMessagesDelivered(userId: string) {
    try {
      const receipts = await this.receiptRepo.find({
        where: {
          userId,
          deliveredAt: IsNull(),
        },
        relations: { message: true },
      });

      if (receipts.length === 0) return [];

      const deliveredAt = new Date();
      receipts.forEach((receipt) => {
        receipt.deliveredAt = deliveredAt;
      });
      await this.receiptRepo.save(receipts);

      return Promise.all(
        receipts.map(async (receipt) => ({
          messageId: receipt.messageId,
          groupId: receipt.message.groupId,
          senderId: receipt.message.senderId ?? null,
          recipientUserId: userId,
          ...(await this.GetMessageReceiptSummary(receipt.messageId)),
        })),
      );
    } catch (error: any) {
      handleError(error);
    }
  }

  async MarkMessagesSeen(groupId: string, userId: string) {
    try {
      await this.EnsureMember(groupId, userId);

      const receipts = await this.receiptRepo
        .createQueryBuilder('receipt')
        .innerJoinAndSelect('receipt.message', 'message')
        .where('receipt.userId = :userId', { userId })
        .andWhere('message.groupId = :groupId', { groupId })
        .andWhere('receipt.seenAt IS NULL')
        .andWhere('message.deletedAt IS NULL')
        .getMany();

      if (receipts.length === 0) return [];

      const now = new Date();
      receipts.forEach((receipt) => {
        receipt.deliveredAt = receipt.deliveredAt ?? now;
        receipt.seenAt = now;
      });

      await this.receiptRepo.save(receipts);

      return Promise.all(
        receipts.map(async (receipt) => ({
          messageId: receipt.messageId,
          groupId,
          senderId: receipt.message.senderId ?? null,
          seenByUserId: userId,
          ...(await this.GetMessageReceiptSummary(receipt.messageId)),
        })),
      );
    } catch (error: any) {
      handleError(error);
    }
  }

  async GetAvailableUsers(currentUserId: string, query: string = '') {
    try {
      const normalizedQuery = query.trim();

      const queryBuilder = this.userRepo
        .createQueryBuilder('user')
        .innerJoin(
          Friends,
          'friend',
          `
            (
              friend.user1Id = :currentUserId
              AND friend.user2Id = user.id
            )
            OR
            (
              friend.user2Id = :currentUserId
              AND friend.user1Id = user.id
            )
          `,
          {
            currentUserId,
          },
        )
        .select([
          'user.id',
          'user.username',
          'user.firstname',
          'user.lastname',
          'user.userPfpUrl',
          'user.isActive',
          'user.lastSeen',
        ])
        .where('friend.status = :friendStatus', {
          friendStatus: FriendStatus.ACCEPTED,
        })
        .andWhere('user.id != :currentUserId', {
          currentUserId,
        })
        .distinct(true)
        .orderBy('user.username', 'ASC')
        .take(50);

      if (normalizedQuery) {
        queryBuilder.andWhere(
          `
          (
            user.username LIKE :query
            OR user.firstname LIKE :query
            OR user.lastname LIKE :query
            OR CONCAT(
              user.firstname,
              ' ',
              user.lastname
            ) LIKE :query
          )
        `,
          {
            query: `%${normalizedQuery}%`,
          },
        );
      }

      const users = await queryBuilder.getMany();

      const safeUsers = await Promise.all(
        users.map((user) => this.safeUser(user)),
      );

      return {
        message: 'Available friends returned successfully',
        code: 200,
        data: safeUsers,
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }
}
