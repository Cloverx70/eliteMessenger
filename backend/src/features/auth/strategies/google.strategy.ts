import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Profile, Strategy } from 'passport-google-oauth20';

import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_REDIRECT_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<{ token: string }> {
    if (!profile) {
      throw new UnauthorizedException('Google profile was not returned');
    }

    const token = await this.authService.googleValidate(profile);

    if (!token) {
      throw new UnauthorizedException('Unable to create authentication token');
    }

    return { token };
  }
}
