import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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

  async remove(
    sessionId: string,
    gameId: string,
    ownerId: string,
  ): Promise<void> {
    const session = await this.assertSessionOwner(sessionId, ownerId);

    if (session.status === 'closed') {
      throw new BadRequestException(
        'Cannot delete a game after session is closed',
      );
    }

    const game = await this.gameRepository.findOne({
      where: { id: gameId, session_id: sessionId },
    });
    if (!game) throw new NotFoundException('Game not found');

    await this.gameRepository.remove(game);

    // Re-number remaining games sequentially
    const remaining = await this.gameRepository.find({
      where: { session_id: sessionId },
      order: { game_number: 'ASC' },
    });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].game_number = i + 1;
    }
    if (remaining.length > 0) {
      await this.gameRepository.save(remaining);
    }
  }
}
