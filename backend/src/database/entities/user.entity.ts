import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ChatRoom } from './chatRoom.entity';
import { Friends } from './friends.entity';
import { GroupChat } from './groupChat.entity';
import { GroupMember } from './groupMember.entity';
import { GroupMessage } from './groupMessage.entity';
import { GroupMessageReceipt } from './groupMessageReceipt.entity';
import { Message } from './message.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  userPfpUrl: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  bio: string;

  @Column({ type: 'varchar' })
  firstname: string;

  @Column({ type: 'varchar' })
  lastname: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'int', default: 0 })
  resetPasswordNb: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  failLoginAttempts: number = 0;

  @Column({ type: 'enum', enum: ['google', 'local'] })
  accountRegisterType: 'google' | 'local';

  @Column({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Column({ nullable: true })
  lastSeen: Date;

  @Column({ type: 'boolean', default: false })
  isAccountLocked: boolean = false;

  @Column({ type: 'date', nullable: true })
  accountLockedAtDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'date', nullable: true })
  lastLoggedAt: Date;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean = false;

  @OneToMany(() => Friends, (friend) => friend.user1, { onDelete: 'CASCADE' })
  sentRequests: Friends[];

  @OneToMany(() => Friends, (friend) => friend.user2, { onDelete: 'CASCADE' })
  receivedRequests: Friends[];

  @OneToMany(() => ChatRoom, (room) => room.user1)
  chatRoomsAsUser1: ChatRoom[];

  @OneToMany(() => ChatRoom, (room) => room.user2)
  chatRoomsAsUser2: ChatRoom[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => GroupChat, (group) => group.creator)
  createdGroups: GroupChat[];

  @OneToMany(() => GroupMember, (membership) => membership.user)
  groupMemberships: GroupMember[];

  @OneToMany(() => GroupMessage, (message) => message.sender)
  groupMessages: GroupMessage[];

  @OneToMany(() => GroupMessageReceipt, (receipt) => receipt.user)
  groupMessageReceipts: GroupMessageReceipt[];
}
