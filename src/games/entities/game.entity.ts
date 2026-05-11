import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Session } from '../../sessions/entities/session.entity';
import { GamePlayer } from './game-player.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => Session, (session) => session.games, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ type: 'int' })
  game_number: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  court_label: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => GamePlayer, (gp) => gp.game, { cascade: true })
  game_players: GamePlayer[];
}
