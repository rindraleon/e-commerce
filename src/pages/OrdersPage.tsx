import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  paid: "bg-secondary text-secondary-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-accent text-accent-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, name_en, product_images(image_url, is_primary)))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { pending: t.orders.pending, paid: t.orders.paid, shipped: t.orders.shipped, delivered: t.orders.delivered, cancelled: t.orders.cancelled };
    return map[status] || status;
  };

  if (isLoading || authLoading) return <div className="container mx-auto px-4 py-20 text-center">{t.common.loading}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">{t.orders.title}</h1>
      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-heading font-bold">{t.orders.orderNumber} {order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusColors[order.status]}>{getStatusLabel(order.status)}</Badge>
                    <p className="font-bold text-primary mt-1">${order.total_amount}</p>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {order.order_items?.slice(0, 4).map((item: any) => {
                    const img = item.products?.product_images?.find((i: any) => i.is_primary)?.image_url || item.products?.product_images?.[0]?.image_url;
                    return (
                      <div key={item.id} className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-muted-foreground/30" />}
                      </div>
                    );
                  })}
                  {order.order_items?.length > 4 && <span className="text-sm text-muted-foreground self-center">+{order.order_items.length - 4}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">{t.orders.noOrders}</p>
          <Link to="/catalog"><Button>{t.cart.continueShopping}</Button></Link>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
