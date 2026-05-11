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
import { Owner } from '../../owners/entities/owner.entity';
import { Player } from '../../players/entities/player.entity';
import { Session } from '../../sessions/entities/session.entity';

@Entity('squads')
export class Squad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: BillingMode,
    default: BillingMode.EQUAL_SPLIT,
  })
  default_billing_mode: BillingMode;

  @Column({
    type: 'enum',
    enum: CourtSplitMode,
    default: CourtSplitMode.EQUAL,
  })
  default_court_split_mode: CourtSplitMode;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => Owner, (owner) => owner.squads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(() => Player, (player) => player.squad)
  players: Player[];

  @OneToMany(() => Session, (session) => session.squad)
  sessions: Session[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
