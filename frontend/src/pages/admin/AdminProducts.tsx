import { ChangeEvent, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/types/domain';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';

interface ProductFormState {
  name: string;
  nameEn: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  isFeatured: boolean;
  isNew: boolean;
}

const emptyForm: ProductFormState = {
  name: '',
  nameEn: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: '',
  isFeatured: false,
  isNew: false,
};

const AdminProducts = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiService.products.findAll({ page: 1, limit: 50 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-product-categories'],
    queryFn: () => apiService.categories.findAll({ page: 1, limit: 100 }),
  });

  const categories = categoriesQuery.data?.data || [];
  const products = productsQuery.data?.data || [];

  const fileNames = useMemo(() => selectedFiles.map((file) => file.name), [selectedFiles]);

  const resetForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setSelectedFiles([]);
  };

  const openForEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      nameEn: product.nameEn || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId || '',
      isFeatured: !!product.isFeatured,
      isNew: !!product.isNew,
    });
    setSelectedFiles([]);
    setOpen(true);
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = {
        ...form,
        imageFiles: selectedFiles,
      };

      if (editingProduct) {
        await apiService.products.update(editingProduct.id, payload);
      } else {
        await apiService.products.create(payload);
      }

      toast({
        title: t.common.success,
        description:
          lang === 'fr'
            ? 'Produit enregistré avec succès.'
            : 'Product saved successfully.',
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setOpen(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: t.common.error, description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.products.delete(id);
      toast({ title: t.common.success });
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: t.common.error, description: message, variant: 'destructive' });
    }
  };

  if (productsQuery.isLoading) {
    return <PageState type="loading" title={t.common.loading} />;
  }

  if (productsQuery.isError) {
    return (
      <PageState
        type="error"
        title={t.common.error}
        action={{
          label: lang === 'fr' ? 'Réessayer' : 'Retry',
          onClick: () => productsQuery.refetch(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.products}</h1>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {lang === 'fr' ? 'Ajouter' : 'Add'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct
                  ? t.common.edit
                  : lang === 'fr'
                    ? 'Nouveau produit'
                    : 'New product'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{lang === 'fr' ? 'Nom (FR)' : 'Name (FR)'}</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>{lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'}</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nameEn: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Prix</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price: Number(event.target.value) }))
                    }
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, stock: Number(event.target.value) }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label>{lang === 'fr' ? 'Catégorie' : 'Category'}</Label>
                <Select
                  value={form.categoryId || 'none'}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: value === 'none' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {lang === 'fr' ? 'Aucune' : 'None'}
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="productImages" className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    {lang === 'fr' ? 'Images du produit' : 'Product images'}
                  </Label>
                  {editingProduct?.images.length ? (
                    <span className="text-xs text-muted-foreground">
                      {lang === 'fr'
                        ? `${editingProduct.images.length} image(s) existante(s)`
                        : `${editingProduct.images.length} existing image(s)`}
                    </span>
                  ) : null}
                </div>
                <Input
                  id="productImages"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleFilesChange}
                />
                {fileNames.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {fileNames.map((fileName) => (
                      <li key={fileName}>{fileName}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {lang === 'fr'
                      ? 'PNG, JPG ou WEBP, jusqu’à 10 fichiers.'
                      : 'PNG, JPG or WEBP, up to 10 files.'}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Featured</Label>
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(value) =>
                    setForm((current) => ({ ...current, isFeatured: value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>New</Label>
                <Switch
                  checked={form.isNew}
                  onCheckedChange={(value) =>
                    setForm((current) => ({ ...current, isNew: value }))
                  }
                />
              </div>

              <Button type="submit" className="w-full">
                {t.common.save}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'fr' ? 'Image' : 'Image'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Nom' : 'Name'}</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>{lang === 'fr' ? 'Catégorie' : 'Category'}</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const primaryImage =
                  product.images.find((image) => image.isPrimary)?.imageUrl ||
                  product.images[0]?.imageUrl;

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                          IMG
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openForEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
