import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Not, Repository } from 'typeorm';

import { FriendStatus, Friends } from '../../database/entities/friends.entity';
import { GroupChat } from '../../database/entities/groupChat.entity';
import { GroupMember } from '../../database/entities/groupMember.entity';
import { Post } from '../../database/entities/post.entity';
import { PostAttachment } from '../../database/entities/postAttachment.entity';
import { PostComment } from '../../database/entities/postComment.entity';
import { PostLike } from '../../database/entities/postLike.entity';
import { User } from '../../database/entities/user.entity';
import { S3Service } from '../../utils/s3/s3.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';

export type ProfileFriendshipStatus =
  'SELF' | 'NONE' | 'OUTGOING_PENDING' | 'INCOMING_PENDING' | 'FRIENDS';

interface UploadedProfilePicture {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Friends)
    private readonly friendsRepo: Repository<Friends>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    @InjectRepository(PostAttachment)
    private readonly postAttachmentRepo: Repository<PostAttachment>,

    @InjectRepository(PostLike)
    private readonly postLikeRepo: Repository<PostLike>,

    @InjectRepository(PostComment)
    private readonly postCommentRepo: Repository<PostComment>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(GroupChat)
    private readonly groupRepo: Repository<GroupChat>,

    private readonly s3Service: S3Service,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data = await this.buildProfile(userId, user, true);

    return {
      message: 'Profile returned successfully',
      code: 200,
      data,
    };
  }

  async getProfileByUsername(viewerId: string, username: string) {
    const user = await this.userRepo.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const data = await this.buildProfile(viewerId, user, viewerId === user.id);

    return {
      message: 'Profile returned successfully',
      code: 200,
      data,
    };
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateProfileDto,
    profilePicture?: UploadedProfilePicture,
  ) {
    if (Object.keys(dto).length === 0 && !profilePicture) {
      throw new BadRequestException('No profile changes were supplied');
    }

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.username && dto.username !== user.username) {
      const usernameExists = await this.userRepo.findOne({
        where: {
          username: dto.username,
          id: Not(userId),
        },
        select: {
          id: true,
        },
      });

      if (usernameExists) {
        throw new BadRequestException('Username is already taken');
      }
    }

    let uploadedProfilePictureKey: string | null = null;

    try {
      if (profilePicture) {
        const uploaded = await this.s3Service.uploadProfilePicture(
          userId,
          profilePicture,
        );

        /*
         * This must be a permanent public
         * or CDN URL, not an expiring
         * signed URL.
         */
        user.userPfpUrl = uploaded.key;

        uploadedProfilePictureKey = uploaded.key;
      }

      if (dto.firstname !== undefined) {
        user.firstname = dto.firstname;
      }

      if (dto.lastname !== undefined) {
        user.lastname = dto.lastname;
      }

      if (dto.username !== undefined) {
        user.username = dto.username;
      }

      if (dto.bio !== undefined) {
        user.bio = dto.bio ?? '';
      }

      await this.userRepo.save(user);
    } catch (error) {
      if (uploadedProfilePictureKey) {
        await this.s3Service
          .deleteFile(uploadedProfilePictureKey)
          .catch(() => undefined);
      }

      throw error;
    }

    const result = await this.getMyProfile(userId);

    return {
      ...result,
      message: 'Profile updated successfully',
    };
  }

  private async buildProfile(
    viewerId: string,
    profileUser: User,
    isOwnProfile: boolean,
  ) {
    if (profileUser.userPfpUrl) {
      const UserPFPURL = await this.s3Service.getFileUrl(
        profileUser.userPfpUrl,
      );

      profileUser.userPfpUrl = UserPFPURL.url;
    }

    const friendshipStatus = await this.getFriendshipStatus(
      viewerId,
      profileUser.id,
    );

    const visiblePosts = await this.getVisiblePosts(
      profileUser.id,
      isOwnProfile,
      friendshipStatus === 'FRIENDS',
    );

    const [
      friendsCount,
      groupsCount,
      mediaCount,
      friendsPreview,
      groups,
      activity,
    ] = await Promise.all([
      this.getFriendsCount(profileUser.id),
      this.groupMemberRepo.count({
        where: { userId: profileUser.id },
      }),
      this.getMediaCount(profileUser.id),
      this.getFriendsPreview(viewerId, profileUser.id, isOwnProfile),
      this.getGroups(profileUser.id),
      this.getActivity(profileUser.id),
    ]);

    const posts = await Promise.all(
      visiblePosts.map((post) => this.serializePost(post)),
    );

    const media = posts
      .flatMap((post) => post.attachments)
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 6);

    return {
      user: this.safeProfileUser(profileUser, isOwnProfile),
      stats: {
        posts: await this.postRepo.count({
          where: { authorId: profileUser.id },
        }),
        friends: friendsCount,
        groups: groupsCount,
        media: mediaCount,
      },
      media,
      posts,
      friendsPreview,
      groups,
      activity,
      isOwnProfile,
      friendshipStatus,
    };
  }

  private async getVisiblePosts(
    profileUserId: string,
    isOwnProfile: boolean,
    isFriend: boolean,
  ) {
    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.attachments', 'attachment')
      .where('post.authorId = :profileUserId', {
        profileUserId,
      })
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('attachment.displayOrder', 'ASC')
      .take(10)
      .distinct(true);

    if (!isOwnProfile && !isFriend) {
      query.andWhere('post.visibility = :visibility', {
        visibility: 'PUBLIC',
      });
    }

    return query.getMany();
  }

  private async serializePost(post: Post) {
    const attachments = await Promise.all(
      [...(post.attachments ?? [])]
        .sort((first, second) => first.displayOrder - second.displayOrder)
        .map(async (attachment) => {
          const { url } = await this.s3Service.getFileUrl(attachment.key);

          return {
            id: attachment.id,
            postId: attachment.postId,
            type: attachment.type,
            url,
            blurDataURL: attachment.blurDataURL ?? null,
            filename: attachment.filename ?? null,
            createdAt: attachment.createdAt,
          };
        }),
    );

    return {
      id: post.id,
      caption: post.caption ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      attachments,
    };
  }

  private safeProfileUser(user: User, includeEmail: boolean) {
    return {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: includeEmail ? user.email : null,
      bio: user.bio?.trim() || null,
      userPfpUrl: user.userPfpUrl ?? null,
      isActive: user.isActive,
      lastSeen: user.lastSeen ?? null,
      createdAt: user.createdAt,
    };
  }

  private safePerson(user: User) {
    return {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      userPfpUrl: user.userPfpUrl ?? null,
      isActive: user.isActive,
      lastSeen: user.lastSeen ?? null,
    };
  }

  private async getFriendshipStatus(
    viewerId: string,
    profileUserId: string,
  ): Promise<ProfileFriendshipStatus> {
    if (viewerId === profileUserId) {
      return 'SELF';
    }

    const friendship = await this.friendsRepo
      .createQueryBuilder('friend')
      .where(
        `(
          friend.user1Id = :viewerId
          AND friend.user2Id = :profileUserId
        ) OR (
          friend.user1Id = :profileUserId
          AND friend.user2Id = :viewerId
        )`,
        { viewerId, profileUserId },
      )
      .getOne();

    if (!friendship) return 'NONE';
    if (friendship.status === FriendStatus.ACCEPTED) return 'FRIENDS';

    return friendship.user1Id === viewerId
      ? 'OUTGOING_PENDING'
      : 'INCOMING_PENDING';
  }

  private async getAcceptedFriendIds(userId: string) {
    const friendships = await this.friendsRepo
      .createQueryBuilder('friend')
      .select(['friend.user1Id', 'friend.user2Id'])
      .where('friend.status = :status', {
        status: FriendStatus.ACCEPTED,
      })
      .andWhere('(friend.user1Id = :userId OR friend.user2Id = :userId)', {
        userId,
      })
      .getMany();

    return friendships.map((friendship) =>
      friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id,
    );
  }

  private async getFriendsCount(userId: string) {
    return this.friendsRepo
      .createQueryBuilder('friend')
      .where('friend.status = :status', {
        status: FriendStatus.ACCEPTED,
      })
      .andWhere('(friend.user1Id = :userId OR friend.user2Id = :userId)', {
        userId,
      })
      .getCount();
  }

  private async getFriendsPreview(
    viewerId: string,
    profileUserId: string,
    isOwnProfile: boolean,
  ) {
    const profileFriendIds = await this.getAcceptedFriendIds(profileUserId);

    let visibleFriendIds = profileFriendIds;

    if (!isOwnProfile) {
      const viewerFriendIds = new Set(
        await this.getAcceptedFriendIds(viewerId),
      );

      visibleFriendIds = profileFriendIds.filter((id) =>
        viewerFriendIds.has(id),
      );
    }

    if (visibleFriendIds.length === 0) {
      return [];
    }

    const users = await this.userRepo.find({
      where: {
        id: In(visibleFriendIds.slice(0, 6)),
      },
      take: 6,
    });

    for (const user of users) {
      if (user.userPfpUrl) {
        const PFPURL = await this.s3Service.getFileUrl(user.userPfpUrl);
        user.userPfpUrl = PFPURL.url;
      }
    }

    const order = new Map(visibleFriendIds.map((id, index) => [id, index]));

    return users
      .sort(
        (first, second) =>
          (order.get(first.id) ?? 0) - (order.get(second.id) ?? 0),
      )
      .map((user) => this.safePerson(user));
  }

  private async getGroups(userId: string) {
    const memberships = await this.groupMemberRepo.find({
      where: { userId },
      relations: {
        group: true,
      },
      order: {
        joinedAt: 'DESC',
      },
      take: 3,
    });

    return Promise.all(
      memberships
        .filter((membership) => membership.group)
        .map(async (membership) => ({
          id: membership.group.id,
          name: membership.group.name,
          description: membership.group.description ?? null,
          imageUrl: membership.group.imageUrl ?? null,
          membersCount: await this.groupMemberRepo.count({
            where: { groupId: membership.groupId },
          }),
          joinedAt: membership.joinedAt,
        })),
    );
  }

  private async getMediaCount(userId: string) {
    return this.postAttachmentRepo
      .createQueryBuilder('attachment')
      .innerJoin('attachment.post', 'post')
      .where('post.authorId = :userId', { userId })
      .getCount();
  }

  private async getActivity(userId: string) {
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      postsCreated,
      likesReceived,
      commentsReceived,
      newFriends,
      groupsJoined,
    ] = await Promise.all([
      this.postRepo.count({
        where: {
          authorId: userId,
          createdAt: MoreThanOrEqual(from),
        },
      }),

      this.postLikeRepo
        .createQueryBuilder('like')
        .innerJoin('like.post', 'post')
        .where('post.authorId = :userId', { userId })
        .andWhere('like.createdAt >= :from', { from })
        .getCount(),

      this.postCommentRepo
        .createQueryBuilder('comment')
        .innerJoin('comment.post', 'post')
        .where('post.authorId = :userId', { userId })
        .andWhere('comment.createdAt >= :from', { from })
        .getCount(),

      this.friendsRepo
        .createQueryBuilder('friend')
        .where('friend.status = :status', {
          status: FriendStatus.ACCEPTED,
        })
        .andWhere('friend.acceptedDate >= :from', { from })
        .andWhere('(friend.user1Id = :userId OR friend.user2Id = :userId)', {
          userId,
        })
        .getCount(),

      this.groupMemberRepo.count({
        where: {
          userId,
          joinedAt: MoreThanOrEqual(from),
        },
      }),
    ]);

    return {
      postsCreated,
      likesReceived,
      commentsReceived,
      newFriends,
      groupsJoined,
    };
  }
}
