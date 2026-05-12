import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from '../owners/entities/owner.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Controller('sessions/:sessionId/receipts')
@UseGuards(OwnerGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  /** Generate (or regenerate) receipts + PromptPay QRs for a closed session */
  @Post('generate')
  generate(
    @Param('sessionId') sessionId: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.receiptsService.generateForSession(sessionId, owner.id);
  }

  @Get()
  findAll(@Param('sessionId') sessionId: string, @CurrentOwner() owner: Owner) {
    return this.receiptsService.findBySession(sessionId, owner.id);
  }

  @Patch(':receiptId/mark-paid')
  markPaid(
    @Param('receiptId') receiptId: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.receiptsService.markPaid(receiptId, PaymentStatus.PAID, owner.id);
  }

  @Patch(':receiptId/mark-pending')
  markPending(
    @Param('receiptId') receiptId: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.receiptsService.markPaid(receiptId, PaymentStatus.PENDING, owner.id);
  }
}
