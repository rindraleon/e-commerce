import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto, UpdateReturnStatusDto } from './dto/return.dto';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async findAll(@Req() req) {
    const isAdmin = await this.returnsService['supabaseService'].checkUserRole(req.user.id, 'admin');
    return this.returnsService.findAll(req.user.id, isAdmin);
  }

  @Get(':returnId')
  async findOne(@Param('returnId', ParseUUIDPipe) returnId: string, @Req() req) {
    const isAdmin = await this.returnsService['supabaseService'].checkUserRole(req.user.id, 'admin');
    return this.returnsService.findOne(returnId, req.user.id, isAdmin);
  }

  @Post()
  async create(@Body() createReturnDto: CreateReturnDto, @Req() req) {
    return this.returnsService.create(createReturnDto, req.user.id);
  }

  @Put(':returnId/status')
  async updateStatus(
    @Param('returnId', ParseUUIDPipe) returnId: string,
    @Body() updateReturnStatusDto: UpdateReturnStatusDto,
    @Req() req,
  ) {
    return this.returnsService.updateStatus(returnId, updateReturnStatusDto, req.user.id);
  }

  @Delete(':returnId')
  async remove(@Param('returnId', ParseUUIDPipe) returnId: string, @Req() req) {
    const isAdmin = await this.returnsService['supabaseService'].checkUserRole(req.user.id, 'admin');
    return this.returnsService.remove(returnId, req.user.id, isAdmin);
  }
}