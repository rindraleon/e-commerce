import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WishlistProductDto } from './dto/wishlist.dto';
import { WishlistService } from './wishlist.service';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.wishlistService.findAll(userId);
  }

  @Post()
  add(@Body() dto: WishlistProductDto, @CurrentUser('id') userId: string) {
    return this.wishlistService.add(dto, userId);
  }

  @Post('toggle')
  toggle(@Body() dto: WishlistProductDto, @CurrentUser('id') userId: string) {
    return this.wishlistService.toggle(dto, userId);
  }

  @Delete(':productId')
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.wishlistService.remove(productId, userId);
  }
}
