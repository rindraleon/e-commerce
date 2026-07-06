import * as common from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppRole } from '../../entities/user-role.entity';
import { CategoriesService } from './categories.service';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@common.Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @common.Get()
  async findAll(@common.Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @common.Get(':id')
  async findOne(@common.Param('id', common.ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @common.Post()
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  create(
    @common.Body() createDto: CreateCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.create(createDto, userId);
  }

  @common.Put(':id')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  update(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @common.Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, userId);
  }

  @common.Delete(':id')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  remove(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.remove(id, userId);
  }
}
