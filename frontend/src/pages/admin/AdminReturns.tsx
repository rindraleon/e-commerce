import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiService from "@/api/api-service";

const AdminReturns = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: returns } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      try {
        const result = await apiService.returns.findAll();
        return Array.isArray(result) ? result : (result?.data || []);
      } catch { return []; }
    },
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiService.returns.updateStatus(id, status);
      qc.invalidateQueries({ queryKey: ["admin-returns"] });
      toast({ title: t.common.success });
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error.message || "Failed to update return status",
        variant: "destructive",
      });
    }
  };

  const statusColor: Record<string, string> = {
    requested: "bg-warning",
    approved: "bg-secondary",
    rejected: "bg-destructive",
    refunded: "bg-accent",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.returns}</h1>
      <div className="space-y-4">
        {(returns as any[])?.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{r.user?.fullName || r.profiles?.full_name} — {r.order?.orderNumber || r.orders?.order_number}</p>
                <p className="text-sm text-muted-foreground">{r.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor[r.status]}>{r.status}</Badge>
                <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                  <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["requested", "approved", "rejected", "refunded"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!returns || (returns as any[]).length === 0) && <p className="text-muted-foreground">{t.common.noResults}</p>}
      </div>
    </div>
  );
};

export default AdminReturns;
