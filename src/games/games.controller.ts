import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from '../owners/entities/owner.entity';

@Controller('sessions/:sessionId/games')
@UseGuards(OwnerGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  create(
    @Param('sessionId') sessionId: string,
    @CurrentOwner() owner: Owner,
    @Body() dto: CreateGameDto,
  ) {
    return this.gamesService.create(sessionId, owner.id, dto);
  }

  @Get()
  findAll(@Param('sessionId') sessionId: string, @CurrentOwner() owner: Owner) {
    return this.gamesService.findAllBySession(sessionId, owner.id);
  }

  @Delete(':gameId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('sessionId') sessionId: string,
    @Param('gameId') gameId: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.gamesService.remove(sessionId, gameId, owner.id);
  }
}
