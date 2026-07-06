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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CreateReturnDto,
  ReturnQueryDto,
  UpdateReturnStatusDto,
} from './dto/return.dto';
import { ReturnsService } from './returns.service';

@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async findAll(
    @Query() query: ReturnQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.returnsService.isAdmin(userId);
    return this.returnsService.findAll(query, userId, isAdmin);
  }

  @Get(':returnId')
  async findOne(
    @Param('returnId', ParseUUIDPipe) returnId: string,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.returnsService.isAdmin(userId);
    return this.returnsService.findOne(returnId, userId, isAdmin);
  }

  @Post()
  create(
    @Body() createReturnDto: CreateReturnDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.returnsService.create(createReturnDto, userId);
  }

  @Put(':returnId/status')
  updateStatus(
    @Param('returnId', ParseUUIDPipe) returnId: string,
    @Body() updateReturnStatusDto: UpdateReturnStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.returnsService.updateStatus(
      returnId,
      updateReturnStatusDto,
      userId,
    );
  }

  @Delete(':returnId')
  async remove(
    @Param('returnId', ParseUUIDPipe) returnId: string,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.returnsService.isAdmin(userId);
    return this.returnsService.remove(returnId, userId, isAdmin);
  }
}
