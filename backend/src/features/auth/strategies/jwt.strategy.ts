import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { S3Service } from '../../../utils/s3/s3.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const cookieToken = req.cookies?.['ELITE_ERA_AUTH_TOKEN'];

        if (cookieToken) {
          return cookieToken;
        }

        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith('Bearer ')) {
          return authHeader.slice(7);
        }

        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { id?: string }) {
    if (!payload.id) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const user = await this.userService.getUserById(payload.id);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const profilePicture = user.userPfpUrl;
    const isExternalUrl = /^https?:\/\//i.test(profilePicture ?? '');

    if (profilePicture && !isExternalUrl) {
      const resolvedProfilePicture = await this.s3Service.getFileUrl(
        profilePicture,
      );

      user.userPfpUrl = resolvedProfilePicture.url;
    }

    return user;
  }
}
