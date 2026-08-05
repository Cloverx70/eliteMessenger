import { ChatRoom } from '../../database/entities/chatRoom.entity';
import { Friends } from '../../database/entities/friends.entity';
import { GroupChat } from '../../database/entities/groupChat.entity';
import { GroupMember } from '../../database/entities/groupMember.entity';
import { GroupMessage } from '../../database/entities/groupMessage.entity';
import { HiddenPost } from '../../database/entities/hiddenPosts.entity';
import { Message } from '../../database/entities/message.entity';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { Post } from '../../database/entities/post.entity';
import { PostAttachment } from '../../database/entities/postAttachment.entity';
import { PostComment } from '../../database/entities/postComment.entity';
import { PostLike } from '../../database/entities/postLike.entity';
import { PostReport } from '../../database/entities/postReport.entity';
import { PostShare } from '../../database/entities/postShare.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { S3Module } from '../../utils/s3/s3.module';
import { SavedPost } from '../../database/entities/postSave.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostAttachment,
      PostLike,
      PostComment,
      SavedPost,
      PostShare,
      PostReport,
      HiddenPost,
      Friends,
      ChatRoom,
      GroupChat,
      GroupMember,
      Message,
      GroupMessage,
    ]),
    S3Module,
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
