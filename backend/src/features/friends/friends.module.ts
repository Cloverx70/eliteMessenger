import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Friends } from 'src/database/entities/friends.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friends])],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
