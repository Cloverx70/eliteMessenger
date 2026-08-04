import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';

import { ChatRoom } from '../../database/entities/chatRoom.entity';
import { Friends, FriendStatus } from '../../database/entities/friends.entity';
import { GroupChat } from '../../database/entities/groupChat.entity';
import { GroupMember } from '../../database/entities/groupMember.entity';
import { GroupMessage } from '../../database/entities/groupMessage.entity';
import { HiddenPost } from '../../database/entities/hiddenPosts.entity';
import { Message } from '../../database/entities/message.entity';
import { Post, PostVisibility } from '../../database/entities/post.entity';
import {
  PostAttachment,
  PostAttachmentType,
} from '../../database/entities/postAttachment.entity';
import { PostComment } from '../../database/entities/postComment.entity';
import { PostLike } from '../../database/entities/postLike.entity';
import { PostReport } from '../../database/entities/postReport.entity';
import { SavedPost } from '../../database/entities/postSave.entity';
import {
  PostShare,
  PostShareTarget,
} from '../../database/entities/postShare.entity';

import { FeedResponse, PostResponse } from './posts.types';
import { S3Service } from '../../utils/s3/s3.service';
import { CreatePostCommentDto, UpdatePostCommentDto } from './dtos/comment.dto';
import { CommentsQueryDto } from './dtos/comments-query.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { FeedQueryDto, DiscoverFeedTab } from './dtos/feed-query.dto';
import { ReorderPostAttachmentsDto } from './dtos/reorder-attachments.dto';
import { ReportPostDto } from './dtos/report-post.dto';
import { SharePostDto } from './dtos/share-post.dto';
import { ShareTargetQueryDto } from './dtos/share-target-query.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import {
  decodeCursor,
  TrendingFeedCursor,
  StandardFeedCursor,
  encodeCursor,
} from './helpers/cursor.helper';
import {
  getImageMetadata,
  getVideoMetadata,
} from './helpers/media-metadata.helper';
import {
  CreateNotificationCauseInput,
  NotificationCause,
  NotificationsService,
} from '../notifications/notifications.service';

interface ProcessedAttachment {
  key: string;
  type: PostAttachmentType;
  mimeType: string;
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  blurDataURL: string | null;
  displayOrder: number;
}

