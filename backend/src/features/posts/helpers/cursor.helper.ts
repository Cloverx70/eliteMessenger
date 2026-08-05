import { BadRequestException } from '@nestjs/common';

export interface StandardFeedCursor {
  createdAt: string;
  id: string;
}

export interface TrendingFeedCursor extends StandardFeedCursor {
  score: number;
}

export function encodeCursor(value: object): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function decodeCursor<T>(cursor?: string): T | null {
  if (!cursor) return null;

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as T;
  } catch {
    throw new BadRequestException('Invalid pagination cursor.');
  }
}
