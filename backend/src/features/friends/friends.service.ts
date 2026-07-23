import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { manageFriendRequestDto } from './dtos/manageFriendRequest.dto';
import { ChatService } from '../chat/chat.service';
import { Friends, FriendStatus } from '../../database/entities/friends.entity';
import { User } from '../../database/entities/user.entity';
import { handleError } from '../../utils/handleError.util';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friends)
    private readonly friendsRepo: Repository<Friends>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly chatService: ChatService,
  ) {}

  usersSelect = [
    'u.id',
    'u.userPfpUrl',
    'u.username',
    'u.firstname',
    'u.lastname',
    'u.email',
  ];

  async searchUsers(uid: string, query: string, limit: number, page: number) {
    try {
      const [users, total] = await this.userRepo
        .createQueryBuilder('u')
        .select(this.usersSelect)
        .where(
          '(u.username like :query OR u.firstname like :query OR u.lastname like :query)',
          { query: `%${query}%` },
        )
        .andWhere('u.id != :uid', { uid })
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();

      return {
        data: users,
        total,
        page,
        limit,
        hasNext: page * limit < total,
        code: 200,
        message: 'search successfull',
      };
    } catch (error: any) {
      handleError(error);
    }
  }
  async sendFriendRequest(sid: string, rid: string) {
    // Worst Case O(Log N) && Best Case O(1)
    try {
      if (sid === rid) throw new BadRequestException('cannot friend yourself');

      const RequestExists = await this.friendsRepo
        .createQueryBuilder('f')
        .where(
          '(f.user1Id = :sid AND f.user2Id =  :rid) OR (f.user1Id = :rid AND f.user2Id =  :sid)',
          { sid, rid },
        )
        .getOne();

      if (RequestExists) {
        if (RequestExists.status === FriendStatus.ONGOING)
          throw new BadRequestException('Request already sent..');

        if (RequestExists.status === FriendStatus.ACCEPTED)
          throw new BadRequestException('Users already friends..');
      }

      await this.friendsRepo
        .createQueryBuilder()
        .insert()
        .into(Friends)
        .values({
          user1Id: sid,
          user2Id: rid,
          status: FriendStatus.ONGOING,
        })
        .execute();

      return {
        message: 'Friend request sent successfully',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async manageFriendRequest(
    uid: string,
    manageRequestDto: manageFriendRequestDto,
  ) {
    // Worst Case O(Log N) && Best Case O(1)
    try {
      if (manageRequestDto.status === FriendStatus.ONGOING)
        throw new BadRequestException(
          'you cannot set an ongoing request to ongoing',
        );

      const request = await this.friendsRepo
        .createQueryBuilder('f')
        .where('f.id = :requestId', {
          requestId: manageRequestDto.requestId,
        })
        .getOne();

      if (!request) throw new NotFoundException('request not found');

      if (request.user1Id === uid)
        throw new BadRequestException('request sender cannot manage request');

      if (manageRequestDto.status === FriendStatus.ACCEPTED) {
        request.status = manageRequestDto.status;
        request.acceptedDate = new Date();
        await this.friendsRepo.save(request);

        await this.chatService.CreateChatRoom({
          uid1: request.user1Id,
          uid2: request.user2Id,
        }); // on accepting a friend request automatically create a chatroom between them.
      } else {
        await this.friendsRepo.remove(request);
      }

      return {
        message: `request has been ${manageRequestDto.status} successfully`,
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async unfriend(sid: string, rid: string) {
    // Worst Case O(Log N) && Best Case O(1)
    try {
      const requestExists = await this.friendsRepo
        .createQueryBuilder('f')
        .where(
          '(f.user1Id = :sid AND f.user2Id =  :rid) OR (f.user1Id = :rid AND f.user2Id =  :sid)',
          { sid, rid },
        )
        .andWhere('f.status = :status', { status: FriendStatus.ACCEPTED })
        .getOne();

      if (!requestExists)
        throw new BadRequestException('users are not friends');

      await this.friendsRepo.remove(requestExists);

      return {
        message: 'users unfriended successfully',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async cancelOngoing(sid: string, rid: string) {
    // Worst Case O(Log N) && Best Case O(1)
    try {
      const requestExists = await this.friendsRepo
        .createQueryBuilder('f')
        .where(
          '(f.user1Id = :sid AND f.user2Id =  :rid) OR (f.user1Id = :rid AND f.user2Id =  :sid)',
          { sid, rid },
        )
        .andWhere('f.status = :status', { status: FriendStatus.ONGOING })
        .getOne();

      if (!requestExists) throw new BadRequestException('request not found');

      await this.friendsRepo.remove(requestExists);

      return {
        message: 'request canceled successfully',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async getAllFriends(uid: string) {
    // Worst Case O(N) && Best Case O(1)
    try {
      const friends = await this.friendsRepo
        .createQueryBuilder('f')
        .leftJoin('f.user1', 'u1')
        .leftJoin('f.user2', 'u2')
        .select([
          `CASE WHEN f.user1Id = :uid THEN u2.id        ELSE u1.id        END AS id`,
          `CASE WHEN f.user1Id = :uid THEN u2.firstname ELSE u1.firstname END AS firstname`,
          `CASE WHEN f.user1Id = :uid THEN u2.lastname  ELSE u1.lastname  END AS lastname`,
          `CASE WHEN f.user1Id = :uid THEN u2.username  ELSE u1.username  END AS username`,
          `CASE WHEN f.user1Id = :uid THEN u2.userPfpUrl ELSE u1.userPfpUrl END AS userPfpUrl`,
        ])
        .where('(f.user1Id = :uid OR f.user2Id = :uid)', { uid })
        .andWhere('f.status = :status', { status: FriendStatus.ACCEPTED })
        .getRawMany();

      return {
        message: 'Friends returned successfully',
        code: 200,
        data: friends,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async getPeopleYouMayKnow(uid: string, searchQuery?: string) {
    try {
      const search = searchQuery?.trim().toLowerCase();

      const applySearch = <T>(queryBuilder: SelectQueryBuilder<T>) => {
        if (!search) return queryBuilder;

        return queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(u.username) LIKE :search')
              .orWhere('LOWER(u.firstname) LIKE :search')
              .orWhere('LOWER(u.lastname) LIKE :search')
              .orWhere(
                `LOWER(CONCAT_WS(' ', u.firstname, u.lastname)) LIKE :search`,
              );
          }),
          {
            search: `%${search}%`,
          },
        );
      };

      const friendRows = await this.friendsRepo
        .createQueryBuilder('f')
        .select(
          `
        CASE
          WHEN f.user1Id = :uid
          THEN f.user2Id
          ELSE f.user1Id
        END
        `,
          'id',
        )
        .where(
          `
        (
          f.user1Id = :uid
          OR f.user2Id = :uid
        )
        AND f.status != :status
        `,
          {
            uid,
            status: FriendStatus.DECLINED,
          },
        )
        .getRawMany<{ id: string }>();

      const friendIds = [...new Set(friendRows.map((friend) => friend.id))];

      /*
       * No direct friends/relationships fallback.
       */
      if (friendIds.length === 0) {
        const excludedIdsRaw = `
        SELECT fr.user1Id AS id
        FROM friends fr
        WHERE fr.user2Id = :uid

        UNION

        SELECT fr.user2Id AS id
        FROM friends fr
        WHERE fr.user1Id = :uid
      `;

        const queryBuilder = this.userRepo
          .createQueryBuilder('u')
          .select(this.usersSelect)
          .where(`u.id NOT IN (${excludedIdsRaw})`)
          .andWhere('u.id != :uid', { uid })
          .setParameters({ uid })
          .limit(30);

        applySearch(queryBuilder);

        const fallbackUsers = await queryBuilder.getMany();

        return {
          message: 'People you may know (no friends fallback)',
          code: 200,
          data: fallbackUsers,
        };
      }

      /*
       * Find accepted friends of the current user's friends.
       */
      const mutualRows = await this.friendsRepo
        .createQueryBuilder('f')
        .select(
          `
        CASE
          WHEN f.user1Id IN (:...friendIds)
          THEN f.user2Id
          ELSE f.user1Id
        END
        `,
          'id',
        )
        .where(
          `
        (
          f.user1Id IN (:...friendIds)
          OR f.user2Id IN (:...friendIds)
        )
        AND f.status = :status
        `,
          {
            friendIds,
            status: FriendStatus.ACCEPTED,
          },
        )
        .getRawMany<{ id: string }>();

      const mutualIds = [
        ...new Set(
          mutualRows
            .map((friend) => friend.id)
            .filter((id) => id !== uid && !friendIds.includes(id)),
        ),
      ];

      /*
       * No mutual connections fallback.
       */
      if (mutualIds.length === 0) {
        const queryBuilder = this.userRepo
          .createQueryBuilder('u')
          .select(this.usersSelect)
          .where('u.id != :uid', { uid })
          .andWhere('u.id NOT IN (:...friendIds)', {
            friendIds,
          })
          .limit(30);

        applySearch(queryBuilder);

        const fallbackUsers = await queryBuilder.getMany();

        return {
          message: 'People you may know (fallback)',
          code: 200,
          data: fallbackUsers,
        };
      }

      /*
       * Return matching mutual connections.
       */
      const queryBuilder = this.userRepo
        .createQueryBuilder('u')
        .select(this.usersSelect)
        .where('u.id IN (:...mutualIds)', {
          mutualIds,
        })
        .limit(30);

      applySearch(queryBuilder);

      const peopleYouMayKnow = await queryBuilder.getMany();

      return {
        message: 'People you may know returned successfully',
        code: 200,
        data: peopleYouMayKnow,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async getSentRequests(uid: string) {
    // Worst Case O(N Log N) && Best Case O(Log N)
    try {
      const sentRequests = await this.userRepo
        .createQueryBuilder('u')
        .select(this.usersSelect)
        .innerJoin('u.sentRequests', 'sr')
        .innerJoin('sr.user1', 'sr1')
        .innerJoin('sr.user2', 'sr2')
        .select([
          'sr.id AS requestId',
          'sr.status AS status',
          'sr.ongoingDate AS ongoingDate',
          'sr.acceptedDate AS acceptedDate',
          'sr.status as status',
          `CASE WHEN sr1.id = :uid THEN sr2.id ELSE sr1.id END AS id`,
          `CASE WHEN sr1.id = :uid THEN sr2.username ELSE sr1.username END AS username`,
          `CASE WHEN sr1.id = :uid THEN sr2.firstname ELSE sr1.firstname END AS firstname`,
          `CASE WHEN sr1.id = :uid THEN sr2.lastname ELSE sr1.lastname END AS lastname`,
          `CASE WHEN sr1.id = :uid THEN sr2.userPfpUrl ELSE sr1.userPfpUrl END AS userPfpUrl`,
        ])
        .where('u.id = :uid', { uid })
        .andWhere('sr.status = :status', { status: FriendStatus.ONGOING })
        .getRawMany();

      console.log(sentRequests);

      return {
        message: 'success',
        code: 200,
        data: sentRequests,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async getReceivedRequests(uid: string) {
    // Worst Case O(N Log N) && Best Case O(Log N)
    try {
      const receivedRequests = await this.userRepo
        .createQueryBuilder('u')
        .select(this.usersSelect)
        .innerJoin('u.receivedRequests', 'rq')
        .innerJoin('rq.user1', 'rq1')
        .innerJoin('rq.user2', 'rq2')
        .select([
          'rq.id AS requestId',
          'rq.status AS status',
          'rq.ongoingDate AS ongoingDate',
          'rq.acceptedDate AS acceptedDate',
          'rq.status as status',
          `CASE WHEN rq1.id = :uid THEN rq2.id ELSE rq1.id END AS id`,
          `CASE WHEN rq1.id = :uid THEN rq2.username ELSE rq1.username END AS username`,
          `CASE WHEN rq1.id = :uid THEN rq2.firstname ELSE rq1.firstname END AS firstname`,
          `CASE WHEN rq1.id = :uid THEN rq2.lastname ELSE rq1.lastname END AS lastname`,
          `CASE WHEN rq1.id = :uid THEN rq2.userPfpUrl ELSE rq1.userPfpUrl END AS userPfpUrl`,
        ])
        .where('u.id = :uid', { uid })
        .andWhere('rq.status = :status', { status: FriendStatus.ONGOING })
        .getRawMany();

      return {
        message: 'success',
        code: 200,
        data: receivedRequests,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async GetSuggestedUsers(uid: string) {
    try {
      const relationships = await this.friendsRepo
        .createQueryBuilder('f')
        .select(['f.user1Id', 'f.user2Id'])
        .where('(f.user1Id = :uid OR f.user2Id = :uid)', {
          uid,
        })
        .getMany();

      const relatedUserIds = [
        ...new Set(
          relationships.map((relationship) =>
            relationship.user1Id === uid
              ? relationship.user2Id
              : relationship.user1Id,
          ),
        ),
      ];

      const queryBuilder = this.userRepo
        .createQueryBuilder('u')
        .select(this.usersSelect)
        .where('u.id != :uid', {
          uid,
        });

      if (relatedUserIds.length > 0) {
        queryBuilder.andWhere('u.id NOT IN (:...relatedUserIds)', {
          relatedUserIds,
        });
      }

      queryBuilder
        .addSelect(
          `
        (
          CASE
            WHEN u.isActive = true THEN 15
            ELSE 0
          END

          +

          CASE
            WHEN u.userPfpUrl IS NOT NULL
              AND u.userPfpUrl != ''
            THEN 4
            ELSE 0
          END

          +

          CASE
            WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            THEN 8

            WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            THEN 4

            ELSE 0
          END

          +

          (RAND() * 5)
        )
        `,
          'suggestionScore',
        )
        .orderBy('suggestionScore', 'DESC')
        .limit(20);

      const suggestedUsers = await queryBuilder.getMany();

      return {
        message: 'Suggested users returned successfully',
        code: 200,
        data: suggestedUsers,
      };
    } catch (error: any) {
      handleError(error);
    }
  }
}
