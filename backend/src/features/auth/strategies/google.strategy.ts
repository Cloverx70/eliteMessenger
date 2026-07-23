import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { AuthService } from '../auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { handleError } from '../../../utils/handleError.util';

@Injectable()
export class googleStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      passReqToCallback: true,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      if (!profile || Object.keys(profile).length === 0)
        throw new UnauthorizedException('profile may be undefined');
      const token = await this.authService.googleValidate(profile);

      if (!token || token.length === 0)
        throw new UnauthorizedException('invalid token');

      req.token = token;

      done(null, { token });
    } catch (error: any) {
      handleError(error);
    }
  }
}
