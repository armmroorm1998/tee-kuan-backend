import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { Player } from './entities/player.entity';
import { Squad } from '../squads/entities/squad.entity';
import { OwnersModule } from '../owners/owners.module';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Squad]), OwnersModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [TypeOrmModule],
})
export class PlayersModule {}
