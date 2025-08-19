import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';

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
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }
}
