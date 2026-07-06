import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import {
  CreateAddressDto,
  UpdateAddressDto,
  UpdateUserRoleDto,
  UserQueryDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  findAll(
    @Query() query: UserQueryDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.usersService.findAll(query, requesterId);
  }

  @Get(':userId')
  findOne(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.usersService.findOne(userId, requesterId);
  }

  @Put(':targetUserId/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  updateRole(
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.usersService.updateRole(
      targetUserId,
      updateUserRoleDto,
      requesterId,
    );
  }

  @Get(':userId/addresses')
  getAddresses(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.usersService.getAddresses(userId, requesterId);
  }

  @Get('addresses/:addressId')
  getAddressById(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.getAddressById(addressId, userId);
  }

  @Post(':userId/addresses')
  createAddress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createAddressDto: CreateAddressDto,
    @CurrentUser('id') requesterId: string,
  ) {
    if (requesterId !== userId) {
      throw new ForbiddenException(
        'You can only add addresses to your own account',
      );
    }

    return this.usersService.createAddress(createAddressDto, userId);
  }

  @Put('addresses/:addressId')
  updateAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.updateAddress(addressId, updateAddressDto, userId);
  }

  @Delete('addresses/:addressId')
  removeAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.removeAddress(addressId, userId);
  }

  @Post('addresses/:addressId/set-default')
  setDefaultAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.setDefaultAddress(addressId, userId);
  }
}
