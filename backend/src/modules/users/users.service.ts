import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../entities/user-role.entity';
import {
  CreateAddressDto,
  UpdateAddressDto,
  UpdateUserRoleDto,
  UserQueryDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async isAdmin(userId: string) {
    return this.databaseService.checkUserRole(userId, AppRole.ADMIN);
  }

  async findAll(query: UserQueryDto, requesterId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      requesterId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can list users');
    }

    const result = await this.databaseService.findUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role as AppRole | undefined,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });

    return {
      data: result.data.map((user) => ({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.userRoles?.[0]?.role,
        profile: user.profiles?.[0] || null,
      })),
      meta: result.meta,
    };
  }

  async findOne(userId: string, requesterId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      requesterId,
      AppRole.ADMIN,
    );
    if (!isAdmin && requesterId !== userId) {
      throw new ForbiddenException('You can only access your own profile');
    }

    const user = await this.databaseService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.userRoles?.[0]?.role,
      profile: user.profiles?.[0] || null,
    };
  }

  async updateRole(
    targetUserId: string,
    updateUserRoleDto: UpdateUserRoleDto,
    adminId: string,
  ) {
    const isAdmin = await this.databaseService.checkUserRole(
      adminId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    const targetUser = await this.databaseService.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    await this.databaseService.setUserRole(
      targetUserId,
      updateUserRoleDto.role as unknown as AppRole,
    );
    return { message: 'User role updated successfully' };
  }

  async getAddresses(userId: string, requesterId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      requesterId,
      AppRole.ADMIN,
    );
    if (!isAdmin && requesterId !== userId) {
      throw new ForbiddenException('You can only access your own addresses');
    }

    return this.databaseService.findAddressesByUserId(userId);
  }

  async getAddressById(addressId: string, userId: string) {
    const address = await this.databaseService.findAddressById(
      addressId,
      userId,
    );
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async createAddress(createAddressDto: CreateAddressDto, userId: string) {
    if (createAddressDto.is_default) {
      await this.databaseService.unsetDefaultAddresses(userId);
    }

    return this.databaseService.createAddress({
      userId,
      label: createAddressDto.label,
      street: createAddressDto.street,
      city: createAddressDto.city,
      state: createAddressDto.state,
      postalCode: createAddressDto.postal_code,
      country: createAddressDto.country,
      phone: createAddressDto.phone,
      isDefault: createAddressDto.is_default || false,
    });
  }

  async updateAddress(
    addressId: string,
    updateAddressDto: UpdateAddressDto,
    userId: string,
  ) {
    if (updateAddressDto.is_default) {
      await this.databaseService.unsetDefaultAddresses(userId);
    }

    const address = await this.databaseService.updateAddress(
      addressId,
      userId,
      {
        label: updateAddressDto.label,
        street: updateAddressDto.street,
        city: updateAddressDto.city,
        state: updateAddressDto.state,
        postalCode: updateAddressDto.postal_code,
        country: updateAddressDto.country,
        phone: updateAddressDto.phone,
        isDefault: updateAddressDto.is_default,
      },
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async removeAddress(addressId: string, userId: string) {
    const address = await this.databaseService.findAddressById(
      addressId,
      userId,
    );
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.databaseService.deleteAddress(addressId, userId);
    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(addressId: string, userId: string) {
    return this.databaseService.setDefaultAddress(addressId, userId);
  }
}
