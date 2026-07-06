import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DatabaseModule } from '../../database/database.module';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SubscribersController],
  providers: [SubscribersService, RolesGuard],
  exports: [SubscribersService],
})
export class SubscribersModule {}
