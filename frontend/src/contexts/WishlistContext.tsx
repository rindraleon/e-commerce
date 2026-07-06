import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import apiService from '@/api/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { WishlistItem } from '@/types/domain';

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  itemCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.wishlist.findAll();
      setItems(response);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchWishlist();
  }, [fetchWishlist]);

  const productIdSet = useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items],
  );

  const isInWishlist = useCallback(
    (productId: string) => productIdSet.has(productId),
    [productIdSet],
  );

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      return false;
    }

    try {
      const response = await apiService.wishlist.toggle(productId);
      await fetchWishlist();
      return Boolean((response as { added?: boolean })?.added);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour les favoris';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) {
      return;
    }

    try {
      await apiService.wishlist.remove(productId);
      await fetchWishlist();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de retirer ce favori';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        itemCount: items.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refresh: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
