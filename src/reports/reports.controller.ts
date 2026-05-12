import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from '../owners/entities/owner.entity';

@Controller('reports')
@UseGuards(OwnerGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** GET /reports/monthly?month=YYYY-MM */
  @Get('monthly')
  async monthly(@CurrentOwner() owner: Owner, @Query('month') month: string) {
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }
    const [year, mon] = month.split('-').map(Number);
    return this.reportsService.getMonthlySummary(owner.id, year, mon);
  }
}
