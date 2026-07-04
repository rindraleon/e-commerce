import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AppRole } from '../../entities/user-role.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const categories = await this.databaseService.findCategories({
      order: { createdAt: 'DESC' }
    });

    return categories;
  }

  async findOne(id: string) {
    const category = await this.databaseService.findCategoryById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can create categories');
    }

    const category = await this.databaseService.createCategory(createCategoryDto);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update categories');
    }

    const category = await this.databaseService.updateCategory(id, updateCategoryDto);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async remove(id: string, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete categories');
    }

    await this.databaseService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}