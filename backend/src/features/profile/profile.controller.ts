import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ProfileService } from './profile.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
  };
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async getMyProfile(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const uid = this.getUserId(req);
    const result = await this.profileService.getMyProfile(uid);

    return res.status(result.code).json(result);
  }

  @Patch('me')
  @UseGuards(JwtGuard)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Body() dto: UpdateProfileDto,
  ) {
    const uid = this.getUserId(req);
    const result = await this.profileService.updateMyProfile(uid, dto);

    return res.status(result.code).json(result);
  }

  @Get(':username')
  @UseGuards(JwtGuard)
  async getProfileByUsername(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('username') username: string,
  ) {
    const uid = this.getUserId(req);

    if (!username?.trim()) {
      throw new BadRequestException('Username is required');
    }

    const result = await this.profileService.getProfileByUsername(
      uid,
      username.trim(),
    );

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
