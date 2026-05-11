import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from '../owners/entities/owner.entity';

@Controller('squads/:squadId/sessions')
@UseGuards(OwnerGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @Param('squadId') squadId: string,
    @CurrentOwner() owner: Owner,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.create(squadId, owner.id, dto);
  }

  @Get()
  findAll(@Param('squadId') squadId: string, @CurrentOwner() owner: Owner) {
    return this.sessionsService.findAllBySquad(squadId, owner.id);
  }

  @Get(':sessionId')
  findOne(@Param('sessionId') sessionId: string, @CurrentOwner() owner: Owner) {
    return this.sessionsService.findOne(sessionId, owner.id);
  }

  @Patch(':sessionId/close')
  close(
    @Param('sessionId') sessionId: string,
    @CurrentOwner() owner: Owner,
    @Body() dto: CloseSessionDto,
  ) {
    return this.sessionsService.close(sessionId, owner.id, dto);
  }
}
