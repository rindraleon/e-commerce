import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminClients = () => {
  const { t, lang } = useLanguage();

  const clientsQuery = useQuery({
    queryKey: ['admin-clients'],
    queryFn: () => apiService.users.findAll({ role: 'client', page: 1, limit: 50 }),
  });

  const clients = clientsQuery.data?.data || [];

  if (clientsQuery.isLoading) return <PageState type="loading" title={t.common.loading} />;
  if (clientsQuery.isError) return <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => clientsQuery.refetch() }} />;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.clients}</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.auth.fullName}</TableHead>
                <TableHead>{t.auth.email}</TableHead>
                <TableHead>{lang === 'fr' ? 'Inscrit le' : 'Joined'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.profile?.fullName || '-'}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClients;
