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
import { Squad } from '../../squads/entities/squad.entity';
import { SessionPlayer } from '../../sessions/entities/session-player.entity';
import { GamePlayer } from '../../games/entities/game-player.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  note: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'uuid' })
  squad_id: string;

  @ManyToOne(() => Squad, (squad) => squad.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'squad_id' })
  squad: Squad;

  @OneToMany(() => SessionPlayer, (sp) => sp.player)
  session_players: SessionPlayer[];

  @OneToMany(() => GamePlayer, (gp) => gp.player)
  game_players: GamePlayer[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
