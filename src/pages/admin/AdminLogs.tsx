import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

const AdminLogs = () => {
  const { t, lang } = useLanguage();

  const { data: logs } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_logs").select("*, profiles:admin_id(full_name)").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.logs}</h1>
      <div className="space-y-2">
        {logs?.map((log: any) => (
          <Card key={log.id}>
            <CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{log.action}</p>
                <p className="text-xs text-muted-foreground">{log.profiles?.full_name} — {JSON.stringify(log.details)}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
            </CardContent>
          </Card>
        ))}
        {(!logs || logs.length === 0) && <p className="text-muted-foreground">{t.common.noResults}</p>}
      </div>
    </div>
  );
};

export default AdminLogs;
