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

  async CreateChatRoom(chatRoomDto: ChatRoomDto) {
    try {
      const user1 = await this.userRepo.findOneBy({ id: chatRoomDto.uid1 });
      if (!user1) throw new NotFoundException('user1 not found');

      const user2 = await this.userRepo.findOneBy({ id: chatRoomDto.uid2 });
      if (!user2) throw new NotFoundException('user1 not found');

      const chatroomExists = await this.chatRoomRepo.findOne({
        where: [
          { user1: user1, user2: user2 },
          { user1: user2, user2: user1 },
        ],
      });
      if (chatroomExists)
        throw new BadRequestException('chatroom already exists');

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

      const sender = await this.userRepo.findOneBy({ id: messageDto.sid });
      const receiver = await this.userRepo.findOneBy({ id: messageDto.rid });

      if (!sender) throw new NotFoundException('sender not found');

      if (!receiver) throw new NotFoundException('receiver not found');

      const newMessage = this.MessageRepo.create({
        sender: sender,
        chatRoom: chatRoom,
        message: messageDto.text,
      });

      await this.MessageRepo.save(newMessage);

      return { message: 'Message Sent Successfully', code: 200 };
    } catch (error) {
      handleError(error);
    }
  }

  async GetChatroomMessages(crid: string, limit: number, page: number) {
    try {
      const chatRoom = await this.chatRoomRepo.findOneBy({ id: crid });
      if (!chatRoom) throw new NotFoundException('chat room not found');

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
        },
      };
    } catch (error) {
      handleError(error);
    }
  }
}
