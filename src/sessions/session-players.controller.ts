import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AddSessionPlayerDto } from './dto/add-session-player.dto';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from '../owners/entities/owner.entity';

@Controller('sessions/:sessionId/players')
@UseGuards(OwnerGuard)
export class SessionPlayersController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  addPlayer(
    @Param('sessionId') sessionId: string,
    @CurrentOwner() owner: Owner,
    @Body() dto: AddSessionPlayerDto,
  ) {
    return this.sessionsService.addPlayer(sessionId, owner.id, dto.player_id);
  }
}
