import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Session } from '../sessions/entities/session.entity';
import { SessionPlayer } from '../sessions/entities/session-player.entity';
import { Squad } from '../squads/entities/squad.entity';
import { OwnersModule } from '../owners/owners.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session, SessionPlayer, Squad]), OwnersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
