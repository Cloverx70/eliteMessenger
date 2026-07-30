import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('saved_posts')
@Unique(['postId', 'userId'])
@Index(['userId', 'createdAt'])
export class SavedPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @ManyToOne(() => Post, (post) => post.saves, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.savedPosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
