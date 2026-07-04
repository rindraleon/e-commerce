import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { UpdateUserRoleDto, CreateAddressDto, UpdateAddressDto } from './dto/user.dto';
import { AppRole } from '../../entities/user-role.entity';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const users = await this.databaseService.findUsers();
    return users;
  }

  async findOne(userId: string) {
    // Get user profile
    const profile = await this.databaseService.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }

    // Get user role
    const role = await this.databaseService.getUserRole(userId);

    return {
      ...profile,
      role
    };
  }

  async updateRole(targetUserId: string, updateUserRoleDto: UpdateUserRoleDto, adminId: string) {
    // Check if admin is authorized
    const isAdmin = await this.databaseService.checkUserRole(adminId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    // Check if target user exists
    const targetUser = await this.databaseService.findProfileByUserId(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Update the role
    await this.databaseService.setUserRole(targetUserId, updateUserRoleDto.role as unknown as AppRole);
    return { message: 'User role updated successfully' };
  }

  async getAddresses(userId: string) {
    const addresses = await this.databaseService.findAddressesByUserId(userId);
    return addresses;
  }

  async getAddressById(addressId: string, userId: string) {
    const address = await this.databaseService.findAddressById(addressId, userId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async createAddress(createAddressDto: CreateAddressDto, userId: string) {
    // If setting as default, unset other defaults for this user
    if (createAddressDto.is_default) {
      await this.databaseService.unsetDefaultAddresses(userId);
    }

    const address = await this.databaseService.createAddress({
      ...createAddressDto,
      userId
    });

    return address;
  }

  async updateAddress(addressId: string, updateAddressDto: UpdateAddressDto, userId: string) {
    // If setting as default, unset other defaults for this user
    if (updateAddressDto.is_default) {
      await this.databaseService.unsetDefaultAddresses(userId);
    }

    const address = await this.databaseService.updateAddress(addressId, updateAddressDto);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async removeAddress(addressId: string, userId: string) {
    await this.databaseService.deleteAddress(addressId, userId);
    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(addressId: string, userId: string) {
    // First, unset all other default addresses for this user
    await this.databaseService.unsetDefaultAddresses(userId);

    // Then set the selected address as default
    const address = await this.databaseService.setDefaultAddress(addressId, userId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }
}