import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../entities/user-role.entity';
import { ReturnStatus } from '../../entities/return.entity';
import {
  CreateReturnDto,
  ReturnQueryDto,
  UpdateReturnStatusDto,
} from './dto/return.dto';

@Injectable()
export class ReturnsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async isAdmin(userId: string) {
    return this.databaseService.checkUserRole(userId, AppRole.ADMIN);
  }

  async findAll(query: ReturnQueryDto, userId: string, isAdmin: boolean) {
    return this.databaseService.findReturns(
      {
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
      },
      userId,
      isAdmin,
    );
  }

  async findOne(returnId: string, userId: string, isAdmin: boolean) {
    const returnRequest = await this.databaseService.findReturnById(
      returnId,
      userId,
      isAdmin,
    );
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return returnRequest;
  }

  async create(createReturnDto: CreateReturnDto, userId: string) {
    const order = await this.databaseService.findOrderById(
      createReturnDto.order_id,
      userId,
      false,
    );
    if (!order) {
      throw new BadRequestException(
        'Invalid order or order does not belong to user',
      );
    }

    const existingReturns = (
      await this.databaseService.findReturns(
        { page: 1, limit: 1000 },
        userId,
        false,
      )
    ).data;
    const existingReturn = existingReturns.find(
      (item) => item.orderId === createReturnDto.order_id,
    );
    if (existingReturn) {
      throw new BadRequestException(
        'A return request already exists for this order',
      );
    }

    return this.databaseService.createReturn({
      orderId: createReturnDto.order_id,
      userId,
      reason: createReturnDto.reason,
      status: ReturnStatus.REQUESTED,
      requestedAt: new Date(),
    });
  }

  async updateStatus(
    returnId: string,
    updateReturnStatusDto: UpdateReturnStatusDto,
    adminId: string,
  ) {
    const isAdmin = await this.databaseService.checkUserRole(
      adminId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update return status');
    }

    const currentReturn = await this.databaseService.findReturnById(
      returnId,
      undefined,
      true,
    );
    if (!currentReturn) {
      throw new NotFoundException('Return request not found');
    }

    return this.databaseService.updateReturnStatus(
      returnId,
      updateReturnStatusDto.status,
    );
  }

  async remove(returnId: string, userId: string, isAdmin: boolean) {
    const returnRequest = await this.databaseService.findReturnById(
      returnId,
      userId,
      isAdmin,
    );
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    if (!isAdmin && returnRequest.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own return requests',
      );
    }

    if (!isAdmin && returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException(
        'Processed return requests cannot be deleted',
      );
    }

    await this.databaseService.deleteReturn(returnId);
    return { message: 'Return request deleted successfully' };
  }
}
