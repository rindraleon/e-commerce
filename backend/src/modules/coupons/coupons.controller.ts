import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppRole } from '../../entities/user-role.entity';
import { CouponsService } from './coupons.service';
import {
  CouponQueryDto,
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validate(@Body() dto: ValidateCouponDto, @CurrentUser('id') userId: string) {
    return this.couponsService.validateCoupon(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  findAll(@Query() query: CouponQueryDto, @CurrentUser('id') userId: string) {
    return this.couponsService.findAll(query, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  create(@Body() dto: CreateCouponDto, @CurrentUser('id') userId: string) {
    return this.couponsService.create(dto, userId);
  }

  @Put(':couponId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  update(
    @Param('couponId', ParseUUIDPipe) couponId: string,
    @Body() dto: UpdateCouponDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.couponsService.update(couponId, dto, userId);
  }

  @Delete(':couponId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  remove(
    @Param('couponId', ParseUUIDPipe) couponId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.couponsService.remove(couponId, userId);
  }
}
