import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Trash2 } from 'lucide-react';

export default function AdminSubscribers() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subscribersQuery = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: () => apiService.subscribers.findAll(),
  });

  const toggleStatus = async (subscriberId: string, nextStatus: boolean) => {
    try {
      await apiService.subscribers.updateStatus(subscriberId, nextStatus);
      toast({
        title: lang === 'fr' ? 'Abonné mis à jour' : 'Subscriber updated',
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: lang === 'fr' ? 'Erreur' : 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const deleteSubscriber = async (subscriberId: string) => {
    try {
      await apiService.subscribers.delete(subscriberId);
      toast({
        title: lang === 'fr' ? 'Abonné supprimé' : 'Subscriber deleted',
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: lang === 'fr' ? 'Erreur' : 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const subscribers = subscribersQuery.data?.data || [];

  if (subscribersQuery.isLoading) {
    return <PageState type="loading" title={lang === 'fr' ? 'Chargement...' : 'Loading...'} />;
  }

  if (subscribersQuery.isError) {
    return (
      <PageState
        type="error"
        title={lang === 'fr' ? 'Impossible de charger les abonnés' : 'Unable to load subscribers'}
        action={{
          label: lang === 'fr' ? 'Réessayer' : 'Retry',
          onClick: () => subscribersQuery.refetch(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === 'fr' ? 'Abonnés' : 'Subscribers'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'fr'
              ? 'Gérez les emails recevant les notifications de nouveaux produits.'
              : 'Manage the emails receiving new product notifications.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{subscribers.length}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>{lang === 'fr' ? 'Source' : 'Source'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Statut' : 'Status'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Inscription' : 'Created'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Actions' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>{subscriber.source || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={subscriber.isActive ? 'default' : 'secondary'}>
                      {subscriber.isActive
                        ? lang === 'fr'
                          ? 'Actif'
                          : 'Active'
                        : lang === 'fr'
                          ? 'Inactif'
                          : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {subscriber.createdAt
                      ? new Date(subscriber.createdAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStatus(subscriber.id, !subscriber.isActive)
                        }
                      >
                        {subscriber.isActive
                          ? lang === 'fr'
                            ? 'Désactiver'
                            : 'Disable'
                          : lang === 'fr'
                            ? 'Activer'
                            : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSubscriber(subscriber.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
