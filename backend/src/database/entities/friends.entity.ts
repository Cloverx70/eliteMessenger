import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FriendStatus {
  ONGOING = 'ongoing',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity('friends')
@Index('idx_user1_status', ['user1Id', 'status'])
@Index('idx_user2_status', ['user2Id', 'status'])
@Index('idx_user1_user2', ['user1Id', 'user2Id'])
@Index('idx_user2_user1', ['user2Id', 'user1Id'])
export class Friends {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sentRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1Id' })
  user1: User;

  @Column('uuid')
  user1Id: string;

  @ManyToOne(() => User, (user) => user.receivedRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user2Id' })
  user2: User;

  @Column('uuid')
  user2Id: string;

  @Column({
    type: 'enum',
    enum: FriendStatus,
    default: FriendStatus.ONGOING,
  })
  status: FriendStatus;

  @CreateDateColumn()
  ongoingDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedDate: Date | null;
}
