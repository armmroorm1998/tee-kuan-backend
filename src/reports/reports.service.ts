import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Session } from '../sessions/entities/session.entity';
import { SessionPlayer } from '../sessions/entities/session-player.entity';
import { Squad } from '../squads/entities/squad.entity';
import { SessionStatus } from '../common/enums/session-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(SessionPlayer)
    private readonly sessionPlayerRepository: Repository<SessionPlayer>,
    @InjectRepository(Squad)
    private readonly squadRepository: Repository<Squad>,
  ) {}

  async getMonthlySummary(
    ownerId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    total_sessions: number;
    total_cost: number;
    sessions: {
      id: string;
      title: string | null;
      started_at: Date | null;
      ended_at: Date | null;
      player_count: number;
      total_cost: number;
    }[];
  }> {
    const squads = await this.squadRepository.findBy({ owner_id: ownerId });
    if (!squads.length) {
      return { month: `${year}-${String(month).padStart(2, '0')}`, total_sessions: 0, total_cost: 0, sessions: [] };
    }

    const squadIds = squads.map((s) => s.id);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const sessions = await this.sessionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.session_players', 'sp')
      .where('s.squad_id IN (:...squadIds)', { squadIds })
      .andWhere('s.status = :status', { status: SessionStatus.CLOSED })
      .andWhere('s.ended_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('s.ended_at', 'ASC')
      .getMany();

    const summaryItems = sessions.map((session) => {
      const courtTotal = Number(session.court_total);
      const extraTotal = Number(session.extra_total);
      let shuttleTotal = 0;
      // Re-calculate shuttle total from stored data
      if (session.shuttle_pricing_mode === 'per_shuttle') {
        shuttleTotal = Number(session.shuttle_price_per_item ?? 0) * session.shuttles_used;
      } else if (session.shuttle_pricing_mode === 'per_tube' && session.shuttles_per_tube) {
        shuttleTotal =
          (Number(session.shuttle_price_per_tube ?? 0) / session.shuttles_per_tube) *
          session.shuttles_used;
      }

      return {
        id: session.id,
        title: session.title,
        started_at: session.started_at,
        ended_at: session.ended_at,
        player_count: session.session_players?.length ?? 0,
        total_cost: courtTotal + shuttleTotal + extraTotal,
      };
    });

    const totalCost = summaryItems.reduce((sum, s) => sum + s.total_cost, 0);

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      total_sessions: sessions.length,
      total_cost: totalCost,
      sessions: summaryItems,
    };
  }
}
