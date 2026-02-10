import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusOptions = ["pending", "paid", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, profiles:user_id(full_name, email)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateStatus = async (orderId: string, currentStatus: string, newStatus: string) => {
    // Business rules
    if (currentStatus === "cancelled" && newStatus === "shipped") {
      toast({ title: t.common.error, description: lang === "fr" ? "Impossible d'expédier une commande annulée" : "Cannot ship a cancelled order", variant: "destructive" });
      return;
    }
    if (currentStatus === "delivered") {
      toast({ title: t.common.error, description: lang === "fr" ? "Commande livrée non modifiable" : "Delivered order cannot be modified", variant: "destructive" });
      return;
    }
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    toast({ title: t.common.success });
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = { pending: t.orders.pending, paid: t.orders.paid, shipped: t.orders.shipped, delivered: t.orders.delivered, cancelled: t.orders.cancelled };
    return map[s] || s;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.orders}</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.orders.orderNumber}</TableHead>
                <TableHead>{lang === "fr" ? "Client" : "Client"}</TableHead>
                <TableHead>{t.orders.total}</TableHead>
                <TableHead>{t.orders.status}</TableHead>
                <TableHead>{t.orders.date}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-sm">{order.order_number}</TableCell>
                  <TableCell className="text-sm">{order.profiles?.full_name || order.profiles?.email}</TableCell>
                  <TableCell className="font-bold">${order.total_amount}</TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={v => updateStatus(order.id, order.status, v)} disabled={order.status === "delivered"}>
                      <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
