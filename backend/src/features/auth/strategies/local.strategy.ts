import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { handleError } from 'src/utils/handleError.util';
import { AuthService } from '../auth.service';

@Injectable()
export class localStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    try {
      if (!email || !password)
        throw new BadRequestException('email and password are required fields');

      const token = await this.authService.validate({ email, password });

      if (!token) throw new BadRequestException('invalid email or password');

      return token;
    } catch (error) {
      handleError(error);
    }
  }
}
