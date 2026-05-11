import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Owner } from '../../owners/entities/owner.entity';

export const CurrentOwner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Owner => {
    const request = ctx.switchToHttp().getRequest();
    return request.owner as Owner;
  },
);
