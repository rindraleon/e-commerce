import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import apiService from '@/api/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from '@/types/domain';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  refresh: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.cart.findByUserId();
      setItems(response.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return;

    try {
      const existing = items.find((item) => item.productId === productId);
      if (existing) {
        await apiService.cart.update(existing.id, { quantity: existing.quantity + quantity });
      } else {
        await apiService.cart.add({ productId, quantity });
      }
      await fetchCart();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible d’ajouter au panier', variant: 'destructive' });
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    const cartItem = items.find((item) => item.productId === productId);
    if (!cartItem) return;

    try {
      if (quantity <= 0) {
        await apiService.cart.remove(cartItem.id);
      } else {
        await apiService.cart.update(cartItem.id, { quantity });
      }
      await fetchCart();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de mettre à jour le panier', variant: 'destructive' });
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const cartItem = items.find((item) => item.productId === productId);
    if (!cartItem) return;

    try {
      await apiService.cart.remove(cartItem.id);
      await fetchCart();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de supprimer cet article', variant: 'destructive' });
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      await apiService.cart.clear();
      setItems([]);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de vider le panier', variant: 'destructive' });
      throw error;
    }
  };

  const total = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeFromCart, clearCart, total, itemCount, refresh: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};
