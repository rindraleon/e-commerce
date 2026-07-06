import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../entities/user-role.entity';
import { ModerationStatus } from '../../entities/review.entity';
import {
  CreateReviewDto,
  ReviewQueryDto,
  UpdateReviewDto,
  UpdateReviewStatusDto,
} from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async isAdmin(userId?: string) {
    if (!userId) return false;
    return this.databaseService.checkUserRole(userId, AppRole.ADMIN);
  }

  async findAll(query: ReviewQueryDto, requesterId?: string, isAdmin = false) {
    const targetUserId = query.user_id || (!isAdmin ? requesterId : undefined);

    return this.databaseService.findReviews(
      {
        page: query.page,
        limit: query.limit,
        productId: query.product_id,
        userId: targetUserId,
        moderationStatus: query.moderation_status,
        sortBy: query.sortBy,
        order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
      },
      isAdmin,
    );
  }

  async findOne(reviewId: string, userId?: string, isAdmin = false) {
    const review = await this.databaseService.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (
      !isAdmin &&
      review.userId !== userId &&
      review.moderationStatus !== ModerationStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'You can only access approved reviews or your own reviews',
      );
    }

    return review;
  }

  async create(createReviewDto: CreateReviewDto, userId: string) {
    const product = await this.databaseService.findProductById(
      createReviewDto.product_id,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingReviews = await this.databaseService.findUserReviews(userId);
    const existingReview = existingReviews.find(
      (review) => review.productId === createReviewDto.product_id,
    );
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    return this.databaseService.createReview({
      productId: createReviewDto.product_id,
      userId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      moderationStatus: ModerationStatus.PENDING,
    });
  }

  async update(
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
    isAdmin: boolean,
  ) {
    const review = await this.databaseService.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    if (!isAdmin && review.moderationStatus === ModerationStatus.APPROVED) {
      throw new ForbiddenException(
        'Approved reviews can only be modified by admins',
      );
    }

    const updatedReview = await this.databaseService.updateReview(reviewId, {
      rating: updateReviewDto.rating,
      comment: updateReviewDto.comment,
      moderationStatus: isAdmin
        ? review.moderationStatus
        : ModerationStatus.PENDING,
    });

    if (!updatedReview) {
      throw new NotFoundException('Review not found');
    }

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

    await this.databaseService.deleteReview(reviewId);
    return { message: 'Review deleted successfully' };
  }

  async updateStatus(
    reviewId: string,
    updateReviewStatusDto: UpdateReviewStatusDto,
    adminId: string,
  ) {
    const isAdmin = await this.databaseService.checkUserRole(
      adminId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can moderate reviews');
    }

    const review = await this.databaseService.updateReviewStatus(
      reviewId,
      updateReviewStatusDto.moderation_status,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async getProductRating(productId: string) {
    const reviews = (
      await this.databaseService.findReviews({
        page: 1,
        limit: 1000,
        productId,
        moderationStatus: ModerationStatus.APPROVED,
      })
    ).data;

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      averageRating: Number((totalRating / reviews.length).toFixed(2)),
      totalReviews: reviews.length,
    };
  }
}
