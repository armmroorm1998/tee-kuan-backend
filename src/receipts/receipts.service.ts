import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const generatePayload: (
  target: string,
  opts: { amount: number },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
) => string = require('promptpay-qr');
import { Receipt } from './entities/receipt.entity';
import { Session } from '../sessions/entities/session.entity';
import { SessionPlayer } from '../sessions/entities/session-player.entity';
import { Owner } from '../owners/entities/owner.entity';
import { SessionStatus } from '../common/enums/session-status.enum';
import { PromptPayType } from '../common/enums/promptpay-type.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(SessionPlayer)
    private readonly sessionPlayerRepository: Repository<SessionPlayer>,
    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Build EMVCo PromptPay payload using promptpay-qr package.
   */
  private buildPromptPayPayload(
    promptpayValue: string,
    promptpayType: PromptPayType,
    amount: number,
  ): string {
    const sanitized = promptpayValue.replace(/-/g, '').trim();
    console.log(
      '[PromptPay] type:',
      promptpayType,
      '| value:',
      sanitized,
      '| amount:',
      amount,
    );
    // generatePayload accepts mobile (0XXXXXXXXX) or national ID (13 digits)
    return generatePayload(sanitized, { amount });
  }

  async generateForSession(
    sessionId: string,
    ownerId: string,
  ): Promise<Receipt[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['squad'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.squad.owner_id !== ownerId) throw new ForbiddenException();
    if (session.status !== SessionStatus.CLOSED) {
      throw new ForbiddenException(
        'Session must be closed before generating receipts',
      );
    }

    const owner = await this.ownerRepository.findOneBy({ id: ownerId });
    if (!owner) throw new NotFoundException('Owner not found');

    const sessionPlayers = await this.sessionPlayerRepository.find({
      where: { session_id: sessionId },
      relations: ['player'],
    });

    // Delete any existing receipts for idempotency
    await this.receiptRepository.delete({ session_id: sessionId });

    const receipts: Receipt[] = [];

    for (const sp of sessionPlayers) {
      const amountDue = Number(sp.amount_due ?? 0);
      let payload: string | null = null;
      let qrBase64: string | null = null;

      if (owner.promptpay_value && owner.promptpay_type && amountDue > 0) {
        // Decrypt the encrypted PromptPay value before building the QR payload
        const plainPromptPay = this.encryptionService.decrypt(owner.promptpay_value);
        payload = this.buildPromptPayPayload(
          plainPromptPay,
          owner.promptpay_type,
          amountDue,
        );
        qrBase64 = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          width: 300,
        });
      }

      const receipt = this.receiptRepository.create({
        session_id: sessionId,
        player_id: sp.player_id,
        amount_due: amountDue,
        promptpay_payload: payload,
        qr_image_base64: qrBase64,
        payment_status: sp.payment_status,
      });

      receipts.push(await this.receiptRepository.save(receipt));
    }

    return receipts;
  }

  async markPaid(
    receiptId: string,
    status: PaymentStatus,
    ownerId: string,
  ): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { id: receiptId },
      relations: ['session', 'session.squad'],
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    if (receipt.session.squad.owner_id !== ownerId) {
      throw new ForbiddenException();
    }

    receipt.payment_status = status;
    return this.receiptRepository.save(receipt);
  }

  async findBySession(sessionId: string, ownerId: string): Promise<Receipt[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['squad'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.squad.owner_id !== ownerId) throw new ForbiddenException();

    return this.receiptRepository.find({
      where: { session_id: sessionId },
      relations: ['player'],
      order: { generated_at: 'DESC' },
    });
  }
}
