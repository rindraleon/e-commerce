import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DatabaseModule } from '../database/database.module';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CouponsController],
  providers: [CouponsService, RolesGuard],
  exports: [CouponsService],
})
export class CouponsModule {}
