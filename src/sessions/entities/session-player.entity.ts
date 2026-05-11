import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { Session } from './session.entity';
import { Player } from '../../players/entities/player.entity';

@Entity('session_players')
export class SessionPlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'uuid' })
  player_id: string;

  @ManyToOne(() => Session, (session) => session.session_players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Player, (player) => player.session_players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  /** Number of games this player participated in (used for per_game_split) */
  @Column({ type: 'int', default: 0 })
  participation_units: number;

  /** Calculated amount this player owes */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  amount_due: number | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;
}
