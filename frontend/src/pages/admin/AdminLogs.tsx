import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import apiService from "@/api/api-service";

const AdminLogs = () => {
  const { t } = useLanguage();

  const { data: logs } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      try {
        const data: any = await apiService.admin.getLogs(100);
        return data || [];
      } catch { return []; }
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.logs}</h1>
      <div className="space-y-2">
        {(logs as any[])?.map((log: any) => (
          <Card key={log.id}>
            <CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{log.action}</p>
                <p className="text-xs text-muted-foreground">{log.admin?.fullName || log.profiles?.full_name} — {JSON.stringify(log.details)}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt || log.created_at).toLocaleString()}</span>
            </CardContent>
          </Card>
        ))}
        {(!logs || (logs as any[]).length === 0) && <p className="text-muted-foreground">{t.common.noResults}</p>}
      </div>
    </div>
  );
};

export default AdminLogs;
