import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminReturns = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: returns } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data } = await supabase.from("returns").select("*, orders:order_id(order_number), profiles:user_id(full_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "approved" || status === "rejected" || status === "refunded") update.resolved_at = new Date().toISOString();
    await supabase.from("returns").update(update).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-returns"] });
    toast({ title: t.common.success });
  };

  const statusColor: Record<string, string> = { requested: "bg-warning", approved: "bg-secondary", rejected: "bg-destructive", refunded: "bg-accent" };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.returns}</h1>
      <div className="space-y-4">
        {returns?.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{r.profiles?.full_name} — {r.orders?.order_number}</p>
                <p className="text-sm text-muted-foreground">{r.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor[r.status]}>{r.status}</Badge>
                <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                  <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["requested", "approved", "rejected", "refunded"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!returns || returns.length === 0) && <p className="text-muted-foreground">{t.common.noResults}</p>}
      </div>
    </div>
  );
};

export default AdminReturns;
