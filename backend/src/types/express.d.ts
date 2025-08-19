import { User } from 'src/database/entities/user.entity';

declare module 'express' {
  export interface Request {
    user?: User;
    token?: string;
  }
}
