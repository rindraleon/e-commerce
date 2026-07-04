import * as common from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, BulkCreateProductImagesDto } from './dto/product.dto';

//@common.UseGuards(AuthGuard('jwt'))
@common.Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @common.Get()
  async findAll(
    @common.Query('page') page: number = 1,
    @common.Query('limit') limit: number = 10,
    @common.Query('category_id') category_id?: string,
    @common.Query('search') search?: string,
    @common.Query('min_price') min_price?: number,
    @common.Query('max_price') max_price?: number,
    @common.Query('in_stock') in_stock?: boolean,
    @common.Query('featured') featured?: boolean,
    @common.Query('new') new_prod?: boolean,
  ) {
    const filters = {
      category_id,
      search,
      min_price,
      max_price,
      in_stock,
      featured,
      new: new_prod,
    };

    return this.productsService.findAll(Number(page), Number(limit), filters);
  }

  @common.Get(':id')
  async findOne(@common.Param('id', common.ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  // Protect write endpoints
  @common.Post()
  @common.UseGuards(AuthGuard('jwt'))
  create(@common.Body() createProductDto: CreateProductDto, @common.Req() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.productsService.create(createProductDto, userId);
  }

  @common.Put(':id')
  @common.UseGuards(AuthGuard('jwt'))
  async update(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @common.Body() updateProductDto: UpdateProductDto,
    @common.Req() req,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.productsService.update(id, updateProductDto, userId);
  }

  @common.Delete(':id')
  @common.UseGuards(AuthGuard('jwt'))
  async remove(@common.Param('id', common.ParseUUIDPipe) id: string, @common.Req() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.productsService.remove(id, userId);
  }

  @common.Post(':productId/images')
  @common.UseGuards(AuthGuard('jwt'))
  async addImages(
    @common.Param('productId', common.ParseUUIDPipe) productId: string,
    @common.Body() bulkCreateProductImagesDto: BulkCreateProductImagesDto,
    @common.Req() req,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.productsService.addImages(productId, bulkCreateProductImagesDto, userId);
  }

  @common.Delete('images/:imageId')
  @common.UseGuards(AuthGuard('jwt'))
  async removeImage(
    @common.Param('imageId', common.ParseUUIDPipe) imageId: string,
    @common.Req() req,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new common.UnauthorizedException('User not authenticated');
    }
    return this.productsService.removeImage(imageId, userId);
  }

  @common.Get('category/:categoryId')
  async getProductsByCategory(
    @common.Param('categoryId', common.ParseUUIDPipe) categoryId: string,
    @common.Query('page') page: number = 1,
    @common.Query('limit') limit: number = 10,
  ) {
    return this.productsService.getProductsByCategory(categoryId, Number(page), Number(limit));
  }
}