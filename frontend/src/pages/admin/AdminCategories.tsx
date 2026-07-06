import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const AdminCategories = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiService.categories.findAll({ page: 1, limit: 50 }),
  });

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setNameEn('');
    setDescription('');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingId) {
        await apiService.categories.update(editingId, { name, nameEn, description });
      } else {
        await apiService.categories.create({ name, nameEn, description });
      }
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.categories.delete(id);
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    }
  };

  const categories = categoriesQuery.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.categories}</h1>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> {lang === 'fr' ? 'Ajouter' : 'Add'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? t.common.edit : lang === 'fr' ? 'Nouvelle catégorie' : 'New category'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label>{lang === 'fr' ? 'Nom (FR)' : 'Name (FR)'}</Label><Input required value={name} onChange={(event) => setName(event.target.value)} /></div>
              <div><Label>{lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'}</Label><Input value={nameEn} onChange={(event) => setNameEn(event.target.value)} /></div>
              <div><Label>Description</Label><Input value={description} onChange={(event) => setDescription(event.target.value)} /></div>
              <Button type="submit" className="w-full">{t.common.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'fr' ? 'Nom' : 'Name'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'}</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.nameEn || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingId(category.id); setName(category.name); setNameEn(category.nameEn || ''); setDescription(category.description || ''); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
};

export default AdminCategories;
