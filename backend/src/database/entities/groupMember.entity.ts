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

import { GroupChat } from './groupChat.entity';
import { User } from './user.entity';

export enum GroupMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity('group_member')
@Unique('uq_group_member_group_user', ['groupId', 'userId'])
@Index('idx_group_member_user', ['userId'])
@Index('idx_group_member_group', ['groupId'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GroupChat, (group) => group.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: GroupChat;

  @Column('uuid')
  groupId: string;

  @ManyToOne(() => User, (user) => user.groupMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role: GroupMemberRole;

  @CreateDateColumn()
  joinedAt: Date;
}
