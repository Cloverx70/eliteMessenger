import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Friends } from '../../database/entities/friends.entity';
import { GroupChat } from '../../database/entities/groupChat.entity';
import { GroupMember } from '../../database/entities/groupMember.entity';
import { Post } from '../../database/entities/post.entity';
import { PostAttachment } from '../../database/entities/postAttachment.entity';
import { PostComment } from '../../database/entities/postComment.entity';
import { PostLike } from '../../database/entities/postLike.entity';
import { User } from '../../database/entities/user.entity';
import { S3Module } from '../../utils/s3/s3.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Friends,
      Post,
      PostAttachment,
      PostLike,
      PostComment,
      GroupMember,
      GroupChat,
    ]),
    S3Module,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
