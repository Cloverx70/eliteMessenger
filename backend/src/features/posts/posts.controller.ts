import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { memoryStorage } from 'multer';

import { JwtGuard } from '../auth/guards/jwt.guard';

import { PostsService } from './posts.service';
import { CreatePostCommentDto, UpdatePostCommentDto } from './dtos/comment.dto';
import { CommentsQueryDto } from './dtos/comments-query.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { FeedQueryDto } from './dtos/feed-query.dto';
import { ReorderPostAttachmentsDto } from './dtos/reorder-attachments.dto';
import { ReportPostDto } from './dtos/report-post.dto';
import { SharePostDto } from './dtos/share-post.dto';
import { ShareTargetQueryDto } from './dtos/share-target-query.dto';
import { UpdatePostDto } from './dtos/update-post.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    isAdmin?: boolean;
  };
}

const postUploadOptions = {
  storage: memoryStorage(),
  limits: {
    files: 10,
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (
    request: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed =
      file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

    if (!allowed) {
      callback(
        new BadRequestException(
          `Only image and video files are allowed. Received ${file.mimetype}.`,
        ),
        false,
      );
      return;
    }

    callback(null, true);
  },
};

@Controller('posts')
@UseGuards(JwtGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('attachments', 10, postUploadOptions))
  createPost(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.postsService.createPost(request.user.id, dto, files ?? []);
  }

  @Get('feed')
  getFeed(@Req() request: AuthenticatedRequest, @Query() query: FeedQueryDto) {
    return this.postsService.getFeed(request.user.id, query);
  }

  @Get('share-targets')
  getShareTargets(
    @Req() request: AuthenticatedRequest,
    @Query() query: ShareTargetQueryDto,
  ) {
    return this.postsService.getShareTargets(request.user.id, query);
  }

  @Get(':postId')
  getPost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.getPostById(request.user.id, postId);
  }

  @Patch(':postId')
  updatePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(
      request.user.id,
      postId,
      dto,
      Boolean(request.user.isAdmin),
    );
  }

  @Delete(':postId')
  @HttpCode(200)
  deletePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.deletePost(
      request.user.id,
      postId,
      Boolean(request.user.isAdmin),
    );
  }

  @Delete(':postId/attachments/:attachmentId')
  @HttpCode(200)
  deleteAttachment(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.postsService.deleteAttachment(
      request.user.id,
      postId,
      attachmentId,
      Boolean(request.user.isAdmin),
    );
  }

  @Patch(':postId/attachments/order')
  reorderAttachments(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: ReorderPostAttachmentsDto,
  ) {
    return this.postsService.reorderAttachments(
      request.user.id,
      postId,
      dto,
      Boolean(request.user.isAdmin),
    );
  }

  @Post(':postId/like')
  likePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.setLike(request.user.id, postId, true);
  }

  @Delete(':postId/like')
  @HttpCode(200)
  unlikePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.setLike(request.user.id, postId, false);
  }

  @Post(':postId/save')
  savePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.setSaved(request.user.id, postId, true);
  }

  @Delete(':postId/save')
  @HttpCode(200)
  unsavePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.setSaved(request.user.id, postId, false);
  }

  @Get(':postId/comments')
  getComments(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() query: CommentsQueryDto,
  ) {
    return this.postsService.getComments(request.user.id, postId, query);
  }

  @Post(':postId/comments')
  createComment(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreatePostCommentDto,
  ) {
    return this.postsService.createComment(request.user.id, postId, dto);
  }

  @Patch(':postId/comments/:commentId')
  updateComment(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdatePostCommentDto,
  ) {
    return this.postsService.updateComment(
      request.user.id,
      postId,
      commentId,
      dto,
      Boolean(request.user.isAdmin),
    );
  }

  @Delete(':postId/comments/:commentId')
  @HttpCode(200)
  deleteComment(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.postsService.deleteComment(
      request.user.id,
      postId,
      commentId,
      Boolean(request.user.isAdmin),
    );
  }

  @Post(':postId/share')
  sharePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: SharePostDto,
  ) {
    return this.postsService.sharePost(request.user.id, postId, dto);
  }

  @Post(':postId/report')
  reportPost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: ReportPostDto,
  ) {
    return this.postsService.reportPost(request.user.id, postId, dto);
  }

  @Post(':postId/hide')
  hidePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.setHidden(request.user.id, postId, true);
  }

  @Delete(':postId/hide')
  @HttpCode(200)
  unhidePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postsService.setHidden(request.user.id, postId, false);
  }
}
