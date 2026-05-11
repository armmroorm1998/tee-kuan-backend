import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from '../owners/entities/owner.entity';

@Controller('squads/:squadId/players')
@UseGuards(OwnerGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  create(
    @Param('squadId') squadId: string,
    @CurrentOwner() owner: Owner,
    @Body() dto: CreatePlayerDto,
  ) {
    return this.playersService.create(squadId, owner.id, dto);
  }

  @Get()
  findAll(@Param('squadId') squadId: string, @CurrentOwner() owner: Owner) {
    return this.playersService.findAllBySquad(squadId, owner.id);
  }

  @Delete(':playerId')
  deactivate(@Param('playerId') playerId: string, @CurrentOwner() owner: Owner) {
    return this.playersService.deactivate(playerId, owner.id);
  }
}
