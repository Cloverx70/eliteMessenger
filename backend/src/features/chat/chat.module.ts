import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRoom } from '../../database/entities/chatRoom.entity';
import { ChatService } from './chat.service';
import { GroupChat } from '../../database/entities/groupChat.entity';
import { GroupChatController } from './group-chat.controller';
import { GroupChatService } from './group-chat.service';
import { GroupMember } from '../../database/entities/groupMember.entity';
import { GroupMessage } from '../../database/entities/groupMessage.entity';
import { GroupMessageAttachment } from '../../database/entities/groupMessageAttachment.entity';
import { GroupMessageReceipt } from '../../database/entities/groupMessageReceipt.entity';
import { Message } from '../../database/entities/message.entity';
import { MessageAttachment } from '../../database/entities/messageAttachment.entity';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { Post } from '../../database/entities/post.entity';
import { S3Module } from '../../utils/s3/s3.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      Message,
      User,
      MessageAttachment,
      GroupChat,
      GroupMember,
      GroupMessage,
      GroupMessageAttachment,
      GroupMessageReceipt,
      Post,
    ]),
    S3Module,
    NotificationsModule,
  ],
  controllers: [ChatController, GroupChatController],
  providers: [ChatGateway, ChatService, GroupChatService],
  exports: [ChatService, GroupChatService],
})
export class ChatModule {}
