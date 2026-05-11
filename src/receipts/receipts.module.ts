import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { Receipt } from './entities/receipt.entity';
import { Session } from '../sessions/entities/session.entity';
import { SessionPlayer } from '../sessions/entities/session-player.entity';
import { Owner } from '../owners/entities/owner.entity';
import { OwnersModule } from '../owners/owners.module';

@Module({
  imports: [TypeOrmModule.forFeature([Receipt, Session, SessionPlayer, Owner]), OwnersModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
})
export class ReceiptsModule {}
