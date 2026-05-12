import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { GamePlayer } from './entities/game-player.entity';
import { Session } from '../sessions/entities/session.entity';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private readonly gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  private async assertSessionOwner(
    sessionId: string,
    ownerId: string,
  ): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['squad'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.squad.owner_id !== ownerId) throw new ForbiddenException();
    return session;
  }

  async create(
    sessionId: string,
    ownerId: string,
    dto: CreateGameDto,
  ): Promise<Game> {
    await this.assertSessionOwner(sessionId, ownerId);

    const gameCount = await this.gameRepository.count({
      where: { session_id: sessionId },
    });

    const game = this.gameRepository.create({
      session_id: sessionId,
      game_number: gameCount + 1,
      court_label: dto.court_label ?? null,
    });
    const saved = await this.gameRepository.save(game);

    const gamePlayers = dto.player_ids.map((pid) =>
      this.gamePlayerRepository.create({ game_id: saved.id, player_id: pid }),
    );
    await this.gamePlayerRepository.save(gamePlayers);

    return this.gameRepository.findOne({
      where: { id: saved.id },
      relations: ['game_players'],
    }) as Promise<Game>;
  }

  async findAllBySession(sessionId: string, ownerId: string): Promise<Game[]> {
    await this.assertSessionOwner(sessionId, ownerId);
    return this.gameRepository.find({
      where: { session_id: sessionId },
      relations: ['game_players', 'game_players.player'],
      order: { game_number: 'ASC' },
    });
  }
}
