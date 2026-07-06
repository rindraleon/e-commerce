import { useContext } from 'react';
import { WishlistContext } from '@/contexts/WishlistContext';

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
};
