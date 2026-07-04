import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/api/api-service";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    name_en: string;
    price: number;
    stock: number;
    image_url?: string;
  };
}

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
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const response: any = await apiService.cart.findByUserId(user.id);
      // Backend returns { items: [...], total_items, total_amount }
      const cartItems = response?.items || response || [];
      setItems(cartItems.map((item: any) => ({
        id: item.id,
        product_id: item.productId || item.product_id,
        quantity: item.quantity,
        product: {
          id: item.product?.id || item.productId || item.product_id,
          name: item.product?.name || "Product",
          name_en: item.product?.name_en || item.product?.name || "Product",
          price: Number(item.product?.price || 0),
          stock: item.product?.stock || 0,
          image_url: item.product?.product_images?.[0]?.image_url || item.product?.image_url || "",
        },
      })));
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setItems([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return;
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await updateQuantity(productId, existing.quantity + quantity);
    } else {
      try {
        await apiService.cart.add({ productId, quantity });
        await fetchCart();
      } catch (err) {
        console.error('Failed to add to cart:', err);
      }
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) { await removeFromCart(productId); return; }
    const cartItem = items.find(item => item.product_id === productId);
    if (!cartItem) return;
    try {
      await apiService.cart.update(cartItem.id, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update cart item:', err);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const cartItem = items.find(item => item.product_id === productId);
    if (!cartItem) return;
    try {
      await apiService.cart.remove(cartItem.id);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      await apiService.cart.clear(user.id);
      setItems([]);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeFromCart, clearCart, total, itemCount, refresh: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};
