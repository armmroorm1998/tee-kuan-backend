import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PromptPayType } from '../../common/enums/promptpay-type.enum';
import { Squad } from '../../squads/entities/squad.entity';

@Entity('owners')
export class Owner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** bcrypt hash of the raw owner token stored in cookie */
  @Column({ type: 'varchar', select: false })
  token_hash: string;

  /** bcrypt hash of the recovery key shown to user once */
  @Column({ type: 'varchar', select: false })
  recovery_key_hash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  display_name: string | null;

  @Column({ type: 'enum', enum: PromptPayType, nullable: true })
  promptpay_type: PromptPayType | null;

  /** Stored encrypted at rest; never returned in plain API responses */
  @Column({ type: 'varchar', length: 255, nullable: true })
  promptpay_value: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Squad, (squad) => squad.owner)
  squads: Squad[];
}
