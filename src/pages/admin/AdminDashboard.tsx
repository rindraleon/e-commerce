import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, AlertTriangle, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const { t, lang } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: totalOrders }, { data: revenue }, { count: lowStock }, { count: totalClients }] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount").in("status", ["paid", "shipped", "delivered"]),
        supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const totalRevenue = revenue?.reduce((s: number, o: any) => s + Number(o.total_amount), 0) || 0;
      return { totalOrders: totalOrders || 0, totalRevenue, lowStock: lowStock || 0, totalClients: totalClients || 0 };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, profiles:user_id(full_name)").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const statCards = [
    { label: t.admin.revenue, value: `$${stats?.totalRevenue.toFixed(2) || "0.00"}`, icon: DollarSign, color: "text-primary" },
    { label: t.admin.ordersToday, value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-secondary" },
    { label: t.admin.lowStock, value: stats?.lowStock || 0, icon: AlertTriangle, color: "text-warning" },
    { label: t.admin.totalClients, value: stats?.totalClients || 0, icon: Users, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.dashboard}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === "fr" ? "Commandes récentes" : "Recent orders"}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders?.map((order: any) => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{order.profiles?.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${order.total_amount}</p>
                  <p className="text-xs text-muted-foreground">{order.status}</p>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <p className="text-muted-foreground text-sm">{t.common.noResults}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
