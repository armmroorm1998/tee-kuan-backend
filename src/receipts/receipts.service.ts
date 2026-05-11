import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Receipt } from './entities/receipt.entity';
import { Session } from '../sessions/entities/session.entity';
import { SessionPlayer } from '../sessions/entities/session-player.entity';
import { Owner } from '../owners/entities/owner.entity';
import { SessionStatus } from '../common/enums/session-status.enum';
import { PromptPayType } from '../common/enums/promptpay-type.enum';

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
  ) {}

  /**
   * Build EMVCo PromptPay payload with amount.
   * Format: Thai PromptPay standard (based on BOT spec)
   */
  private buildPromptPayPayload(promptpayValue: string, promptpayType: PromptPayType, amount: number): string {
    const sanitized = promptpayValue.replace(/-/g, '');

    let id: string;
    if (promptpayType === PromptPayType.MOBILE) {
      // Convert 0XXXXXXXXX to 66XXXXXXXXX
      id = '0066' + sanitized.substring(1);
    } else {
      id = sanitized;
    }

    const guidTag = promptpayType === PromptPayType.MOBILE ? '01' : '02';
    const merchantAcct = `0016A000000677010111${guidTag}${String(id.length).padStart(2, '0')}${id}`;
    const amountStr = amount.toFixed(2);

    const payload =
      '000201' +
      '010212' +
      `2${String(merchantAcct.length + 2).padStart(2, '0')}${merchantAcct}` +
      '5303764' +
      `54${String(amountStr.length).padStart(2, '0')}${amountStr}` +
      '5802TH' +
      '6304';

    const crc = this.crc16(payload);
    return payload + crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /** CRC-16/CCITT-FALSE as required by EMVCo */
  private crc16(data: string): number {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return crc & 0xffff;
  }

  async generateForSession(sessionId: string, ownerId: string): Promise<Receipt[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['squad'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.squad.owner_id !== ownerId) throw new ForbiddenException();
    if (session.status !== SessionStatus.CLOSED) {
      throw new ForbiddenException('Session must be closed before generating receipts');
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
        payload = this.buildPromptPayPayload(
          owner.promptpay_value,
          owner.promptpay_type,
          amountDue,
        );
        qrBase64 = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', width: 300 });
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
