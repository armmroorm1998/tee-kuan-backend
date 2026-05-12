import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Session } from '../../sessions/entities/session.entity';
import { Player } from '../../players/entities/player.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'uuid' })
  player_id: string;

  @ManyToOne(() => Session, (session) => session.receipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount_due: number;

  /** PromptPay EMVCo payload string for this specific amount */
  @Column({ type: 'text', nullable: true })
  promptpay_payload: string | null;

  /** Base64-encoded QR PNG for display in the receipt UI */
  @Column({ type: 'text', nullable: true })
  qr_image_base64: string | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  @CreateDateColumn()
  generated_at: Date;
}
