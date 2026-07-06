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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  ReviewQueryDto,
  UpdateReviewDto,
  UpdateReviewStatusDto,
} from './dto/review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findAll(
    @Query() query: ReviewQueryDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    const userId = req.user?.id;
    const isAdmin = await this.reviewsService.isAdmin(userId);
    return this.reviewsService.findAll(query, userId, isAdmin);
  }

  @Get('product/:productId/rating')
  async getProductRating(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getProductRating(productId);
  }

  @Get(':reviewId')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.reviewsService.isAdmin(userId);
    return this.reviewsService.findOne(reviewId, userId, isAdmin);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.create(createReviewDto, userId);
  }

  @Put(':reviewId')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.reviewsService.isAdmin(userId);
    return this.reviewsService.update(
      reviewId,
      updateReviewDto,
      userId,
      isAdmin,
    );
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.reviewsService.isAdmin(userId);
    return this.reviewsService.remove(reviewId, userId, isAdmin);
  }

  @Put(':reviewId/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() updateReviewStatusDto: UpdateReviewStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.updateStatus(
      reviewId,
      updateReviewStatusDto,
      userId,
    );
  }
}
