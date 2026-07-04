import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiService from "@/api/api-service";

const statusOptions = ["pending", "paid", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      try {
        const data: any = await apiService.orders.findByUserId();
        return data || [];
      } catch { return []; }
    },
  });

  const updateStatus = async (orderId: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === "cancelled" && newStatus === "shipped") {
      toast({
        title: t.common.error,
        description: lang === "fr" ? "Impossible d'expédier une commande annulée" : "Cannot ship a cancelled order",
        variant: "destructive"
      });
      return;
    }
    if (currentStatus === "delivered") {
      toast({
        title: t.common.error,
        description: lang === "fr" ? "Commande livrée non modifiable" : "Delivered order cannot be modified",
        variant: "destructive"
      });
      return;
    }
    try {
      await apiService.orders.updateStatus(orderId, { status: newStatus });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: t.common.success });
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error.message || "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t.orders.pending,
      paid: t.orders.paid,
      shipped: t.orders.shipped,
      delivered: t.orders.delivered,
      cancelled: t.orders.cancelled
    };
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
                <TableHead>Client</TableHead>
                <TableHead>{t.orders.total}</TableHead>
                <TableHead>{t.orders.status}</TableHead>
                <TableHead>{t.orders.date}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders as any[])?.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-sm">{order.orderNumber || order.order_number}</TableCell>
                  <TableCell className="text-sm">{order.user?.fullName || order.profiles?.full_name || order.profiles?.email}</TableCell>
                  <TableCell className="font-bold">${order.totalAmount || order.total_amount}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={v => updateStatus(order.id, order.status, v)}
                      disabled={order.status === "delivered"}>
                      <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem
                          key={s}
                          value={s}>{getStatusLabel(s)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt || order.created_at).toLocaleDateString()}
                  </TableCell>
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
