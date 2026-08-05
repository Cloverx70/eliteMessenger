import { ChatModule } from '../chat/chat.module';
import { Friends } from '../../database/entities/friends.entity';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { S3Module } from '../../utils/s3/s3.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    ChatModule,
    TypeOrmModule.forFeature([User, Friends]),
    NotificationsModule,
    S3Module,
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
