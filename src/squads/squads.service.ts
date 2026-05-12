import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Squad } from './entities/squad.entity';
import { CreateSquadDto } from './dto/create-squad.dto';
import { BillingMode } from '../common/enums/billing-mode.enum';
import { CourtSplitMode } from '../common/enums/court-split-mode.enum';

@Injectable()
export class SquadsService {
  constructor(
    @InjectRepository(Squad)
    private readonly squadRepository: Repository<Squad>,
  ) {}

  async create(ownerId: string, dto: CreateSquadDto): Promise<Squad> {
    const squad = this.squadRepository.create({
      owner_id: ownerId,
      name: dto.name,
      default_billing_mode: dto.default_billing_mode ?? BillingMode.EQUAL_SPLIT,
      default_court_split_mode:
        dto.default_court_split_mode ?? CourtSplitMode.EQUAL,
    });
    return this.squadRepository.save(squad);
  }

  async findAllByOwner(ownerId: string): Promise<Squad[]> {
    return this.squadRepository.find({
      where: { owner_id: ownerId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Squad> {
    const squad = await this.squadRepository.findOne({
      where: { id },
      relations: ['players'],
    });
    if (!squad) throw new NotFoundException('Squad not found');
    if (squad.owner_id !== ownerId) throw new ForbiddenException();
    return squad;
  }
}
