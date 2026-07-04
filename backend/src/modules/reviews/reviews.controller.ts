import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, ParseUUIDPipe, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, UpdateReviewStatusDto } from './dto/review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findAll(
    @Query('product_id') productId?: string,
    @Req() req?,
  ) {
    // If no user in request, assume public access (only approved reviews)
    const userId = req?.user?.id;
    const isAdmin = userId ? await this.reviewsService['supabaseService'].checkUserRole(userId, 'admin') : false;
    
    return this.reviewsService.findAll(productId, userId, isAdmin);
  }

  @Get(':reviewId')
  async findOne(@Param('reviewId', ParseUUIDPipe) reviewId: string, @Req() req) {
    const isAdmin = await this.reviewsService['supabaseService'].checkUserRole(req.user.id, 'admin');
    return this.reviewsService.findOne(reviewId, req.user.id, isAdmin);
  }

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto, @Req() req) {
    return this.reviewsService.create(createReviewDto, req.user.id);
  }

  @Put(':reviewId')
  async update(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req,
  ) {
    const isAdmin = await this.reviewsService['supabaseService'].checkUserRole(req.user.id, 'admin');
    return this.reviewsService.update(reviewId, updateReviewDto, req.user.id, isAdmin);
  }

  @Delete(':reviewId')
  async remove(@Param('reviewId', ParseUUIDPipe) reviewId: string, @Req() req) {
    const isAdmin = await this.reviewsService['supabaseService'].checkUserRole(req.user.id, 'admin');
    return this.reviewsService.remove(reviewId, req.user.id, isAdmin);
  }

  @Put(':reviewId/status')
  async updateStatus(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() updateReviewStatusDto: UpdateReviewStatusDto,
    @Req() req,
  ) {
    return this.reviewsService.updateStatus(reviewId, updateReviewStatusDto, req.user.id);
  }

  @Get('product/:productId/rating')
  async getProductRating(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getProductRating(productId);
  }
}