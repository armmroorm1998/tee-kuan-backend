import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SquadsService } from './squads.service';
import { CreateSquadDto } from './dto/create-squad.dto';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from '../owners/entities/owner.entity';

@Controller('squads')
@UseGuards(OwnerGuard)
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  create(@CurrentOwner() owner: Owner, @Body() dto: CreateSquadDto) {
    return this.squadsService.create(owner.id, dto);
  }

  @Get()
  findAll(@CurrentOwner() owner: Owner) {
    return this.squadsService.findAllByOwner(owner.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentOwner() owner: Owner) {
    return this.squadsService.findOne(id, owner.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentOwner() owner: Owner) {
    return this.squadsService.delete(id, owner.id);
  }
}
