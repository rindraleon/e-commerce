import * as common from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { productImageMulterOptions } from '../../common/utils/upload.util';
import { AppRole } from '../../entities/user-role.entity';
import {
  BulkCreateProductImagesDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

interface UploadedProductFile {
  filename: string;
}

@common.Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @common.Get()
  async findAll(@common.Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @common.Get('category/:categoryId')
  async getProductsByCategory(
    @common.Param('categoryId', common.ParseUUIDPipe) categoryId: string,
    @common.Query('page') page = 1,
    @common.Query('limit') limit = 10,
  ) {
    return this.productsService.getProductsByCategory(
      categoryId,
      Number(page),
      Number(limit),
    );
  }

  @common.Get(':id')
  async findOne(@common.Param('id', common.ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @common.Post()
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  create(
    @common.Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.create(createProductDto, userId);
  }

  @common.Post('with-files')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  @common.UseInterceptors(
    FilesInterceptor('images', 10, productImageMulterOptions),
  )
  createWithFiles(
    @common.Body() createProductDto: CreateProductDto,
    @common.UploadedFiles() files: UploadedProductFile[],
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.createWithFiles(
      createProductDto,
      files || [],
      userId,
    );
  }

  @common.Put(':id')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  update(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @common.Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, updateProductDto, userId);
  }

  @common.Put(':id/with-files')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  @common.UseInterceptors(
    FilesInterceptor('images', 10, productImageMulterOptions),
  )
  updateWithFiles(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @common.Body() updateProductDto: UpdateProductDto,
    @common.UploadedFiles() files: UploadedProductFile[],
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.updateWithFiles(
      id,
      updateProductDto,
      files || [],
      userId,
    );
  }

  @common.Delete(':id')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  remove(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.remove(id, userId);
  }

  @common.Post(':productId/images')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  addImages(
    @common.Param('productId', common.ParseUUIDPipe) productId: string,
    @common.Body() bulkCreateProductImagesDto: BulkCreateProductImagesDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.addImages(
      productId,
      bulkCreateProductImagesDto,
      userId,
    );
  }

  @common.Post(':productId/images/upload')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  @common.UseInterceptors(
    FilesInterceptor('images', 10, productImageMulterOptions),
  )
  addUploadedImages(
    @common.Param('productId', common.ParseUUIDPipe) productId: string,
    @common.UploadedFiles() files: UploadedProductFile[],
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.addUploadedImages(
      productId,
      files || [],
      userId,
    );
  }

  @common.Delete('images/:imageId')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  removeImage(
    @common.Param('imageId', common.ParseUUIDPipe) imageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.removeImage(imageId, userId);
  }
}
