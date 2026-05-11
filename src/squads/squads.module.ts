import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SquadsController } from './squads.controller';
import { SquadsService } from './squads.service';
import { Squad } from './entities/squad.entity';
import { OwnersModule } from '../owners/owners.module';

@Module({
  imports: [TypeOrmModule.forFeature([Squad]), OwnersModule],
  controllers: [SquadsController],
  providers: [SquadsService],
  exports: [TypeOrmModule, SquadsService],
})
export class SquadsModule {}
