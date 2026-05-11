import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session } from './entities/session.entity';
import { SessionPlayer } from './entities/session-player.entity';
import { Squad } from '../squads/entities/squad.entity';
import { Player } from '../players/entities/player.entity';
import { GamePlayer } from '../games/entities/game-player.entity';
import { OwnersModule } from '../owners/owners.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session, SessionPlayer, Squad, Player, GamePlayer]), OwnersModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [TypeOrmModule, SessionsService],
})
export class SessionsModule {}
