import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Users } from 'lucide-react';

const AdminUsers = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiService.users.findAll({ page: 1, limit: 50 }),
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiService.users.updateRole(userId, newRole);
      toast({ title: t.common.success, description: lang === 'fr' ? 'Rôle mis à jour avec succès' : 'Role updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message || 'Failed to update user role', variant: 'destructive' });
    }
  };

  const users = usersQuery.data?.data || [];

  if (usersQuery.isLoading) return <PageState type="loading" title={t.common.loading} />;
  if (usersQuery.isError) return <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => usersQuery.refetch() }} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.users}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> <span>{users.length} {lang === 'fr' ? 'utilisateurs' : 'users'}</span></div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'fr' ? 'Utilisateur' : 'User'}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{lang === 'fr' ? 'Rôle' : 'Role'}</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><User className="h-4 w-4 text-muted-foreground" /></div>
                      <div><div className="text-sm font-medium">{user.profile?.fullName || '-'}</div></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-primary' : ''}>
                      {user.role === 'admin' ? <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span> : 'Client'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
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

export default AdminUsers;
