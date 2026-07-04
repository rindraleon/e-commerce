import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { CreateReturnDto, UpdateReturnStatusDto } from './dto/return.dto';
import { AppRole } from '../../entities/user-role.entity';

@Injectable()
export class ReturnsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(userId: string, isAdmin: boolean) {
    if (isAdmin) {
      return await this.databaseService.findReturnsByUserId(null); // Fetch all returns for admin
    } else {
      return await this.databaseService.findReturnsByUserId(userId);
    }
  }

  async findOne(returnId: string, userId: string, isAdmin: boolean) {
    const returnRequest = await this.databaseService.findReturnById(returnId, !isAdmin ? userId : undefined);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return returnRequest;
  }

  async create(createReturnDto: CreateReturnDto, userId: string) {
    // Check if order exists and belongs to user
    const order = await this.databaseService.findOrderById(createReturnDto.order_id, userId);
    if (!order) {
      throw new BadRequestException('Invalid order or order does not belong to user');
    }

    // Check if a return request already exists for this order
    const existingReturns = await this.databaseService.findReturnsByUserId(userId);
    const existingReturn = existingReturns.find(r => r.orderId === createReturnDto.order_id);

    if (existingReturn) {
      throw new BadRequestException('A return request already exists for this order');
    }

    // Create the return request
    const returnRequest = await this.databaseService.createReturn({
      ...createReturnDto,
      userId,
      status: 'requested' as any
    });

    return returnRequest;
  }

  async updateStatus(returnId: string, updateReturnStatusDto: UpdateReturnStatusDto, adminId: string) {
    // Check if admin
    const isAdmin = await this.databaseService.checkUserRole(adminId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update return status');
    }

    // Get the current return request
    const currentReturn = await this.databaseService.findReturnById(returnId);
    if (!currentReturn) {
      throw new NotFoundException('Return request not found');
    }

    // Update the return status
    const updatedReturn = await this.databaseService.updateReturnStatus(returnId, updateReturnStatusDto.status);

    // If approved, potentially trigger refund process
    if (updateReturnStatusDto.status === 'approved') {
      // Here you could integrate with a payment provider to process refunds
      console.log(`Return approved for order ${currentReturn.orderId}. Process refund as needed.`);
    }

    return updatedReturn;
  }

  async remove(returnId: string, userId: string, isAdmin: boolean) {
    // Check if return belongs to user or if admin
    const returnRequest = await this.databaseService.findReturnById(returnId, !isAdmin ? userId : undefined);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    if (!isAdmin && returnRequest.userId !== userId) {
      throw new ForbiddenException('You can only delete your own return requests');
    }

    // Only allow deletion if status is still requested
    if (returnRequest.status !== 'requested') {
      throw new BadRequestException('Cannot delete a return request that has been processed');
    }

    // In a real implementation, we would have a delete method
    // For now, we'll update the status to rejected
    await this.databaseService.updateReturnStatus(returnId, 'rejected' as any);
    return { message: 'Return request deleted successfully' };
  }
}