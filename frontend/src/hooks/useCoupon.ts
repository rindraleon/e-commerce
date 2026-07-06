import { useCallback, useEffect, useMemo, useState } from 'react';
import apiService from '@/api/api-service';
import { CouponValidationResult } from '@/types/domain';

const STORAGE_KEY = 'eshop_coupon_code';

interface CouponCartItemInput {
  productId: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
}

export function useCoupon(
  subtotal: number,
  items: CouponCartItemInput[] = [],
) {
  const [couponCode, setCouponCode] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem(STORAGE_KEY) || '';
  });
  const [inputCode, setInputCode] = useState(couponCode);
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const clearCoupon = useCallback(() => {
    setCouponCode('');
    setInputCode('');
    setAppliedCoupon(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const validateCoupon = useCallback(
    async (codeToValidate: string, silent = false) => {
      const normalizedCode = codeToValidate.trim();
      if (!normalizedCode) {
        clearCoupon();
        return null;
      }

      setIsValidating(true);
      try {
        const result = await apiService.coupons.validate(
          normalizedCode,
          subtotal,
          items,
        );
        setCouponCode(result.code);
        setInputCode(result.code);
        setAppliedCoupon(result);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, result.code);
        }
        return result;
      } catch (error) {
        if (!silent) {
          throw error;
        }
        clearCoupon();
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    [clearCoupon, items, subtotal],
  );

  useEffect(() => {
    if (!couponCode || subtotal <= 0 || !items.length) {
      if (subtotal <= 0 || !items.length) {
        clearCoupon();
      }
      return;
    }

    void validateCoupon(couponCode, true);
  }, [clearCoupon, couponCode, items.length, subtotal, validateCoupon]);

  const discountAmount = useMemo(
    () => appliedCoupon?.discountAmount || 0,
    [appliedCoupon],
  );

  return {
    couponCode,
    inputCode,
    setInputCode,
    appliedCoupon,
    isValidating,
    discountAmount,
    applyCoupon: () => validateCoupon(inputCode, false),
    removeCoupon: clearCoupon,
  };
}
