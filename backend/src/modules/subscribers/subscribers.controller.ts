import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppRole } from '../../entities/user-role.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdateSubscriberStatusDto } from './dto/update-subscriber-status.dto';
import { SubscribersService } from './subscribers.service';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.subscribersService.subscribe(subscribeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  findAll(@CurrentUser('id') _userId: string) {
    return this.subscribersService.findAll();
  }

  @Patch(':subscriberId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  updateStatus(
    @Param('subscriberId', ParseUUIDPipe) subscriberId: string,
    @Body() dto: UpdateSubscriberStatusDto,
  ) {
    return this.subscribersService.updateStatus(subscriberId, dto.is_active);
  }

  @Delete(':subscriberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  remove(@Param('subscriberId', ParseUUIDPipe) subscriberId: string) {
    return this.subscribersService.remove(subscriberId);
  }
}
