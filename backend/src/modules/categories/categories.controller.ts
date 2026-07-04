import * as common from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

// remove class-level guard so GETs remain public
@common.Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @common.Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @common.Get(':id')
  async findOne(@common.Param('id', common.ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  // Keep write endpoints protected
  @common.Post()
  @common.UseGuards(AuthGuard('jwt')) // protéger création
  create(@common.Body() createDto: CreateCategoryDto, @common.Req() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.categoriesService.create(createDto, userId);
  }

  @common.Put(':id')
  @common.UseGuards(AuthGuard('jwt')) // protéger mise à jour
  async update(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @common.Body() updateCategoryDto: UpdateCategoryDto,
    @common.Req() req,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.categoriesService.update(id, updateCategoryDto, userId);
  }

  @common.Delete(':id')
  @common.UseGuards(AuthGuard('jwt')) // protéger suppression
  async remove(@common.Param('id', common.ParseUUIDPipe) id: string, @common.Req() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.categoriesService.remove(id, userId);
  }
}