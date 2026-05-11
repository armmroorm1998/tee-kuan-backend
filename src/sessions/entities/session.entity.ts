import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BillingMode } from '../../common/enums/billing-mode.enum';
import { CourtSplitMode } from '../../common/enums/court-split-mode.enum';
import { ShuttlePricingMode } from '../../common/enums/shuttle-pricing-mode.enum';
import { SessionStatus } from '../../common/enums/session-status.enum';
import { Squad } from '../../squads/entities/squad.entity';
import { SessionPlayer } from './session-player.entity';
import { Game } from '../../games/entities/game.entity';
import { Receipt } from '../../receipts/entities/receipt.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string | null;

  @Column({ type: 'uuid' })
  squad_id: string;

  @ManyToOne(() => Squad, (squad) => squad.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'squad_id' })
  squad: Squad;

  @Column({ type: 'enum', enum: BillingMode })
  billing_mode: BillingMode;

  @Column({ type: 'enum', enum: CourtSplitMode })
  court_split_mode: CourtSplitMode;

  @Column({ type: 'enum', enum: ShuttlePricingMode })
  shuttle_pricing_mode: ShuttlePricingMode;

  /** Price per single shuttle (used when mode = PER_SHUTTLE) */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  shuttle_price_per_item: number | null;

  /** Price per tube (used when mode = PER_TUBE) */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  shuttle_price_per_tube: number | null;

  /** How many shuttles in one tube */
  @Column({ type: 'int', nullable: true })
  shuttles_per_tube: number | null;

  /** Total shuttles actually used in this session */
  @Column({ type: 'int', default: 0 })
  shuttles_used: number;

  /** Total court rental cost for the session */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  court_total: number;

  /** Any extra/miscellaneous costs */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  extra_total: number;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => SessionPlayer, (sp) => sp.session, { cascade: true })
  session_players: SessionPlayer[];

  @OneToMany(() => Game, (game) => game.session, { cascade: true })
  games: Game[];

  @OneToMany(() => Receipt, (receipt) => receipt.session, { cascade: true })
  receipts: Receipt[];
}
