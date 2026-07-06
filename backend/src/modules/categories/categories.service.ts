import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../entities/user-role.entity';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  private toEntityPayload(dto: CreateCategoryDto | UpdateCategoryDto) {
    return {
      name: dto.name,
      nameEn: dto.name_en,
      description: dto.description,
      descriptionEn: dto.description_en,
      icon: dto.icon,
      imageUrl: dto.image_url,
    };
  }

  async findAll(query: CategoryQueryDto) {
    return this.databaseService.findCategories({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
  }

  async findOne(id: string) {
    const category = await this.databaseService.findCategoryById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can create categories');
    }

    return this.databaseService.createCategory(
      this.toEntityPayload(createCategoryDto),
    );
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update categories');
    }

    const category = await this.databaseService.findCategoryById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.databaseService.updateCategory(
      id,
      this.toEntityPayload(updateCategoryDto),
    );
  }

  async remove(id: string, userId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete categories');
    }

    const category = await this.databaseService.findCategoryById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.databaseService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}
