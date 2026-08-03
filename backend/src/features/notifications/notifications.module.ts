import { Friends } from '../../database/entities/friends.entity';
import { Module } from '@nestjs/common';
import { Notification } from '../../database/entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PostAttachment } from '../../database/entities/postAttachment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Friends, PostAttachment]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
