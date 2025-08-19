import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Unique,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity'; // your User entity path
import { Message } from './message.entity';

@Entity()
@Unique(['user1', 'user2']) // ensures no duplicate room between same two users
@Index('idx_user2_user1', ['user2', 'user1'])
@Index('idx_user1_user2', ['user1', 'user2'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.chatRoomsAsUser1, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user1: User;

  @ManyToOne(() => User, (user) => user.chatRoomsAsUser2, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user2: User;

  @OneToMany(() => Message, (message) => message.chatRoom)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  name?: string;
}