interface FeedRawRow {
  id: string;
  createdAt: Date | string;
  trendScore?: number | string;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostAttachment)
    private readonly attachmentRepo: Repository<PostAttachment>,
    @InjectRepository(PostLike)
    private readonly likeRepo: Repository<PostLike>,
    @InjectRepository(PostComment)
    private readonly commentRepo: Repository<PostComment>,
    @InjectRepository(SavedPost)
    private readonly savedPostRepo: Repository<SavedPost>,
    @InjectRepository(PostReport)
    private readonly reportRepo: Repository<PostReport>,
    @InjectRepository(HiddenPost)
    private readonly hiddenPostRepo: Repository<HiddenPost>,
    @InjectRepository(Friends)
    private readonly friendsRepo: Repository<Friends>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepo: Repository<ChatRoom>,
    @InjectRepository(GroupChat)
    private readonly groupChatRepo: Repository<GroupChat>,
    private readonly dataSource: DataSource,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationsService,
  ) {}

  async createPost(
    authorId: string,
    dto: CreatePostDto,
    files: Express.Multer.File[] = [],
  ): Promise<{ message: string; code: number; data: PostResponse }> {
    const caption = dto.caption?.trim() || null;

    if (!caption && files.length === 0) {
      throw new BadRequestException(
        'A post must contain a caption or at least one attachment.',
      );
    }

    const uploadedAttachments = await this.processUploads(files);
    const uploadedKeys = uploadedAttachments.map((item) => item.key);

    try {
      const postId = await this.dataSource.transaction(async (manager) => {
        const postRepo = manager.getRepository(Post);
        const attachmentRepo = manager.getRepository(PostAttachment);

        const savedPost = await postRepo.save(
          postRepo.create({
            authorId,
            caption,
            visibility: dto.visibility ?? PostVisibility.PUBLIC,
            commentsEnabled: dto.commentsEnabled ?? true,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
          }),
        );

        if (uploadedAttachments.length > 0) {
          await attachmentRepo.save(
            uploadedAttachments.map((attachment) =>
              attachmentRepo.create({
                postId: savedPost.id,
                ...attachment,
              }),
            ),
          );
        }

        return savedPost.id;
      });

      return {
        message: 'Post created successfully.',
        code: 201,
        data: await this.getPostById(authorId, postId),
      };
    } catch (error) {
      await this.deleteS3Keys(uploadedKeys);
      throw error;
    }
  }

  async getFeed(userId: string, query: FeedQueryDto): Promise<FeedResponse> {
    const limit = query.limit ?? 15;
    const tab = query.tab ?? DiscoverFeedTab.FOR_YOU;
    const trendExpression =
      '(post.likeCount * 3 + post.commentCount * 2 + post.shareCount * 4)';

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .select('post.id', 'id')
      .addSelect('post.createdAt', 'createdAt')
      .where(
        `NOT EXISTS (
          SELECT 1
          FROM hidden_posts hidden
          WHERE hidden.postId = post.id
            AND hidden.userId = :userId
        )`,
        { userId },
      );

    const friendshipExists = `EXISTS (
      SELECT 1
      FROM friends friendship
      WHERE friendship.status = :acceptedStatus
        AND (
          (friendship.user1Id = post.authorId AND friendship.user2Id = :userId)
          OR
          (friendship.user2Id = post.authorId AND friendship.user1Id = :userId)
        )
    )`;

    const visibleToViewer = new Brackets((visibilityQb) => {
      visibilityQb
        .where('post.authorId = :userId', { userId })
        .orWhere('post.visibility = :publicVisibility', {
          publicVisibility: PostVisibility.PUBLIC,
        })
        .orWhere(
          new Brackets((friendsQb) => {
            friendsQb
              .where('post.visibility = :friendsVisibility', {
                friendsVisibility: PostVisibility.FRIENDS,
              })
              .andWhere(friendshipExists);
          }),
        );
    });

    if (tab === DiscoverFeedTab.FOLLOWING) {
      qb.andWhere(friendshipExists).andWhere('post.authorId <> :userId');
    } else if (tab === DiscoverFeedTab.EXPLORE) {
      qb.andWhere('post.visibility = :publicVisibility', {
        publicVisibility: PostVisibility.PUBLIC,
      }).andWhere('post.authorId <> :userId');
    } else {
      qb.andWhere(visibleToViewer);
    }

    qb.setParameter('acceptedStatus', FriendStatus.ACCEPTED);

    if (query.search) {
      qb.andWhere(
        new Brackets((searchQb) => {
          searchQb
            .where('LOWER(post.caption) LIKE :search')
            .orWhere('LOWER(author.username) LIKE :search')
            .orWhere('LOWER(author.firstname) LIKE :search')
            .orWhere('LOWER(author.lastname) LIKE :search')
            .orWhere(
              "LOWER(CONCAT(author.firstname, ' ', author.lastname)) LIKE :search",
            );
        }),
      ).setParameter('search', `%${query.search.toLowerCase()}%`);
    }

    if (query.mediaType) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM post_attachments media
          WHERE media.postId = post.id
            AND media.type = :mediaType
        )`,
        { mediaType: query.mediaType },
      );
    }

    if (tab === DiscoverFeedTab.TRENDING) {
      qb.addSelect(trendExpression, 'trendScore');

      const cursor = decodeCursor<TrendingFeedCursor>(query.cursor);
      if (cursor) {
        qb.andWhere(
          `(
            ${trendExpression} < :cursorScore
            OR (
              ${trendExpression} = :cursorScore
              AND (
                post.createdAt < :cursorDate
                OR (post.createdAt = :cursorDate AND post.id < :cursorId)
              )
            )
          )`,
          {
            cursorScore: cursor.score,
            cursorDate: new Date(cursor.createdAt),
            cursorId: cursor.id,
          },
        );
      }

      qb.orderBy('trendScore', 'DESC')
        .addOrderBy('post.createdAt', 'DESC')
        .addOrderBy('post.id', 'DESC');
    } else {
      const cursor = decodeCursor<StandardFeedCursor>(query.cursor);
      if (cursor) {
        qb.andWhere(
          `(
            post.createdAt < :cursorDate
            OR (post.createdAt = :cursorDate AND post.id < :cursorId)
          )`,
          {
            cursorDate: new Date(cursor.createdAt),
            cursorId: cursor.id,
          },
        );
      }

      qb.orderBy('post.createdAt', 'DESC').addOrderBy('post.id', 'DESC');
    }

    const rawRows = await qb.take(limit + 1).getRawMany<FeedRawRow>();
    const hasNextPage = rawRows.length > limit;
    const pageRows = hasNextPage ? rawRows.slice(0, limit) : rawRows;
    const ids = pageRows.map((row) => row.id);

    const posts = await this.loadPostsByIds(ids);
    const items = await this.serializePosts(posts, userId, ids);

    const lastRow = pageRows.at(-1);
    let nextCursor: string | null = null;

    if (hasNextPage && lastRow) {
      if (tab === DiscoverFeedTab.TRENDING) {
        nextCursor = encodeCursor({
          score: Number(lastRow.trendScore ?? 0),
          createdAt: new Date(lastRow.createdAt).toISOString(),
          id: lastRow.id,
        } satisfies TrendingFeedCursor);
      } else {
        nextCursor = encodeCursor({
          createdAt: new Date(lastRow.createdAt).toISOString(),
          id: lastRow.id,
        } satisfies StandardFeedCursor);
      }
    }

    return { items, nextCursor };
  }

  async getPostById(userId: string, postId: string): Promise<PostResponse> {
    const post = await this.loadPost(postId);
    await this.assertCanViewPost(userId, post);

    const [result] = await this.serializePosts([post], userId, [post.id]);
    return result;
  }

  async updatePost(
    userId: string,
    postId: string,
    dto: UpdatePostDto,
    isAdmin = false,
  ): Promise<PostResponse> {
    const post = await this.loadPost(postId);
    this.assertOwner(post, userId, isAdmin);

    const nextCaption =
      dto.caption !== undefined ? dto.caption?.trim() || null : post.caption;

    if (!nextCaption && post.attachments.length === 0) {
      throw new BadRequestException(
        'A post must contain a caption or at least one attachment.',
      );
    }

    post.caption = nextCaption;
    if (dto.visibility !== undefined) post.visibility = dto.visibility;
    if (dto.commentsEnabled !== undefined) {
      post.commentsEnabled = dto.commentsEnabled;
    }

    await this.postRepo.save(post);
    return this.getPostById(userId, postId);
  }

  async deletePost(
    userId: string,
    postId: string,
    isAdmin = false,
  ): Promise<{ message: string; code: number }> {
    const post = await this.loadPost(postId);
    this.assertOwner(post, userId, isAdmin);
    const keys = post.attachments.map((attachment) => attachment.key);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Post).delete(postId);
    });

    await this.deleteS3Keys(keys);
    return { message: 'Post deleted successfully.', code: 200 };
  }

  async deleteAttachment(
    userId: string,
    postId: string,
    attachmentId: string,
    isAdmin = false,
  ): Promise<PostResponse> {
    const post = await this.loadPost(postId);
    this.assertOwner(post, userId, isAdmin);

    const attachment = post.attachments.find(
      (item) => item.id === attachmentId,
    );
    if (!attachment) throw new NotFoundException('Attachment was not found.');

    if (!post.caption && post.attachments.length === 1) {
      throw new BadRequestException(
        'A post must contain a caption or at least one attachment.',
      );
    }

    await this.attachmentRepo.delete({ id: attachmentId, postId });
    await this.deleteS3Keys([attachment.key]);
    return this.getPostById(userId, postId);
  }

  async reorderAttachments(
    userId: string,
    postId: string,
    dto: ReorderPostAttachmentsDto,
    isAdmin = false,
  ): Promise<PostResponse> {
    const post = await this.loadPost(postId);
    this.assertOwner(post, userId, isAdmin);

    const currentIds = new Set(post.attachments.map((item) => item.id));
    const requestedIds = new Set(dto.attachmentIds);

    if (
      currentIds.size !== requestedIds.size ||
      dto.attachmentIds.some((id) => !currentIds.has(id))
    ) {
      throw new BadRequestException(
        'attachmentIds must contain every attachment exactly once.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PostAttachment);
      await Promise.all(
        dto.attachmentIds.map((id, displayOrder) =>
          repo.update({ id, postId }, { displayOrder }),
        ),
      );
    });

    return this.getPostById(userId, postId);
  }

  async setLike(
    userId: string,
    postId: string,
    liked: boolean,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const post = await this.loadPost(postId);
    await this.assertCanViewPost(userId, post);

    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const likeRepo = manager.getRepository(PostLike);

      const lockedPost = await postRepo.findOne({
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedPost) throw new NotFoundException('Post was not found.');

      const existing = await likeRepo.findOne({
        where: { postId, userId },
      });

      if (liked && !existing) {
        await likeRepo.save(likeRepo.create({ postId, userId }));
        lockedPost.likeCount += 1;
        await postRepo.save(lockedPost);
      }

      if (!liked && existing) {
        await likeRepo.remove(existing);
        lockedPost.likeCount = Math.max(0, lockedPost.likeCount - 1);
        await postRepo.save(lockedPost);
      }

      const postLikedNotification: CreateNotificationCauseInput = {
        cause: NotificationCause.POST_LIKED,
        actorId: userId,
        recipientId: lockedPost.authorId,
        postId: postId,
        postPreview: lockedPost.caption,
      };

      await this.notificationService.createFromCause(postLikedNotification);

      return { liked, likeCount: lockedPost.likeCount };
    });
  }

  async setSaved(
    userId: string,
    postId: string,
    saved: boolean,
  ): Promise<{ saved: boolean }> {
    const post = await this.loadPost(postId);
    await this.assertCanViewPost(userId, post);

    const existing = await this.savedPostRepo.findOne({
      where: { postId, userId },
    });

    if (saved && !existing) {
      await this.savedPostRepo.save(
        this.savedPostRepo.create({ postId, userId }),
      );
    }

    if (!saved && existing) {
      await this.savedPostRepo.remove(existing);
    }

    return { saved };
  }

  async getComments(userId: string, postId: string, query: CommentsQueryDto) {
    const post = await this.loadPost(postId);
    await this.assertCanViewPost(userId, post);

    const cursor = decodeCursor<StandardFeedCursor>(query.cursor);
    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.postId = :postId', { postId })
      .select([
        'comment.id',
        'comment.postId',
        'comment.authorId',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'author.id',
        'author.username',
        'author.firstname',
        'author.lastname',
        'author.userPfpUrl',
      ]);

    if (cursor) {
      qb.andWhere(
        `(
          comment.createdAt < :cursorDate
          OR (comment.createdAt = :cursorDate AND comment.id < :cursorId)
        )`,
        {
          cursorDate: new Date(cursor.createdAt),
          cursorId: cursor.id,
        },
      );
    }

    const limit = query.limit ?? 20;
    const comments = await qb
      .orderBy('comment.createdAt', 'DESC')
      .addOrderBy('comment.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasNextPage = comments.length > limit;
    const items = hasNextPage ? comments.slice(0, limit) : comments;
    const last = items.at(-1);

    return {
      items: items.map((comment) => ({
        ...comment,
        viewer: {
          isAuthor: comment.authorId === userId,
        },
      })),
      nextCursor:
        hasNextPage && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            } satisfies StandardFeedCursor)
          : null,
    };
  }

  async createComment(
    userId: string,
    postId: string,
    dto: CreatePostCommentDto,
  ) {
    const post = await this.loadPost(postId);
    await this.assertCanViewPost(userId, post);

    if (!post.commentsEnabled) {
      throw new ForbiddenException('Comments are disabled for this post.');
    }

    const content = dto.content.trim();
    if (!content) throw new BadRequestException('Comment cannot be empty.');

    const commentId = await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(PostComment);
      const postRepo = manager.getRepository(Post);

      const comment = await commentRepo.save(
        commentRepo.create({ postId, authorId: userId, content }),
      );

      await postRepo.increment({ id: postId }, 'commentCount', 1);

      return comment.id;
    });

    const postCommentedNotification: CreateNotificationCauseInput = {
      cause: NotificationCause.POST_COMMENTED,
      actorId: userId,
      recipientId: post.authorId,
      postId: postId,
      commentId: commentId,
      commentContent: dto.content,
    };

    await this.notificationService.createFromCause(postCommentedNotification);

    return this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.id = :commentId', { commentId })
      .select([
        'comment.id',
        'comment.postId',
        'comment.authorId',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'author.id',
        'author.username',
        'author.firstname',
        'author.lastname',
        'author.userPfpUrl',
      ])
      .getOneOrFail();
  }

  async updateComment(
    userId: string,
    postId: string,
    commentId: string,
    dto: UpdatePostCommentDto,
    isAdmin = false,
  ) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, postId },
    });
    if (!comment) throw new NotFoundException('Comment was not found.');

    if (comment.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You cannot edit this comment.');
    }

    const content = dto.content.trim();
    if (!content) throw new BadRequestException('Comment cannot be empty.');

    comment.content = content;
    await this.commentRepo.save(comment);
    return this.createCommentResponse(commentId, userId);
  }

  async deleteComment(
    userId: string,
    postId: string,
    commentId: string,
    isAdmin = false,
  ): Promise<{ message: string; code: number }> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, postId },
    });
    if (!comment) throw new NotFoundException('Comment was not found.');

    if (comment.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You cannot delete this comment.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(PostComment).softDelete(commentId);
      await manager
        .getRepository(Post)
        .createQueryBuilder()
        .update(Post)
        .set({ commentCount: () => 'GREATEST(commentCount - 1, 0)' })
        .where('id = :postId', { postId })
        .execute();
    });

    return { message: 'Comment deleted successfully.', code: 200 };
  }

  async sharePost(userId: string, postId: string, dto: SharePostDto) {
    const post = await this.loadPost(postId);
    await this.assertCanViewPost(userId, post);

    return this.dataSource.transaction(async (manager) => {
      const shareRepo = manager.getRepository(PostShare);
      const postRepo = manager.getRepository(Post);

      let messageId: string;

      if (dto.targetType === PostShareTarget.CHAT) {
        const chat = await manager.getRepository(ChatRoom).findOne({
          where: [
            { id: dto.targetId, user1Id: userId },
            { id: dto.targetId, user2Id: userId },
          ],
        });
        if (!chat) throw new ForbiddenException('Chat is not accessible.');

        const message = await manager.getRepository(Message).save(
          manager.getRepository(Message).create({
            message: 'Shared a post',
            chatroomId: chat.id,
            sid: userId,
            status: 'sent',
            sharedPostId: postId,
          }),
        );
        messageId = message.id;

        await manager.getRepository(ChatRoom).update(chat.id, {
          lastMessage: 'Shared a post',
          lastMessageDate: new Date(),
        });
      } else {
        const membership = await manager.getRepository(GroupMember).findOne({
          where: { groupId: dto.targetId, userId },
        });
        if (!membership) {
          throw new ForbiddenException('Group chat is not accessible.');
        }

        const message = await manager.getRepository(GroupMessage).save(
          manager.getRepository(GroupMessage).create({
            message: 'Shared a post',
            groupId: dto.targetId,
            senderId: userId,
            sharedPostId: postId,
          }),
        );
        messageId = message.id;

        await manager.getRepository(GroupChat).update(dto.targetId, {
          lastMessage: 'Shared a post',
          lastMessageDate: new Date(),
          lastMessageSenderId: userId,
        });
      }

      const share = await shareRepo.save(
        shareRepo.create({
          postId,
          senderId: userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
        }),
      );

      await postRepo.increment({ id: postId }, 'shareCount', 1);

      const postSharedNotification: CreateNotificationCauseInput = {
        cause: NotificationCause.POST_SHARED,

        // User who shared the post
        actorId: userId,

        // Owner of the post
        recipientId: post.authorId,

        postId: postId,

        postPreview: post.caption,
      };

      await this.notificationService.createFromCause(postSharedNotification);

      return {
        message: 'Post shared successfully.',
        code: 201,
        data: { shareId: share.id, messageId },
      };
    });
  }

  async reportPost(userId: string, postId: string, dto: ReportPostDto) {
    const post = await this.loadPost(postId);
    await this.assertCanViewPost(userId, post);

    if (post.authorId === userId) {
      throw new BadRequestException('You cannot report your own post.');
    }

    const existing = await this.reportRepo.findOne({
      where: { postId, reporterId: userId },
    });

    if (existing) {
      existing.reason = dto.reason;
      existing.details = dto.details?.trim() || null;
      await this.reportRepo.save(existing);
      return { message: 'Report updated successfully.', code: 200 };
    }

    await this.reportRepo.save(
      this.reportRepo.create({
        postId,
        reporterId: userId,
        reason: dto.reason,
        details: dto.details?.trim() || null,
      }),
    );

    return { message: 'Post reported successfully.', code: 201 };
  }

  async setHidden(userId: string, postId: string, hidden: boolean) {
    const post = await this.loadPost(postId);

    if (post.authorId === userId) {
      throw new BadRequestException('You cannot hide your own post.');
    }

    const existing = await this.hiddenPostRepo.findOne({
      where: { postId, userId },
    });

    if (hidden && !existing) {
      await this.hiddenPostRepo.save(
        this.hiddenPostRepo.create({ postId, userId }),
      );
    }

    if (!hidden && existing) {
      await this.hiddenPostRepo.remove(existing);
    }

    return { hidden };
  }

  async getShareTargets(userId: string, query: ShareTargetQueryDto) {
    const search = query.search?.toLowerCase();

    const chatsQb = this.chatRoomRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.user1', 'user1')
      .leftJoinAndSelect('chat.user2', 'user2')
      .where('chat.user1Id = :userId OR chat.user2Id = :userId', { userId });

    if (search) {
      chatsQb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user1.username) LIKE :search')
            .orWhere('LOWER(user2.username) LIKE :search')
            .orWhere('LOWER(user1.firstname) LIKE :search')
            .orWhere('LOWER(user2.firstname) LIKE :search')
            .orWhere('LOWER(user1.lastname) LIKE :search')
            .orWhere('LOWER(user2.lastname) LIKE :search');
        }),
        { search: `%${search}%` },
      );
    }

    const groupsQb = this.groupChatRepo
      .createQueryBuilder('group')
      .innerJoin('group.members', 'member', 'member.userId = :userId', {
        userId,
      });

    if (search) {
      groupsQb.andWhere('LOWER(group.name) LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [chats, groups] = await Promise.all([
      chatsQb.take(30).getMany(),
      groupsQb.take(30).getMany(),
    ]);

    return {
      chats: chats.map((chat) => {
        const peer = chat.user1Id === userId ? chat.user2 : chat.user1;
        return {
          id: chat.id,
          type: PostShareTarget.CHAT,
          name: `${peer.firstname} ${peer.lastname}`.trim() || peer.username,
          username: peer.username,
          imageUrl: peer.userPfpUrl ?? null,
        };
      }),
      groups: groups.map((group) => ({
        id: group.id,
        type: PostShareTarget.GROUPCHAT,
        name: group.name,
        username: null,
        imageUrl: group.imageUrl ?? null,
      })),
    };
  }

  private async processUploads(
    files: Express.Multer.File[],
  ): Promise<ProcessedAttachment[]> {
    if (files.length === 0) return [];

    const tasks = files.map(async (file, displayOrder) => {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (!isImage && !isVideo) {
        throw new BadRequestException(
          `Unsupported attachment type: ${file.originalname}`,
        );
      }

      const imageMetadata = isImage ? await getImageMetadata(file) : null;
      const videoMetadata = isVideo ? await getVideoMetadata(file) : null;
      const key = await this.s3Service.uploadFile(file, 'posts');

      return {
        key,
        type: isImage ? PostAttachmentType.IMAGE : PostAttachmentType.VIDEO,
        mimeType: file.mimetype,
        filename: file.originalname,
        size: file.size,
        width: imageMetadata?.width ?? videoMetadata?.width ?? null,
        height: imageMetadata?.height ?? videoMetadata?.height ?? null,
        duration: videoMetadata?.duration ?? null,
        blurDataURL: imageMetadata?.blurDataURL ?? null,
        displayOrder,
      } satisfies ProcessedAttachment;
    });

    const results = await Promise.allSettled(tasks);
    const uploaded = results
      .filter(
        (result): result is PromiseFulfilledResult<ProcessedAttachment> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);

    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failure) {
      await this.deleteS3Keys(uploaded.map((item) => item.key));
      throw failure.reason;
    }

    return uploaded.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  private async loadPost(postId: string): Promise<Post> {
    const post = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.attachments', 'attachment')
      .where('post.id = :postId', { postId })
      .select([
        'post',
        'author.id',
        'author.username',
        'author.firstname',
        'author.lastname',
        'author.userPfpUrl',
        'attachment',
      ])
      .orderBy('attachment.displayOrder', 'ASC')
      .getOne();

    if (!post) throw new NotFoundException('Post was not found.');
    return post;
  }

  private async loadPostsByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) return [];

    return this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.attachments', 'attachment')
      .where('post.id IN (:...ids)', { ids })
      .select([
        'post',
        'author.id',
        'author.username',
        'author.firstname',
        'author.lastname',
        'author.userPfpUrl',
        'attachment',
      ])
      .orderBy('attachment.displayOrder', 'ASC')
      .getMany();
  }

  private async serializePosts(
    posts: Post[],
    viewerId: string,
    order: string[],
  ): Promise<PostResponse[]> {
    if (posts.length === 0) return [];

    const postIds = posts.map((post) => post.id);
    const [likes, saves] = await Promise.all([
      this.likeRepo.find({ where: { userId: viewerId, postId: In(postIds) } }),
      this.savedPostRepo.find({
        where: { userId: viewerId, postId: In(postIds) },
      }),
    ]);

    const likedIds = new Set(likes.map((like) => like.postId));
    const savedIds = new Set(saves.map((save) => save.postId));

    const serialized = await Promise.all(
      posts.map(async (post): Promise<PostResponse> => {
        if (post.author.userPfpUrl) {
          const pfpurl = await this.s3Service.getFileUrl(
            post.author.userPfpUrl,
          );

          post.author.userPfpUrl = pfpurl.url;
        }

        const attachments = await Promise.all(
          [...post.attachments]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(async (attachment) => {
              const signed = await this.s3Service.getFileUrl(attachment.key);
              return {
                id: attachment.id,
                type: attachment.type,
                mimeType: attachment.mimeType,
                filename: attachment.filename,
                size: attachment.size,
                width: attachment.width,
                height: attachment.height,
                duration: attachment.duration,
                displayOrder: attachment.displayOrder,
                blurDataURL: attachment.blurDataURL,
                url: signed.url,
                createdAt: attachment.createdAt,
              };
            }),
        );

        return {
          id: post.id,
          authorId: post.authorId,
          author: {
            id: post.author.id,
            username: post.author.username,
            firstname: post.author.firstname,
            lastname: post.author.lastname,
            userPfpUrl: post.author.userPfpUrl ?? null,
          },
          caption: post.caption,
          visibility: post.visibility,
          commentsEnabled: post.commentsEnabled,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          shareCount: post.shareCount,
          attachments,
          viewer: {
            liked: likedIds.has(post.id),
            saved: savedIds.has(post.id),
            isAuthor: post.authorId === viewerId,
          },
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      }),
    );

    const byId = new Map(serialized.map((post) => [post.id, post]));
    return order.map((id) => byId.get(id)).filter(Boolean) as PostResponse[];
  }

  private async assertCanViewPost(userId: string, post: Post): Promise<void> {
    const hidden = await this.hiddenPostRepo.exists({
      where: { postId: post.id, userId },
    });
    if (hidden) throw new NotFoundException('Post was not found.');

    if (post.authorId === userId || post.visibility === PostVisibility.PUBLIC) {
      return;
    }

    const friends = await this.friendsRepo
      .createQueryBuilder('friend')
      .where('friend.status = :status', { status: FriendStatus.ACCEPTED })
      .andWhere(
        `(
          (friend.user1Id = :userId AND friend.user2Id = :authorId)
          OR
          (friend.user2Id = :userId AND friend.user1Id = :authorId)
        )`,
        { userId, authorId: post.authorId },
      )
      .getExists();

    if (!friends) throw new NotFoundException('Post was not found.');
  }

  private assertOwner(post: Post, userId: string, isAdmin: boolean): void {
    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You cannot modify this post.');
    }
  }

  private async createCommentResponse(commentId: string, viewerId: string) {
    const comment = await this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.id = :commentId', { commentId })
      .select([
        'comment.id',
        'comment.postId',
        'comment.authorId',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'author.id',
        'author.username',
        'author.firstname',
        'author.lastname',
        'author.userPfpUrl',
      ])
      .getOne();

    if (!comment) throw new NotFoundException('Comment was not found.');
    return {
      ...comment,
      viewer: { isAuthor: comment.authorId === viewerId },
    };
  }

  private async deleteS3Keys(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await Promise.allSettled(keys.map((key) => this.s3Service.deleteFile(key)));
  }
}
