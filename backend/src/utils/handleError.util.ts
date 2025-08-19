import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export function handleError(error: Error) {
  if (error instanceof NotFoundException)
    throw new NotFoundException(error.message);
  else if (error instanceof UnauthorizedException)
    throw new UnauthorizedException(error.message);
  throw new BadRequestException(error.message);
}
