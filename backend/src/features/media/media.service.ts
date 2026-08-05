import { S3Service } from './../../utils/s3/s3.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { GroupMessageAttachment } from '../../database/entities/groupMessageAttachment.entity';
import { MessageAttachment } from '../../database/entities/messageAttachment.entity';
import { handleError } from '../../utils/handleError.util';
import { SignedFileUrls } from '../../utils/s3/s3.service';
import { SelectQueryBuilder } from 'typeorm/browser';

export enum MediaSources {
  ALLMEDIA = 'ALL',
  CHATS = 'CHATS',
  GROUPCHATS = 'GROUPCHATS',
}

export type GetAllMediaOptions = {
  page?: number;
  limit?: number;
  mediaType?: string;
  senderId?: string;
};

export type PaginatedMedia<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AttachmentWithS3Keys = {
  key: string;
  blurKey?: string | null;
};

export type SignedAttachment<T> = Omit<T, 'key' | 'blurKey'> & SignedFileUrls;

export type ChatMediaItem = SignedAttachment<MessageAttachment>;

export type GroupChatMediaItem = SignedAttachment<GroupMessageAttachment>;

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MessageAttachment)
    private readonly messageAttachmentRepo: Repository<MessageAttachment>,

    @InjectRepository(GroupMessageAttachment)
    private readonly groupMessageAttachmentRepo: Repository<GroupMessageAttachment>,

    private readonly s3Service: S3Service,
  ) {}

  async GetAllMedia(
    uid: string,
    mediaSource: MediaSources,
    options: GetAllMediaOptions = {},
  ) {
    try {
      const page = Math.max(Number(options.page) || 1, 1);

      const limit = Math.min(Math.max(Number(options.limit) || 30, 1), 100);

      const queryOptions = {
        page,
        limit,
        mediaType: options.mediaType,
        senderId: options.senderId,
      };

      switch (mediaSource) {
        case MediaSources.CHATS: {
          const chats = await this.getChatMedia(uid, queryOptions);

          return {
            message: 'Successfully returned chat media sources',
            code: 200,
            data: {
              chats,
            },
          };
        }

        case MediaSources.GROUPCHATS: {
          const groupchats = await this.getGroupChatMedia(uid, queryOptions);

          return {
            message: 'Successfully returned group-chat media sources',
            code: 200,
            data: {
              groupchats,
            },
          };
        }

        case MediaSources.ALLMEDIA: {
          const [chats, groupchats] = await Promise.all([
            this.getChatMedia(uid, queryOptions),
            this.getGroupChatMedia(uid, queryOptions),
          ]);

          return {
            message: 'Successfully returned all media sources',
            code: 200,
            data: {
              chats,
              groupchats,
            },
          };
        }

        default:
          throw new BadRequestException('Invalid media source');
      }
    } catch (error: any) {
      handleError(error);
    }
  }

  private async getChatMedia(
    uid: string,
    options: Required<Pick<GetAllMediaOptions, 'page' | 'limit'>> &
      Pick<GetAllMediaOptions, 'mediaType' | 'senderId'>,
  ): Promise<PaginatedMedia<ChatMediaItem>> {
    const { page, limit, mediaType, senderId } = options;

    const query = this.messageAttachmentRepo
      .createQueryBuilder('attachment')
      .innerJoinAndSelect('attachment.message', 'message')
      .innerJoin('message.chatRoom', 'chatroom')
      .leftJoinAndSelect('message.sender', 'sender')
      .where(
        new Brackets((qb) => {
          qb.where('chatroom.user1Id = :uid', { uid }).orWhere(
            'chatroom.user2Id = :uid',
            { uid },
          );
        }),
      );

    if (mediaType) {
      query.andWhere('attachment.type = :mediaType', {
        mediaType,
      });
    }

    if (senderId) {
      query.andWhere('message.sid = :senderId', {
        senderId,
      });
    }

    query
      .select([
        'attachment',

        'message.id',
        'message.sid',
        'message.chatroomId',
        'message.createdAt',

        'sender.id',
        'sender.username',
        'sender.firstname',
        'sender.lastname',
        'sender.userPfpUrl',
      ])
      .orderBy('attachment.createdAt', 'DESC')
      .addOrderBy('attachment.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [attachmentEntities, total] = await query.getManyAndCount();

    const items = await Promise.all(
      attachmentEntities.map((attachment) =>
        this.signAttachment(
          attachment as MessageAttachment & AttachmentWithS3Keys,
        ),
      ),
    );

    return this.createPaginationResult(items, total, page, limit);
  }

  private async getGroupChatMedia(
    uid: string,
    options: Required<Pick<GetAllMediaOptions, 'page' | 'limit'>> &
      Pick<GetAllMediaOptions, 'mediaType' | 'senderId'>,
  ): Promise<PaginatedMedia<GroupChatMediaItem>> {
    const { page, limit, mediaType, senderId } = options;

    const query = this.groupMessageAttachmentRepo
      .createQueryBuilder('attachment')
      .innerJoinAndSelect('attachment.message', 'message')
      .innerJoin('message.group', 'groupchat')
      .innerJoin('groupchat.members', 'member', 'member.userId = :uid', { uid })
      .leftJoinAndSelect('message.sender', 'sender');

    if (mediaType) {
      query.andWhere('attachment.type = :mediaType', {
        mediaType,
      });
    }

    if (senderId) {
      query.andWhere('message.senderId = :senderId', {
        senderId,
      });
    }

    query
      .select([
        'attachment',

        'message.id',
        'message.senderId',
        'message.groupId',
        'message.createdAt',

        'sender.id',
        'sender.username',
        'sender.firstname',
        'sender.lastname',
        'sender.userPfpUrl',
      ])
      .orderBy('attachment.createdAt', 'DESC')
      .addOrderBy('attachment.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [attachmentEntities, total] = await query.getManyAndCount();

    const items = await Promise.all(
      attachmentEntities.map((attachment) =>
        this.signAttachment(
          attachment as GroupMessageAttachment & AttachmentWithS3Keys,
        ),
      ),
    );

    return this.createPaginationResult(items, total, page, limit);
  }

  private async signAttachment<T extends AttachmentWithS3Keys>(
    attachment: T,
  ): Promise<SignedAttachment<T>> {
    const { key, blurKey, ...attachmentWithoutKeys } = attachment;

    const signedUrls = await this.s3Service.getFileUrl(key, 3600, blurKey);

    return {
      ...attachmentWithoutKeys,
      ...signedUrls,
    } as SignedAttachment<T>;
  }

  private createPaginationResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedMedia<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async GetAttachmentById(uid: string, aid: string, source: MediaSources) {
    try {
      if (source === MediaSources.CHATS) {
        const attachment = await this.messageAttachmentRepo
          .createQueryBuilder('attachment')
          .innerJoinAndSelect('attachment.message', 'message')
          .innerJoin('message.chatRoom', 'chatroom')
          .leftJoinAndSelect('message.sender', 'sender')
          .where('attachment.id = :aid', { aid })
          .andWhere(
            new Brackets((qb) => {
              qb.where('chatroom.user1Id = :uid', { uid }).orWhere(
                'chatroom.user2Id = :uid',
                { uid },
              );
            }),
          )
          .select([
            'attachment',

            'message.id',
            'message.sid',
            'message.chatroomId',
            'message.createdAt',

            'sender.id',
            'sender.username',
            'sender.firstname',
            'sender.lastname',
            'sender.userPfpUrl',
          ])
          .getOne();

        if (!attachment) {
          throw new NotFoundException('Attachment was not found.');
        }

        const url = await this.s3Service.getFileUrl(attachment.key);

        const { key, ...attachmentWithoutKey } = attachment;

        return {
          message: 'Successfully returned chat attachment',
          code: 200,
          data: {
            ...attachmentWithoutKey,
            url,
            source: 'chats',
          },
        };
      }

      if (source === MediaSources.GROUPCHATS) {
        const attachment = await this.groupMessageAttachmentRepo
          .createQueryBuilder('attachment')
          .innerJoinAndSelect('attachment.message', 'message')
          .innerJoinAndSelect('message.group', 'groupchat')
          .innerJoin('groupchat.members', 'member', 'member.userId = :uid', {
            uid,
          })
          .leftJoinAndSelect('message.sender', 'sender')
          .where('attachment.id = :aid', { aid })
          .select([
            'attachment',

            'message.id',
            'message.senderId',
            'message.groupId',
            'message.createdAt',

            'groupchat.id',
            'groupchat.name',
            'groupchat.imageUrl',
            'groupchat.createdAt',

            'sender.id',
            'sender.username',
            'sender.firstname',
            'sender.lastname',
            'sender.userPfpUrl',
          ])
          .getOne();

        if (!attachment) {
          throw new NotFoundException('Attachment was not found.');
        }

        const url = await this.s3Service.getFileUrl(attachment.key);

        const { key, ...attachmentWithoutKey } = attachment;

        return {
          message: 'Successfully returned group-chat attachment',
          code: 200,
          data: {
            ...attachmentWithoutKey,
            ...url,
            source: 'groupchats',
          },
        };
      }

      throw new BadRequestException('Invalid attachment source.');
    } catch (error: any) {
      handleError(error);
    }
  }
}
