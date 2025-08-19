import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { handleError } from 'src/utils/handleError.util';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getUserById(id: string) {
    try {
      const user = await this.userRepo.findOne({ where: { id: id } });

      if (!user) throw new NotFoundException('user not found');

      return user;
    } catch (error) {
      handleError(error);
    }
  }
}
