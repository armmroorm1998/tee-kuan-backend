import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { SessionPlayer } from './entities/session-player.entity';
import { Squad } from '../squads/entities/squad.entity';
import { Player } from '../players/entities/player.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { SessionStatus } from '../common/enums/session-status.enum';
import { ShuttlePricingMode } from '../common/enums/shuttle-pricing-mode.enum';
import { BillingMode } from '../common/enums/billing-mode.enum';
import { CourtSplitMode } from '../common/enums/court-split-mode.enum';
import { GamePlayer } from '../games/entities/game-player.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(SessionPlayer)
    private readonly sessionPlayerRepository: Repository<SessionPlayer>,
    @InjectRepository(Squad)
    private readonly squadRepository: Repository<Squad>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(GamePlayer)
    private readonly gamePlayerRepository: Repository<GamePlayer>,
  ) {}

  private async assertSquadOwner(
    squadId: string,
    ownerId: string,
  ): Promise<Squad> {
    const squad = await this.squadRepository.findOneBy({ id: squadId });
    if (!squad) throw new NotFoundException('Squad not found');
    if (squad.owner_id !== ownerId) throw new ForbiddenException();
    return squad;
  }

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
    squadId: string,
    ownerId: string,
    dto: CreateSessionDto,
  ): Promise<Session> {
    await this.assertSquadOwner(squadId, ownerId);

    const session = this.sessionRepository.create({
      squad_id: squadId,
      title: dto.title ?? null,
      billing_mode: dto.billing_mode,
      court_split_mode: dto.court_split_mode,
      shuttle_pricing_mode: dto.shuttle_pricing_mode,
      shuttle_price_per_item: dto.shuttle_price_per_item ?? null,
      shuttle_price_per_tube: dto.shuttle_price_per_tube ?? null,
      shuttles_per_tube: dto.shuttles_per_tube ?? null,
      court_total: dto.court_total ?? 0,
      extra_total: dto.extra_total ?? 0,
      started_at: new Date(),
      status: SessionStatus.ACTIVE,
    });

    const saved = await this.sessionRepository.save(session);

    // Add players to the session
    if (dto.player_ids && dto.player_ids.length > 0) {
      const players = await this.playerRepository.findBy(
        dto.player_ids.map((id) => ({ id, squad_id: squadId })),
      );
      const sessionPlayers = players.map((p) =>
        this.sessionPlayerRepository.create({
          session_id: saved.id,
          player_id: p.id,
        }),
      );
      await this.sessionPlayerRepository.save(sessionPlayers);
    }

    return saved;
  }

  async findAllBySquad(squadId: string, ownerId: string): Promise<Session[]> {
    await this.assertSquadOwner(squadId, ownerId);
    return this.sessionRepository.find({
      where: { squad_id: squadId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(sessionId: string, ownerId: string): Promise<Session> {
    await this.assertSessionOwner(sessionId, ownerId);
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: [
        'session_players',
        'session_players.player',
        'games',
        'games.game_players',
      ],
    }) as Promise<Session>;
  }

  async addPlayer(
    sessionId: string,
    ownerId: string,
    playerId: string,
  ): Promise<SessionPlayer> {
    const session = await this.assertSessionOwner(sessionId, ownerId);

    if (session.status === SessionStatus.CLOSED) {
      throw new BadRequestException('Cannot add player to a closed session');
    }

    const player = await this.playerRepository.findOneBy({ id: playerId });
    if (!player) throw new NotFoundException('Player not found');
    if (player.squad_id !== session.squad_id)
      throw new ForbiddenException('Player does not belong to this squad');

    const existing = await this.sessionPlayerRepository.findOneBy({
      session_id: sessionId,
      player_id: playerId,
    });
    if (existing)
      throw new BadRequestException('Player is already in this session');

    const sp = this.sessionPlayerRepository.create({
      session_id: sessionId,
      player_id: playerId,
    });
    return this.sessionPlayerRepository.save(sp);
  }

  async close(
    sessionId: string,
    ownerId: string,
    dto: CloseSessionDto,
  ): Promise<Session> {
    const session = await this.assertSessionOwner(sessionId, ownerId);

    if (session.status === SessionStatus.CLOSED) {
      throw new BadRequestException('Session is already closed');
    }

    if (dto.shuttles_used !== undefined)
      session.shuttles_used = dto.shuttles_used;
    if (dto.court_total !== undefined) session.court_total = dto.court_total;
    if (dto.extra_total !== undefined) session.extra_total = dto.extra_total;
    session.status = SessionStatus.CLOSED;
    session.ended_at = new Date();

    // Calculate shuttle cost per shuttle
    let shuttleCostPerUnit = 0;
    if (session.shuttle_pricing_mode === ShuttlePricingMode.PER_SHUTTLE) {
      shuttleCostPerUnit = Number(session.shuttle_price_per_item ?? 0);
    } else if (
      session.shuttle_pricing_mode === ShuttlePricingMode.PER_TUBE &&
      session.shuttles_per_tube
    ) {
      shuttleCostPerUnit =
        Number(session.shuttle_price_per_tube ?? 0) / session.shuttles_per_tube;
    }

    const shuttleTotal = shuttleCostPerUnit * session.shuttles_used;
    const totalCost =
      Number(session.court_total) + shuttleTotal + Number(session.extra_total);

    // Load session players
    const sessionPlayers = await this.sessionPlayerRepository.find({
      where: { session_id: sessionId },
    });

    if (sessionPlayers.length === 0) {
      await this.sessionRepository.save(session);
      return session;
    }

    if (session.billing_mode === BillingMode.EQUAL_SPLIT) {
      const perPerson = totalCost / sessionPlayers.length;
      for (const sp of sessionPlayers) {
        sp.amount_due = Math.ceil(perPerson * 100) / 100; // Round up to nearest satang
      }
    } else if (session.billing_mode === BillingMode.PER_GAME_SPLIT) {
      // Count game participations per player
      const gamePlayers = await this.gamePlayerRepository
        .createQueryBuilder('gp')
        .innerJoin('gp.game', 'g')
        .where('g.session_id = :sessionId', { sessionId })
        .select(['gp.player_id'])
        .getMany();

      const unitMap = new Map<string, number>();
      for (const gp of gamePlayers) {
        unitMap.set(gp.player_id, (unitMap.get(gp.player_id) ?? 0) + 1);
      }

      const totalUnits = Array.from(unitMap.values()).reduce(
        (a, b) => a + b,
        0,
      );

      // Court split mode
      const courtPerUnit =
        session.court_split_mode === CourtSplitMode.PER_GAME && totalUnits > 0
          ? Number(session.court_total) / totalUnits
          : 0;

      const courtEqualPer =
        session.court_split_mode === CourtSplitMode.EQUAL
          ? Number(session.court_total) / sessionPlayers.length
          : 0;

      const shuttleAndExtraPerUnit =
        totalUnits > 0
          ? (shuttleTotal + Number(session.extra_total)) / totalUnits
          : 0;

      for (const sp of sessionPlayers) {
        const units = unitMap.get(sp.player_id) ?? 0;
        sp.participation_units = units;

        const courtShare =
          session.court_split_mode === CourtSplitMode.PER_GAME
            ? courtPerUnit * units
            : courtEqualPer;

        const amount = courtShare + shuttleAndExtraPerUnit * units;
        sp.amount_due = Math.ceil(amount * 100) / 100;
      }
    }

    await this.sessionPlayerRepository.save(sessionPlayers);
    return this.sessionRepository.save(session);
  }
}
