import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Coupon, CouponType } from '../../entities/coupon.entity';
import { AppRole } from '../../entities/user-role.entity';
import {
  CouponQueryDto,
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  ValidateCouponItemDto,
} from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private normalizeUuidList(values?: string[]) {
    if (!values?.length) {
      return [];
    }

    return Array.from(
      new Set(values.map((value) => value.trim()).filter(Boolean)),
    );
  }

  private async ensureAdmin(userId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can manage coupons');
    }
  }

  private mapCouponPayload(dto: CreateCouponDto | UpdateCouponDto) {
    return {
      code: dto.code ? this.normalizeCode(dto.code) : undefined,
      description:
        dto.description !== undefined
          ? dto.description.trim() || null
          : undefined,
      type: dto.type,
      value: dto.value,
      minOrderAmount:
        dto.min_order_amount !== undefined ? dto.min_order_amount : undefined,
      maxDiscountAmount:
        dto.max_discount_amount !== undefined
          ? dto.max_discount_amount
          : undefined,
      usageLimit: dto.usage_limit !== undefined ? dto.usage_limit : undefined,
      isActive: dto.is_active,
      isSingleUsePerUser: dto.is_single_use_per_user,
      isForNewCustomers: dto.is_for_new_customers,
      allowedCategoryIds:
        dto.allowed_category_ids !== undefined
          ? this.normalizeUuidList(dto.allowed_category_ids)
          : undefined,
      allowedProductIds:
        dto.allowed_product_ids !== undefined
          ? this.normalizeUuidList(dto.allowed_product_ids)
          : undefined,
      startsAt:
        dto.starts_at !== undefined
          ? dto.starts_at
            ? new Date(dto.starts_at)
            : null
          : undefined,
      expiresAt:
        dto.expires_at !== undefined
          ? dto.expires_at
            ? new Date(dto.expires_at)
            : null
          : undefined,
    };
  }

  private ensureCouponSchedule(coupon: Partial<Coupon>) {
    if (
      coupon.startsAt &&
      coupon.expiresAt &&
      coupon.startsAt > coupon.expiresAt
    ) {
      throw new BadRequestException(
        'Coupon start date must be before expiry date',
      );
    }
  }

  private hasScopedRestrictions(coupon: Coupon) {
    return Boolean(
      coupon.allowedCategoryIds?.length || coupon.allowedProductIds?.length,
    );
  }

  private isEligibleItem(coupon: Coupon, item: ValidateCouponItemDto) {
    const matchesProduct = coupon.allowedProductIds?.includes(item.product_id);
    const matchesCategory = item.category_id
      ? coupon.allowedCategoryIds?.includes(item.category_id)
      : false;

    if (coupon.allowedProductIds?.length && coupon.allowedCategoryIds?.length) {
      return Boolean(matchesProduct || matchesCategory);
    }

    if (coupon.allowedProductIds?.length) {
      return Boolean(matchesProduct);
    }

    if (coupon.allowedCategoryIds?.length) {
      return Boolean(matchesCategory);
    }

    return true;
  }

  private calculateEligibleSubtotal(
    coupon: Coupon,
    subtotal: number,
    items?: ValidateCouponItemDto[],
  ) {
    const normalizedSubtotal = Math.max(Number(subtotal || 0), 0);

    if (!this.hasScopedRestrictions(coupon)) {
      return normalizedSubtotal;
    }

    if (!items?.length) {
      throw new BadRequestException(
        'This coupon requires eligible products or categories in the cart',
      );
    }

    const eligibleSubtotal = items
      .filter((item) => this.isEligibleItem(coupon, item))
      .reduce(
        (sum, item) => sum + Number(item.unit_price) * Number(item.quantity),
        0,
      );

    if (eligibleSubtotal <= 0) {
      throw new BadRequestException(
        'This coupon does not apply to the selected products',
      );
    }

    return Math.min(eligibleSubtotal, normalizedSubtotal);
  }

  calculateDiscountAmount(
    coupon: Coupon,
    subtotal: number,
    items?: ValidateCouponItemDto[],
  ) {
    const eligibleSubtotal = this.calculateEligibleSubtotal(
      coupon,
      subtotal,
      items,
    );
    let discountAmount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = (eligibleSubtotal * Number(coupon.value)) / 100;
    } else {
      discountAmount = Number(coupon.value);
    }

    if (
      coupon.maxDiscountAmount !== null &&
      coupon.maxDiscountAmount !== undefined
    ) {
      discountAmount = Math.min(
        discountAmount,
        Number(coupon.maxDiscountAmount),
      );
    }

    return Math.min(discountAmount, eligibleSubtotal);
  }

  async assertCouponIsValid(
    coupon: Coupon,
    subtotal: number,
    items?: ValidateCouponItemDto[],
    userId?: string,
  ) {
    const now = new Date();
    const normalizedSubtotal = Math.max(Number(subtotal || 0), 0);

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is inactive');
    }

    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new BadRequestException('This coupon is not active yet');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      throw new BadRequestException('This coupon has expired');
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    if (
      coupon.minOrderAmount !== null &&
      coupon.minOrderAmount !== undefined &&
      normalizedSubtotal < Number(coupon.minOrderAmount)
    ) {
      throw new BadRequestException(
        `Minimum order amount is ${Number(coupon.minOrderAmount).toFixed(2)}`,
      );
    }

    if (Number(coupon.value) <= 0) {
      throw new BadRequestException('Coupon value must be greater than zero');
    }

    if (coupon.isForNewCustomers && userId) {
      const orderCount = await this.databaseService.countUserOrders(userId);
      if (orderCount > 0) {
        throw new BadRequestException(
          'This coupon is reserved for new customers',
        );
      }
    }

    if (coupon.isSingleUsePerUser && userId) {
      const existingUsage = await this.databaseService.findCouponUsage(
        coupon.id,
        userId,
      );
      if (existingUsage) {
        throw new BadRequestException(
          'This coupon has already been used by this account',
        );
      }
    }

    this.calculateEligibleSubtotal(coupon, normalizedSubtotal, items);
  }

  async validateCoupon(dto: ValidateCouponDto, userId?: string) {
    const coupon = await this.databaseService.findCouponByCode(dto.code);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.assertCouponIsValid(coupon, dto.subtotal, dto.items, userId);

    return {
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: Number(coupon.value),
      discountAmount: this.calculateDiscountAmount(
        coupon,
        dto.subtotal,
        dto.items,
      ),
      minOrderAmount:
        coupon.minOrderAmount !== null && coupon.minOrderAmount !== undefined
          ? Number(coupon.minOrderAmount)
          : null,
      maxDiscountAmount:
        coupon.maxDiscountAmount !== null &&
        coupon.maxDiscountAmount !== undefined
          ? Number(coupon.maxDiscountAmount)
          : null,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      isSingleUsePerUser: coupon.isSingleUsePerUser,
      isForNewCustomers: coupon.isForNewCustomers,
      allowedCategoryIds: coupon.allowedCategoryIds || [],
      allowedProductIds: coupon.allowedProductIds || [],
    };
  }

  async findAll(query: CouponQueryDto, userId: string) {
    await this.ensureAdmin(userId);
    return this.databaseService.findCoupons({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.is_active,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
  }

  async create(dto: CreateCouponDto, userId: string) {
    await this.ensureAdmin(userId);

    const existingCoupon = await this.databaseService.findCouponByCode(
      dto.code,
    );
    if (existingCoupon) {
      throw new BadRequestException('A coupon with this code already exists');
    }

    const payload = this.mapCouponPayload(dto);
    this.ensureCouponSchedule(payload);

    return this.databaseService.createCoupon({
      ...payload,
      isActive: dto.is_active ?? true,
      isSingleUsePerUser: dto.is_single_use_per_user ?? true,
      isForNewCustomers: dto.is_for_new_customers ?? false,
      allowedCategoryIds: this.normalizeUuidList(dto.allowed_category_ids),
      allowedProductIds: this.normalizeUuidList(dto.allowed_product_ids),
    });
  }

  async update(couponId: string, dto: UpdateCouponDto, userId: string) {
    await this.ensureAdmin(userId);

    const existingCoupon = await this.databaseService.findCouponById(couponId);
    if (!existingCoupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (dto.code) {
      const couponWithSameCode = await this.databaseService.findCouponByCode(
        dto.code,
      );
      if (couponWithSameCode && couponWithSameCode.id !== couponId) {
        throw new BadRequestException('A coupon with this code already exists');
      }
    }

    const payload = this.mapCouponPayload(dto);
    this.ensureCouponSchedule({
      startsAt: payload.startsAt ?? existingCoupon.startsAt,
      expiresAt: payload.expiresAt ?? existingCoupon.expiresAt,
    });

    const updatedCoupon = await this.databaseService.updateCoupon(
      couponId,
      payload,
    );
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found');
    }

    return updatedCoupon;
  }

  async remove(couponId: string, userId: string) {
    await this.ensureAdmin(userId);

    const existingCoupon = await this.databaseService.findCouponById(couponId);
    if (!existingCoupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.databaseService.deleteCoupon(couponId);
    return { message: 'Coupon deleted successfully' };
  }

  async getValidatedCouponForOrder(
    code: string,
    subtotal: number,
    userId: string,
    items: ValidateCouponItemDto[],
  ) {
    const validation = await this.validateCoupon(
      { code, subtotal, items },
      userId,
    );
    const coupon = await this.databaseService.findCouponById(
      validation.couponId,
    );
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      coupon,
      discountAmount: validation.discountAmount,
    };
  }

  async markCouponAsUsed(couponId: string, userId: string, orderId?: string) {
    await this.databaseService.createCouponUsage({
      couponId,
      userId,
      orderId: orderId || null,
    });
    await this.databaseService.incrementCouponUsage(couponId);
  }
}
