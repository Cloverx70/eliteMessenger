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
import { HiddenPost } from './hiddenPosts.entity';
import { Message } from './message.entity';
import { Post } from './post.entity';
import { PostComment } from './postComment.entity';
import { PostLike } from './postLike.entity';
import { PostReport } from './postReport.entity';
import { PostShare } from './postShare.entity';
import { SavedPost } from './postSave.entity';

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

  @Column({ type: 'enum', enum: ['google', 'local'], default: 'local' })
  accountRegisterType: 'google' | 'local';

  @Column({ type: 'boolean', default: false })
  isActive: boolean = false;

  @Column({ type: 'datetime', nullable: true })
  lastSeen: Date | null;

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

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => PostLike, (postLike) => postLike.user)
  postLikes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.author)
  postComments: PostComment[];

  @OneToMany(() => SavedPost, (savedPost) => savedPost.user)
  savedPosts: SavedPost[];

  @OneToMany(() => PostShare, (postShare) => postShare.sender)
  postShares: PostShare[];

  @OneToMany(() => PostReport, (report) => report.reporter)
  postReports: PostReport[];

  @OneToMany(() => HiddenPost, (hiddenPost) => hiddenPost.user)
  hiddenPosts: HiddenPost[];

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
