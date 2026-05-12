import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { Owner } from '../../owners/entities/owner.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { owner: Owner }>();
    const rawToken = (request.cookies as Record<string, string | undefined>)[
      'owner_token'
    ];

    if (!rawToken) {
      throw new UnauthorizedException('Owner token not found');
    }

    // Find all owners and compare token hash (token is short-lived, stored hashed)
    const owners = await this.ownerRepository.find({
      select: ['id', 'token_hash'],
    });
    let matchedOwner: Owner | null = null;

    for (const owner of owners) {
      const match = await bcrypt.compare(rawToken, owner.token_hash);
      if (match) {
        matchedOwner = owner;
        break;
      }
    }

    if (!matchedOwner) {
      throw new UnauthorizedException('Invalid owner token');
    }

    // Attach full owner to request
    const fullOwner = await this.ownerRepository.findOneByOrFail({
      id: matchedOwner.id,
    });
    request.owner = fullOwner;
    return true;
  }
}
