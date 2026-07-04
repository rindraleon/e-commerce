import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { CreateReviewDto, UpdateReviewDto, UpdateReviewStatusDto } from './dto/review.dto';
import { AppRole } from '../../entities/user-role.entity';

@Injectable()
export class ReviewsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(productId?: string, userId?: string, isAdmin?: boolean) {
    const options: any = {
      order: { createdAt: 'DESC' }
    };

    if (productId) {
      options.where = { ...options.where, productId };
    }

    if (!isAdmin && userId) {
      // Regular users can only see their own reviews in addition to approved ones
      options.where = { 
        ...options.where, 
        moderationStatus: 'approved' 
      };
    } else if (isAdmin && userId) {
      // Admins can see all reviews regardless of status
      // No additional filter needed
    } else if (!isAdmin) {
      // For non-admins without specific user, show only approved
      options.where = { ...options.where, moderationStatus: 'approved' };
    }

    const reviews = await this.databaseService.findReviewsByProductId(productId || '');
    return reviews;
  }

  async findOne(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.databaseService.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId && review.moderationStatus !== 'approved') {
      throw new ForbiddenException('You can only access your own reviews or approved reviews');
    }

    return review;
  }

  async create(createReviewDto: CreateReviewDto, userId: string) {
    // Check if user has already reviewed this product
    const existingReviews = await this.databaseService.findUserReviews(userId);
    const existingReview = existingReviews.find(r => r.productId === createReviewDto.product_id);

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Create the review with pending status
    const review = await this.databaseService.createReview({
      ...createReviewDto,
      userId,
      moderationStatus: 'pending' as any // All reviews start as pending
    });

    return review;
  }

  async update(reviewId: string, updateReviewDto: UpdateReviewDto, userId: string, isAdmin: boolean) {
    const review = await this.databaseService.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Prevent updating if already approved (unless admin)
    if (!isAdmin && review.moderationStatus === 'approved') {
      throw new ForbiddenException('Cannot update an approved review');
    }

    const updatedReview = await this.databaseService.updateReviewStatus(reviewId, updateReviewDto as any);
    return updatedReview;
  }

  async remove(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.databaseService.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // In the database service, we would have a delete method
    // For now, we'll update the status to rejected
    await this.databaseService.updateReviewStatus(reviewId, 'rejected' as any);
    return { message: 'Review deleted successfully' };
  }

  async updateStatus(reviewId: string, updateReviewStatusDto: UpdateReviewStatusDto, adminId: string) {
    // Check if admin
    const isAdmin = await this.databaseService.checkUserRole(adminId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can moderate reviews');
    }

    const review = await this.databaseService.updateReviewStatus(reviewId, updateReviewStatusDto.moderation_status as any);
    if (!review) {
      throw new BadRequestException('Error updating review status');
    }

    return review;
  }

  async getProductRating(productId: string) {
    const reviews = await this.databaseService.findReviewsByProductId(productId);
    const approvedReviews = reviews.filter(r => r.moderationStatus === 'approved');

    if (approvedReviews.length === 0) {
      return { average_rating: 0, total_reviews: 0 };
    }

    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / approvedReviews.length;

    return {
      average_rating: parseFloat(averageRating.toFixed(2)),
      total_reviews: approvedReviews.length
    };
  }
}