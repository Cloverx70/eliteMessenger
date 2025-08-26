import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import MessageDto from './dtos/message.dto';
import { ChatRoom } from 'src/database/entities/chatRoom.entity';
import { handleError } from 'src/utils/handleError.util';
import { Message } from 'src/database/entities/message.entity';
import { ChatRoomDto } from './dtos/chatroom.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepo: Repository<ChatRoom>,
    @InjectRepository(Message)
    private readonly MessageRepo: Repository<Message>,
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
    } catch (error) {
      handleError(error);
    }
  }

  async SendMessage(crid: string, messageDto: MessageDto) {
    try {
      const chatRoom = await this.chatRoomRepo.findOneBy({ id: crid });

      if (!chatRoom) {
        throw new NotFoundException('chat room not found');
      }

      const newMessage = this.MessageRepo.create({
        sid: messageDto.sid,
        chatroomId: chatRoom.id,
        message: messageDto.text,
      });

      await this.MessageRepo.save(newMessage);

      return { message: 'Message Sent Successfully', code: 200 };
    } catch (error) {
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
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('cr.id = :crid', { uid, crid })
        .getRawOne();

      const [messages, total] = await this.MessageRepo.findAndCount({
        where: { chatRoom },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

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
    } catch (error) {
      handleError(error);
    }
  }

  async GetUserChatrooms(uid: string) {
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
          `CASE WHEN user1.id = :uid THEN user2.id ELSE user1.id END AS recId`,
          `CASE WHEN user1.id = :uid THEN user2.username ELSE user1.username END AS recUsername`,
          `CASE WHEN user1.id = :uid THEN user2.firstname ELSE user1.firstname END AS recFirstname`,
          `CASE WHEN user1.id = :uid THEN user2.lastname ELSE user1.lastname END AS recLastname`,
          `CASE WHEN user1.id = :uid THEN user2.userPfpUrl ELSE user1.userPfpUrl END AS recUserPfpUrl`,
        ])
        .innerJoin('cr.user1', 'user1')
        .innerJoin('cr.user2', 'user2')
        .where('cr.user1Id = :uid OR cr.user2Id = :uid', { uid })
        .getRawMany();

      console.log(chatrooms);
      return {
        message: 'successfully returned chatrooms.',
        code: 200,
        data: chatrooms,
      };
    } catch (error) {
      handleError(error);
    }
  }
}
