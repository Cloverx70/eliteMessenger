import { GroupMessageAttachment } from '../../database/entities/groupMessageAttachment.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MessageAttachment } from '../../database/entities/messageAttachment.entity';
import { Module } from '@nestjs/common';
import { S3Module } from '../../utils/s3/s3.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageAttachment, GroupMessageAttachment]),
    S3Module,
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
