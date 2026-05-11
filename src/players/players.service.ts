import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { Squad } from '../squads/entities/squad.entity';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Squad)
    private readonly squadRepository: Repository<Squad>,
  ) {}

  private async assertSquadOwner(squadId: string, ownerId: string): Promise<Squad> {
    const squad = await this.squadRepository.findOneBy({ id: squadId });
    if (!squad) throw new NotFoundException('Squad not found');
    if (squad.owner_id !== ownerId) throw new ForbiddenException();
    return squad;
  }

  async create(squadId: string, ownerId: string, dto: CreatePlayerDto): Promise<Player> {
    await this.assertSquadOwner(squadId, ownerId);
    const player = this.playerRepository.create({
      squad_id: squadId,
      name: dto.name,
      note: dto.note ?? null,
    });
    return this.playerRepository.save(player);
  }

  async findAllBySquad(squadId: string, ownerId: string): Promise<Player[]> {
    await this.assertSquadOwner(squadId, ownerId);
    return this.playerRepository.find({
      where: { squad_id: squadId },
      order: { name: 'ASC' },
    });
  }

  async deactivate(playerId: string, ownerId: string): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['squad'],
    });
    if (!player) throw new NotFoundException('Player not found');
    if (player.squad.owner_id !== ownerId) throw new ForbiddenException();
    player.is_active = false;
    return this.playerRepository.save(player);
  }
}
