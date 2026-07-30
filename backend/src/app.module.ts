import { AuthModule } from './features/auth/auth.module';
import { ChatModule } from './features/chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { FriendsModule } from './features/friends/friends.module';
import { MediaModule } from './features/media/media.module';
import { Module } from '@nestjs/common';
import { PostsModule } from './features/posts/posts.module';
import { S3Module } from './utils/s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ChatModule,
    FriendsModule,
    S3Module,
    MediaModule,
    PostsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
