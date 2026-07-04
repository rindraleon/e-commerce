import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserRoleDto, CreateAddressDto, UpdateAddressDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':userId')
  async findOne(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.findOne(userId);
  }

  @Put(':targetUserId/role')
  async updateRole(
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Req() req,
  ) {
    return this.usersService.updateRole(targetUserId, updateUserRoleDto, req.user.id);
  }

  @Get(':userId/addresses')
  async getAddresses(@Param('userId', ParseUUIDPipe) userId: string, @Req() req) {
    // Only allow users to access their own addresses or admins to access any addresses
    const isAdmin = await this.usersService['supabaseService'].checkUserRole(req.user.id, 'admin');
    if (!isAdmin && req.user.id !== userId) {
      throw new Error('Unauthorized'); // In a real app, you'd use proper guards
    }
    
    return this.usersService.getAddresses(userId);
  }

  @Get('addresses/:addressId')
  async getAddressById(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Req() req,
  ) {
    return this.usersService.getAddressById(addressId, req.user.id);
  }

  @Post(':userId/addresses')
  async createAddress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createAddressDto: CreateAddressDto,
    @Req() req,
  ) {
    // Only allow users to add addresses to their own account
    if (req.user.id !== userId) {
      throw new Error('Unauthorized'); // In a real app, you'd use proper guards
    }
    
    return this.usersService.createAddress(createAddressDto, userId);
  }

  @Put('addresses/:addressId')
  async updateAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Req() req,
  ) {
    return this.usersService.updateAddress(addressId, updateAddressDto, req.user.id);
  }

  @Delete('addresses/:addressId')
  async removeAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Req() req,
  ) {
    return this.usersService.removeAddress(addressId, req.user.id);
  }

  @Post('addresses/:addressId/set-default')
  async setDefaultAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Req() req,
  ) {
    return this.usersService.setDefaultAddress(addressId, req.user.id);
  }
}