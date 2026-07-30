import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';

import { ChatRoom } from '../../database/entities/chatRoom.entity';
import { Message } from '../../database/entities/message.entity';
import { AttachmentType } from '../../database/entities/messageAttachment.entity';
import { Post } from '../../database/entities/post.entity';
import { User } from '../../database/entities/user.entity';
import { handleError } from '../../utils/handleError.util';
import { isValidUrl } from '../../utils/isValidURL';
import { S3Service } from './../../utils/s3/s3.service';
import { ChatRoomDto } from './dtos/chatroom.dto';
import MessageDto from './dtos/message.dto';
import { updateMessageDto } from './dtos/updateMessage.dto';
import { updateMessageStatusDto } from './dtos/updateMessageStatus.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ChatRoom)
    private readonly chatRoomRepo: Repository<ChatRoom>,

    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    private readonly s3Service: S3Service,
  ) {}

  usersSelect = [
    'user1.id',
    'user1.userPfpUrl',
    'user1.username',
    'user1.firstname',
    'user1.lastname',
    'user2.id',
    'user2.userPfpUrl',
    'user2.username',
    'user2.firstname',
    'user2.lastname',
    'cr.id',
    'cr.createdAt',
    'cr.updatedAt',
    'cr.lastMessage',
  ];

  private safeUser(user?: User | null) {
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      userPfpUrl: user.userPfpUrl ?? null,
      isActive: user.isActive,
      lastSeen: user.lastSeen ?? null,
    };
  }

  private async ensureChatParticipant(
    chatroomId: string,
    userId: string,
  ): Promise<ChatRoom> {
    const chatroom = await this.chatRoomRepo.findOne({
      where: {
        id: chatroomId,
      },
    });

    if (!chatroom) {
      throw new NotFoundException('Chat room not found');
    }

    const isParticipant =
      chatroom.user1Id === userId || chatroom.user2Id === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not allowed to access this chat room',
      );
    }

    return chatroom;
  }

  private async serializeSharedPost(post?: Post | null) {
    if (!post) return null;

    const attachments = await Promise.all(
      [...(post.attachments ?? [])]
        .sort(
          (firstAttachment, secondAttachment) =>
            firstAttachment.displayOrder - secondAttachment.displayOrder,
        )
        .map(async (attachment) => {
          const { url } = await this.s3Service.getFileUrl(attachment.key);

          return {
            id: attachment.id,
            postId: attachment.postId,
            type: attachment.type,
            mimeType: attachment.mimeType,
            filename: attachment.filename ?? null,
            size: attachment.size ?? null,
            width: attachment.width ?? null,
            height: attachment.height ?? null,
            duration: attachment.duration ?? null,
            displayOrder: attachment.displayOrder,
            blurDataURL: attachment.blurDataURL ?? null,
            createdAt: attachment.createdAt,
            url,
          };
        }),
    );

    return {
      id: post.id,
      authorId: post.authorId,
      caption: post.caption,
      visibility: post.visibility,
      commentsEnabled: post.commentsEnabled,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: this.safeUser(post.author),
      attachments,
    };
  }

  private async serializeMessage(message: Message) {
    const attachments = await Promise.all(
      (message.attachments ?? []).map(async (attachment) => {
        const { url } = await this.s3Service.getFileUrl(attachment.key);

        return {
          id: attachment.id,
          messageId: attachment.messageId,
          type: attachment.type,
          size: attachment.size ?? null,
          createdAt: attachment.createdAt,
          url,
        };
      }),
    );

    return {
      id: message.id,
      message: message.message ?? '',
      chatroomId: message.chatroomId,
      sid: message.sid ?? null,
      sender: this.safeUser(message.sender),
      attachments,
      sharedPostId: message.sharedPostId ?? null,
      sharedPost: await this.serializeSharedPost(message.sharedPost),
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      deletedAt: message.deletedAt ?? null,
    };
  }

  async CreateChatRoom(chatRoomDto: ChatRoomDto) {
    try {
      if (chatRoomDto.uid1 === chatRoomDto.uid2) {
        throw new BadRequestException(
          'You cannot create a direct chat with yourself',
        );
      }

      const users = await this.userRepo.find({
        where: {
          id: In([chatRoomDto.uid1, chatRoomDto.uid2]),
        },
      });

      if (users.length !== 2) {
        throw new NotFoundException('One or more users were not found');
      }

      const chatroomExists = await this.chatRoomRepo
        .createQueryBuilder('cr')
        .where(
          `(
            cr.user1Id = :uid1
            AND cr.user2Id = :uid2
          ) OR (
            cr.user1Id = :uid2
            AND cr.user2Id = :uid1
          )`,
          {
            uid1: chatRoomDto.uid1,
            uid2: chatRoomDto.uid2,
          },
        )
        .getOne();

      if (chatroomExists) {
        throw new BadRequestException('Chat room already exists');
      }

      const chatroom = this.chatRoomRepo.create({
        user1Id: chatRoomDto.uid1,
        user2Id: chatRoomDto.uid2,
      });

      const savedChatroom = await this.chatRoomRepo.save(chatroom);

      return {
        message: 'Chat room created successfully',
        code: 201,
        data: savedChatroom,
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async SendMessage(crid: string, messageDto: MessageDto) {
    try {
      const text = messageDto.text?.trim() || null;
      const attachments = messageDto.attachments ?? [];

      const hasText = Boolean(text);
      const hasAttachments = attachments.length > 0;
      const hasSharedPost = Boolean(messageDto.sharedPostId);

      if (!hasText && !hasAttachments && !hasSharedPost) {
        throw new BadRequestException('Message cannot be empty');
      }

      const chatRoom = await this.ensureChatParticipant(crid, messageDto.sid);

      if (messageDto.sharedPostId) {
        const postExists = await this.postRepo.exists({
          where: {
            id: messageDto.sharedPostId,
          },
        });

        if (!postExists) {
          throw new NotFoundException('Shared post was not found');
        }
      }

      const newMessage = this.messageRepo.create({
        sid: messageDto.sid,
        chatRoom,
        chatroomId: chatRoom.id,
        message: text,
        status: 'sent',
        sharedPostId: messageDto.sharedPostId ?? null,
        attachments: attachments.map((attachment) => ({
          key: attachment.key,
          type: attachment.type,
          size: attachment.size,
        })),
      });

      const savedMessage = await this.messageRepo.save(newMessage);

      chatRoom.lastMessage =
        text ??
        (messageDto.sharedPostId
          ? 'Shared a post'
          : attachments.length === 1
            ? 'Sent an attachment'
            : `Sent ${attachments.length} attachments`);

      chatRoom.lastMessageDate = new Date();

      await this.chatRoomRepo.save(chatRoom);

      const completeMessage = await this.messageRepo.findOne({
        where: {
          id: savedMessage.id,
        },
        relations: {
          attachments: true,
          sender: true,
          sharedPost: {
            author: true,
            attachments: true,
          },
        },
      });

      if (!completeMessage) {
        throw new NotFoundException('Saved message was not found');
      }

      return {
        message: 'Message sent successfully',
        code: 200,
        newMessage: await this.serializeMessage(completeMessage),
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async updateMessage(mid: string, updateMessageDto: updateMessageDto) {
    try {
      const message = await this.messageRepo.findOne({
        where: {
          id: mid,
        },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      message.message = updateMessageDto.message.trim();

      await this.messageRepo.save(message);

      return {
        message: 'Message updated successfully',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async updateMessageStatus(
    mid: string,
    updateMessageDto: updateMessageStatusDto,
  ) {
    try {
      const message = await this.messageRepo.findOne({
        where: {
          id: mid,
        },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      message.status = updateMessageDto.status;

      await this.messageRepo.save(message);

      return {
        message: 'Message status updated successfully',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async updateMessagesSeen(crid: string, sid: string) {
    try {
      await this.ensureChatParticipant(crid, sid);

      const messages = await this.messageRepo
        .createQueryBuilder('message')
        .where('message.sid != :sid', {
          sid,
        })
        .andWhere('message.chatroomId = :crid', {
          crid,
        })
        .andWhere('message.status != :status', {
          status: 'seen',
        })
        .getMany();

      if (messages.length === 0) {
        return [];
      }

      messages.forEach((message) => {
        message.status = 'seen';
      });

      await this.messageRepo.save(messages);

      return messages;
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async GetChatroomMessages(
    uid: string,
    crid: string,
    limit: number,
    page: number,
  ) {
    try {
      await this.ensureChatParticipant(crid, uid);

      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const safePage = Math.max(Number(page) || 1, 1);

      const chatroom = await this.chatRoomRepo
        .createQueryBuilder('cr')
        .select([
          'cr.id AS id',
          'cr.createdAt AS createdAt',
          'cr.updatedAt AS updatedAt',
          'cr.lastMessage AS lastMessage',
          'cr.lastMessageDate AS lastMessageDate',
          'cr.name AS name',

          `CASE
            WHEN user1.id = :uid
            THEN user2.id
            ELSE user1.id
          END AS recId`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.username
            ELSE user1.username
          END AS recUsername`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.firstname
            ELSE user1.firstname
          END AS recFirstname`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.lastname
            ELSE user1.lastname
          END AS recLastname`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.userPfpUrl
            ELSE user1.userPfpUrl
          END AS recUserPfpUrl`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.isActive
            ELSE user1.isActive
          END AS recIsActive`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.lastSeen
            ELSE user1.lastSeen
          END AS recLastSeen`,
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('cr.id = :crid', {
          crid,
        })
        .setParameter('uid', uid)
        .getRawOne();

      const [messages, total] = await this.messageRepo.findAndCount({
        where: {
          chatroomId: crid,
        },
        relations: {
          attachments: true,
          sender: true,
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

      return {
        message: 'Chat room messages returned successfully',
        code: 200,
        data: {
          totalPages: Math.ceil(total / safeLimit),
          pageIndex: safePage,
          limit: safeLimit,
          chatRoomMessages: serializedMessages,
          chatroom,
        },
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async GetUserChatrooms(
    uid: string,
    query = '',
    filter: 'all' | 'unread' = 'all',
  ) {
    try {
      const chatrooms = await this.chatRoomRepo
        .createQueryBuilder('cr')
        .select([
          'cr.id AS id',
          'cr.createdAt AS createdAt',
          'cr.updatedAt AS updatedAt',
          'cr.lastMessage AS lastMessage',
          'cr.lastMessageDate AS lastMessageDate',
          'cr.name AS name',

          `CASE
            WHEN user1.id = :uid
            THEN user2.id
            ELSE user1.id
          END AS recId`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.username
            ELSE user1.username
          END AS recUsername`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.firstname
            ELSE user1.firstname
          END AS recFirstname`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.lastname
            ELSE user1.lastname
          END AS recLastname`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.userPfpUrl
            ELSE user1.userPfpUrl
          END AS recUserPfpUrl`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.isActive
            ELSE user1.isActive
          END AS recIsActive`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.lastSeen
            ELSE user1.lastSeen
          END AS recLastSeen`,
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('(cr.user1Id = :uid OR cr.user2Id = :uid)', {
          uid,
        })
        .orderBy('cr.lastMessageDate', 'DESC')
        .addOrderBy('cr.createdAt', 'DESC')
        .getRawMany();

      if (chatrooms.length === 0) {
        return {
          message: 'Successfully returned chat rooms',
          code: 200,
          data: [],
        };
      }

      const chatroomIds = chatrooms.map((room) => room.id);

      const unreadMessages = await this.messageRepo.find({
        where: {
          chatroomId: In(chatroomIds),
          status: 'delivered',
          sid: Not(uid),
        },
        relations: {
          sender: true,
          attachments: true,
          sharedPost: {
            author: true,
            attachments: true,
          },
        },
        order: {
          createdAt: 'ASC',
        },
      });

      const serializedUnreadMessages = await Promise.all(
        unreadMessages.map((message) => this.serializeMessage(message)),
      );

      const unreadMap = serializedUnreadMessages.reduce(
        (accumulator, message) => {
          if (!accumulator[message.chatroomId]) {
            accumulator[message.chatroomId] = [];
          }

          accumulator[message.chatroomId].push(message);

          return accumulator;
        },
        {} as Record<string, any[]>,
      );

      let result = chatrooms.map((room) => {
        const roomUnreadMessages = unreadMap[room.id] ?? [];

        return {
          ...room,
          unreadMessages: roomUnreadMessages,
          unreadCount: roomUnreadMessages.length,
        };
      });

      const normalizedQuery = query.trim().toLowerCase();

      if (normalizedQuery) {
        result = result.filter((room) => {
          const searchableText = [
            room.recUsername,
            room.recFirstname,
            room.recLastname,
            `${room.recFirstname ?? ''} ${room.recLastname ?? ''}`,
            room.name,
            room.lastMessage,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchableText.includes(normalizedQuery);
        });
      }

      if (filter === 'unread') {
        result = result.filter((room) => room.unreadCount > 0);
      }

      return {
        message: 'Successfully returned chat rooms',
        code: 200,
        data: result,
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async GetChatroomInfo(uid: string, crid: string) {
    try {
      await this.ensureChatParticipant(crid, uid);

      const chatroom = await this.chatRoomRepo
        .createQueryBuilder('cr')
        .select([
          'cr.id AS id',
          'cr.createdAt AS createdAt',
          'cr.updatedAt AS updatedAt',
          'cr.name AS name',

          `CASE
            WHEN user1.id = :uid
            THEN user2.id
            ELSE user1.id
          END AS recId`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.username
            ELSE user1.username
          END AS recUsername`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.userPfpUrl
            ELSE user1.userPfpUrl
          END AS recUserPfpUrl`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.bio
            ELSE user1.bio
          END AS recBio`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.isActive
            ELSE user1.isActive
          END AS recIsActive`,

          `CASE
            WHEN user1.id = :uid
            THEN user2.lastSeen
            ELSE user1.lastSeen
          END AS recLastSeen`,
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('cr.id = :crid', {
          crid,
        })
        .setParameter('uid', uid)
        .getRawOne();

      const messages = await this.messageRepo.find({
        where: {
          chatroomId: crid,
        },
        relations: {
          attachments: true,
        },
        order: {
          createdAt: 'ASC',
        },
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
          const { url } = await this.s3Service.getFileUrl(attachment.key);

          media.push({
            url,
            type: attachment.type,
          });
        }
      }

      return {
        message: 'Chat room information returned successfully',
        code: 200,
        data: {
          chatroom,
          media,
          links,
        },
      };
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }

  async updateUserActivity(userId: string, active: boolean) {
    await this.userRepo.update(
      {
        id: userId,
      },
      {
        isActive: active,
        lastSeen: active ? null : new Date(),
      },
    );
  }

  async markMessagesDelivered(uid: string) {
    try {
      const messages = await this.messageRepo
        .createQueryBuilder('message')
        .innerJoin('message.chatRoom', 'chatroom')
        .where('(chatroom.user1Id = :uid OR chatroom.user2Id = :uid)', {
          uid,
        })
        .andWhere('message.sid != :uid', {
          uid,
        })
        .andWhere('message.status = :status', {
          status: 'sent',
        })
        .getMany();

      if (messages.length === 0) {
        return [];
      }

      messages.forEach((message) => {
        message.status = 'delivered';
      });

      await this.messageRepo.save(messages);

      return messages;
    } catch (error: any) {
      handleError(error);
      throw error;
    }
  }
}
