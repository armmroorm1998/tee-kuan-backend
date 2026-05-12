import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Owner } from '../../owners/entities/owner.entity';

export const CurrentOwner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Owner => {
    const request = ctx.switchToHttp().getRequest<Request & { owner: Owner }>();
    return request.owner;
  },
);
