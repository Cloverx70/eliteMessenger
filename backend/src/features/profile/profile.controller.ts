import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
  };
}

interface UploadedProfilePicture {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async getMyProfile(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const uid = this.getUserId(req);
    const result = await this.profileService.getMyProfile(uid);

    return res.status(result.code).json(result);
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @UseGuards(JwtGuard)
  async updateMyProfile(
    @Req()
    req: AuthenticatedRequest,

    @Res()
    res: Response,

    @Body()
    dto: UpdateProfileDto,

    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^image\/(jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          fileIsRequired: false,
        }),
    )
    profilePicture?: UploadedProfilePicture,
  ) {
    const uid = this.getUserId(req);

    const result = await this.profileService.updateMyProfile(
      uid,
      dto,
      profilePicture,
    );

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
