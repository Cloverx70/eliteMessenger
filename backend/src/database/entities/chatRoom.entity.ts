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
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity'; // your User entity path
import { Message } from './message.entity';

@Entity()
@Unique(['user1', 'user2']) // ensures no duplicate room between same two users
@Index('idx_user2_user1', ['user2Id', 'user1Id'])
@Index('idx_user1_user2', ['user1Id', 'user2Id'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.chatRoomsAsUser1, {
    eager: true,
  })
  @JoinColumn({ name: 'user1Id' })
  user1: User;

  @Column('uuid')
  user1Id: string;

  @ManyToOne(() => User, (user) => user.chatRoomsAsUser2, {
    eager: true,
  })
  @JoinColumn({ name: 'user2Id' })
  user2: User;

  @Column('uuid')
  user2Id: string;

  @OneToMany(() => Message, (message) => message.chatRoom)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  lastMessage: string;

  @Column({ nullable: true })
  lastMessageDate: Date;

  @Column({ nullable: true })
  name?: string;
}
