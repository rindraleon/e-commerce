import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminLogs = () => {
  const { t, lang } = useLanguage();

  const logsQuery = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => apiService.adminLogs.findAll({ page: 1, limit: 50 }),
  });

  const logs = logsQuery.data?.data || [];

  if (logsQuery.isLoading) return <PageState type="loading" title={t.common.loading} />;
  if (logsQuery.isError) return <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => logsQuery.refetch() }} />;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.logs}</h1>
      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{log.action}</p>
                <span className="text-xs text-muted-foreground">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</span>
              </div>
              <p className="text-sm text-muted-foreground">{log.admin?.profile?.fullName || log.admin?.email || log.adminId}</p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(log.details || {}, null, 2)}</pre>
            </CardContent>
          </Card>
        ))}
        {!logs.length && <PageState type="empty" title={t.common.noResults} />}
      </div>
    </div>
  );
};

export default AdminLogs;
