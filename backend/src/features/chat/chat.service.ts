import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { ChatRoom } from '../../database/entities/chatRoom.entity';
import { Message } from '../../database/entities/message.entity';
import { AttachmentType } from '../../database/entities/messageAttachment.entity';
import { User } from '../../database/entities/user.entity';
import { handleError } from '../../utils/handleError.util';
import { isValidUrl } from '../../utils/isValidURL';
import { S3Service } from './../../utils/s3/s3.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRoomDto } from './dtos/chatroom.dto';
import MessageDto from './dtos/message.dto';
import { updateMessageStatusDto } from './dtos/updateMessageStatus.dto';
import { updateMessageDto } from './dtos/updateMessage.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepo: Repository<ChatRoom>,
    @InjectRepository(Message)
    private readonly MessageRepo: Repository<Message>,

    private readonly S3Service: S3Service,
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

  async CreateChatRoom(chatRoomDto: ChatRoomDto) {
    // Best & Worst Case O(Log N)
    try {
      const chatroomExists = await this.chatRoomRepo
        .createQueryBuilder('cr')
        .where(
          '(cr.user1Id = :cru1id AND cr.user2Id = :cru2id) OR (cr.user1Id = :cru2id AND cr.user2Id = :cru1id)',
          { cru1id: chatRoomDto.uid1, cru2id: chatRoomDto.uid2 },
        )
        .getOne();

      if (chatroomExists)
        throw new BadRequestException('chatroom already exists');

      await this.chatRoomRepo
        .createQueryBuilder()
        .insert()
        .into(ChatRoom)
        .values({
          user1Id: chatRoomDto.uid1,
          user2Id: chatRoomDto.uid2,
        })
        .execute();

      return { message: 'ChatRoom Created Successfully', code: 200 };
    } catch (error: any) {
      handleError(error);
    }
  }

  async SendMessage(crid: string, messageDto: MessageDto) {
    try {
      if (!messageDto.text && messageDto.attachments.length === 0)
        throw new BadRequestException('Message cannot be empty');

      const chatRoom = await this.chatRoomRepo.findOneBy({ id: crid });

      if (!chatRoom) {
        throw new NotFoundException('chat room not found');
      }

      const newMessage = this.MessageRepo.create({
        sid: messageDto.sid,
        chatRoom,
        message: messageDto.text,
        status: 'sent',
        attachments:
          messageDto.attachments?.map((a) => ({
            key: a.key,
            type: a.type,
            size: a.size,
          })) ?? [],
      });

      chatRoom.lastMessage = messageDto.text;
      chatRoom.lastMessageDate = new Date();

      await this.MessageRepo.save(newMessage);
      await this.chatRoomRepo.save(chatRoom);

      return { message: 'Message Sent Successfully', code: 200, newMessage };
    } catch (error: any) {
      handleError(error);
    }
  }

  async updateMessage(mid: string, updateMessageDto: updateMessageDto) {
    try {
      const message = await this.MessageRepo.findOne({ where: { id: mid } });

      message.message = updateMessageDto.message;

      await this.MessageRepo.save(message);

      return {
        message: 'Message updated Successfully!',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async updateMessageStatus(
    mid: string,
    updateMessageDto: updateMessageStatusDto,
  ) {
    try {
      const message = await this.MessageRepo.findOne({ where: { id: mid } });

      message.status = updateMessageDto.status;

      await this.MessageRepo.save(message);

      return {
        message: 'Message updated Successfully!',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async updateMessagesSeen(crid: string, sid: string) {
    try {
      const messages = await this.MessageRepo.createQueryBuilder('m')
        .where('m.sid != :sid', { sid })
        .andWhere('m.chatroomId = :crid', { crid })
        .andWhere('m.status != :status', { status: 'seen' })
        .getMany();

      for (const msg of messages) {
        msg.status = 'seen';
      }

      await this.MessageRepo.save(messages);

      return messages;
    } catch (error: any) {
      handleError(error);
    }
  }

  async GetChatroomMessages(
    uid: string,
    crid: string,
    limit: number,
    page: number,
  ) {
    try {
      const chatRoom = await this.chatRoomRepo.findOneBy({ id: crid });
      if (!chatRoom) throw new NotFoundException('chat room not found');

      const chatroom = await this.chatRoomRepo
        .createQueryBuilder('cr')
        .select([
          'cr.id AS id',
          'cr.createdAt AS createdAt',
          'cr.updatedAt AS updatedAt',
          'cr.lastMessage AS lastMessage',
          'cr.lastMessageDate AS lastMessageDate',
          'cr.name AS name',
          `CASE WHEN user1.id = :uid THEN user2.id ELSE user1.id END AS recId`,
          `CASE WHEN user1.id = :uid THEN user2.username ELSE user1.username END AS recUsername`,
          `CASE WHEN user1.id = :uid THEN user2.firstname ELSE user1.firstname END AS recFirstname`,
          `CASE WHEN user1.id = :uid THEN user2.lastname ELSE user1.lastname END AS recLastname`,
          `CASE WHEN user1.id = :uid THEN user2.userPfpUrl ELSE user1.userPfpUrl END AS recUserPfpUrl`,
          `CASE WHEN user1.id = :uid THEN user2.isActive ELSE user1.isActive END AS recIsActive`,
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('cr.id = :crid', { uid, crid })
        .getRawOne();

      const [messages, total] = await this.MessageRepo.findAndCount({
        where: { chatRoom: { id: crid } },
        relations: { attachments: true },
        order: { createdAt: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      for (const message of messages) {
        for (const attachment of message.attachments) {
          attachment.url = await this.S3Service.getFileUrl(attachment.key);
        }
      }

      return {
        message: 'ChatRoom Messages Returned Successfully',
        code: 200,
        data: {
          totalPages: Math.ceil(total / limit),
          pageIndex: page,
          limit,
          chatRoomMessages: messages,
          chatroom,
        },
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async GetUserChatrooms(
    uid: string,
    query: string = '',
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
          WHEN user1.id = :uid THEN user2.id
          ELSE user1.id
        END AS recId`,

          `CASE
          WHEN user1.id = :uid THEN user2.username
          ELSE user1.username
        END AS recUsername`,

          `CASE
          WHEN user1.id = :uid THEN user2.firstname
          ELSE user1.firstname
        END AS recFirstname`,

          `CASE
          WHEN user1.id = :uid THEN user2.lastname
          ELSE user1.lastname
        END AS recLastname`,

          `CASE
          WHEN user1.id = :uid THEN user2.userPfpUrl
          ELSE user1.userPfpUrl
        END AS recUserPfpUrl`,

          `CASE
          WHEN user1.id = :uid THEN user2.isActive
          ELSE user1.isActive
        END AS recIsActive`,
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('(cr.user1Id = :uid OR cr.user2Id = :uid)', { uid })
        .orderBy('cr.lastMessageDate', 'DESC')
        .getRawMany();

      if (chatrooms.length === 0) {
        return {
          message: 'Successfully returned chatrooms.',
          code: 200,
          data: [],
        };
      }

      const chatroomIds = chatrooms.map((room) => room.id);

      const unreadMessages = await this.MessageRepo.find({
        where: {
          chatroomId: In(chatroomIds),
          status: 'delivered',
          sid: Not(uid),
        },
        relations: {
          sender: true,
        },
        order: {
          createdAt: 'ASC',
        },
      });

      const unreadMap = unreadMessages.reduce(
        (acc, message) => {
          if (!acc[message.chatroomId]) {
            acc[message.chatroomId] = [];
          }

          acc[message.chatroomId].push(message);

          return acc;
        },
        {} as Record<string, Message[]>,
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
        message: 'Successfully returned chatrooms.',
        code: 200,
        data: result,
      };
    } catch (error: any) {
      handleError(error);
    }
  }
  async GetChatroomInfo(uid: string, crid: string) {
    try {
      const chatRoom = await this.chatRoomRepo.findOneBy({ id: crid });
      if (!chatRoom) throw new NotFoundException('chat room not found');

      const chatroom = await this.chatRoomRepo
        .createQueryBuilder('cr')
        .select([
          'cr.id AS id',
          'cr.createdAt AS createdAt',
          'cr.updatedAt AS updatedAt',
          'cr.name AS name',
          `CASE WHEN user1.id = :uid THEN user2.id ELSE user1.id END AS recId`,
          `CASE WHEN user1.id = :uid THEN user2.username ELSE user1.username END AS recUsername`,
          `CASE WHEN user1.id = :uid THEN user2.userPfpUrl ELSE user1.userPfpUrl END AS recUserPfpUrl`,
          `CASE WHEN user1.id = :uid THEN user2.bio ELSE user1.bio END AS recBio`,
          `CASE WHEN user1.id = :uid THEN user2.isActive ELSE user1.isActive END AS recIsActive`,
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('cr.id = :crid', { uid, crid })
        .getRawOne();

      const messages = await this.MessageRepo.find({
        where: { chatRoom: { id: crid } },
        relations: { attachments: true },
        order: { createdAt: 'ASC' },
      });

      let media: { url: string; type: AttachmentType }[] = [];

      let links: { url: string; name: string }[] = [];

      for (const message of messages) {
        if (isValidUrl(message.message)) {
          const url = new URL(message.message);

          links = [
            ...links,
            { url: url.href, name: url.hostname.replace('www.', '') },
          ];
        }

        for (const attachment of message.attachments) {
          media = [
            ...media,
            {
              url: await this.S3Service.getFileUrl(attachment.key),
              type: attachment.type,
            },
          ];
        }
      }

      return {
        message: 'ChatRoom Messages Returned Successfully',
        code: 200,
        data: {
          chatroom,
          media,
          links,
        },
      };
    } catch (error: any) {
      handleError(error);
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
      const messages = await this.MessageRepo.createQueryBuilder('m')
        .innerJoin('m.chatRoom', 'cr')
        .where('(cr.user1Id = :uid OR cr.user2Id = :uid)', { uid })
        .andWhere('m.sid != :uid', { uid })
        .andWhere('m.status = :status', { status: 'sent' })
        .getMany();

      for (const msg of messages) {
        msg.status = 'delivered';
      }

      await this.MessageRepo.save(messages);

      return messages;
    } catch (error: any) {
      handleError(error);
    }
  }
}
