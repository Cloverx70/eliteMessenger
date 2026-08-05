import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { NotificationQueryDto } from './dtos/notification-query.dto';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
  };
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtGuard)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getNotifications(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query() query: NotificationQueryDto,
  ) {
    const uid = this.getUserId(req);

    const result = await this.notificationsService.getNotifications(uid, query);

    if (!result) {
      throw new BadRequestException('Could not retrieve notifications');
    }

    return res.status(result.code).json(result);
  }

  @Get('unread-count')
  @UseGuards(JwtGuard)
  async getUnreadCount(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const uid = this.getUserId(req);

    const result = await this.notificationsService.getUnreadCount(uid);

    if (!result) {
      throw new BadRequestException(
        'Could not retrieve unread notification count',
      );
    }

    return res.status(result.code).json(result);
  }

  @Patch('read-all')
  @UseGuards(JwtGuard)
  async markAllAsRead(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const uid = this.getUserId(req);

    const result = await this.notificationsService.markAllAsRead(uid);

    if (!result) {
      throw new BadRequestException('Could not mark notifications as read');
    }

    return res.status(result.code).json(result);
  }

  @Get(':notificationId')
  @UseGuards(JwtGuard)
  async getNotificationDetail(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param(
      'notificationId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    notificationId: string,
  ) {
    const uid = this.getUserId(req);

    const result = await this.notificationsService.getNotificationDetail(
      uid,
      notificationId,
    );

    if (!result) {
      throw new BadRequestException('Could not retrieve notification');
    }

    return res.status(result.code).json(result);
  }

  @Patch(':notificationId/read')
  @UseGuards(JwtGuard)
  async markAsRead(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param(
      'notificationId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    notificationId: string,
  ) {
    const uid = this.getUserId(req);

    const result = await this.notificationsService.markAsRead(
      uid,
      notificationId,
    );

    if (!result) {
      throw new BadRequestException('Could not mark notification as read');
    }

    return res.status(result.code).json(result);
  }

  @Delete(':notificationId')
  @UseGuards(JwtGuard)
  async deleteNotification(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param(
      'notificationId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    notificationId: string,
  ) {
    const uid = this.getUserId(req);

    const result = await this.notificationsService.deleteNotification(
      uid,
      notificationId,
    );

    if (!result) {
      throw new BadRequestException('Could not delete notification');
    }

    return res.status(result.code).json(result);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const uid = req.user?.id;

    if (!uid) {
      throw new BadRequestException('Invalid token');
    }

    return uid;
  }
}
