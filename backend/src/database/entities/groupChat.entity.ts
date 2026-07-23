import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { GroupMember } from './groupMember.entity';
import { GroupMessage } from './groupMessage.entity';
import { User } from './user.entity';

@Entity('group_chat')
@Index('idx_group_chat_last_message_date', ['lastMessageDate'])
export class GroupChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl?: string | null;

  @ManyToOne(() => User, (user) => user.createdGroups, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'creatorId' })
  creator?: User | null;

  @Column('uuid', { nullable: true })
  creatorId?: string | null;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @OneToMany(() => GroupMessage, (message) => message.group)
  messages: GroupMessage[];

  @Column({ type: 'text', nullable: true })
  lastMessage?: string | null;

  @Column({ nullable: true })
  lastMessageDate?: Date | null;

  @Column('uuid', { nullable: true })
  lastMessageSenderId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
