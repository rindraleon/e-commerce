import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Category, Coupon, Product } from '@/types/domain';
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react';

interface CouponFormState {
  code: string;
  description: string;
  type: string;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  isActive: boolean;
  isSingleUsePerUser: boolean;
  isForNewCustomers: boolean;
  allowedCategoryIds: string[];
  allowedProductIds: string[];
  startsAt: string;
  expiresAt: string;
}

const emptyForm: CouponFormState = {
  code: '',
  description: '',
  type: 'percentage',
  value: 10,
  minOrderAmount: 0,
  maxDiscountAmount: 0,
  usageLimit: 0,
  isActive: true,
  isSingleUsePerUser: true,
  isForNewCustomers: false,
  allowedCategoryIds: [],
  allowedProductIds: [],
  startsAt: '',
  expiresAt: '',
};

const AdminCoupons = () => {
  const { lang, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(emptyForm);

  const couponsQuery = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => apiService.coupons.findAll({ page: 1, limit: 100 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-coupon-categories'],
    queryFn: () => apiService.categories.findAll({ page: 1, limit: 100 }),
  });

  const productsQuery = useQuery({
    queryKey: ['admin-coupon-products'],
    queryFn: () => apiService.products.findAll({ page: 1, limit: 100 }),
  });

  const coupons = couponsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];
  const products = productsQuery.data?.data || [];

  const resetForm = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
  };

  const openForEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive,
      isSingleUsePerUser: coupon.isSingleUsePerUser ?? true,
      isForNewCustomers: coupon.isForNewCustomers ?? false,
      allowedCategoryIds: coupon.allowedCategoryIds || [],
      allowedProductIds: coupon.allowedProductIds || [],
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
    });
    setOpen(true);
  };

  const usageLabel = useMemo(
    () =>
      coupons.map((coupon) => ({
        id: coupon.id,
        value:
          coupon.usageLimit && coupon.usageLimit > 0
            ? `${coupon.usedCount}/${coupon.usageLimit}`
            : `${coupon.usedCount}`,
      })),
    [coupons],
  );

  const toggleArrayValue = (
    values: string[],
    value: string,
  ) => {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: form.value,
      minOrderAmount: form.minOrderAmount > 0 ? form.minOrderAmount : undefined,
      maxDiscountAmount:
        form.maxDiscountAmount > 0 ? form.maxDiscountAmount : undefined,
      usageLimit: form.usageLimit > 0 ? form.usageLimit : undefined,
      isActive: form.isActive,
      isSingleUsePerUser: form.isSingleUsePerUser,
      isForNewCustomers: form.isForNewCustomers,
      allowedCategoryIds: form.allowedCategoryIds,
      allowedProductIds: form.allowedProductIds,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : undefined,
    };

    try {
      if (editingCoupon) {
        await apiService.coupons.update(editingCoupon.id, payload);
      } else {
        await apiService.coupons.create(payload);
      }

      toast({ title: t.common.success });
      await queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setOpen(false);
      resetForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: t.common.error,
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (couponId: string) => {
    try {
      await apiService.coupons.delete(couponId);
      toast({ title: t.common.success });
      await queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: t.common.error,
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (couponsQuery.isLoading) {
    return <PageState type="loading" title={t.common.loading} />;
  }

  if (couponsQuery.isError) {
    return (
      <PageState
        type="error"
        title={t.common.error}
        action={{
          label: lang === 'fr' ? 'Réessayer' : 'Retry',
          onClick: () => couponsQuery.refetch(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === 'fr' ? 'Coupons promo' : 'Promo coupons'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'fr'
              ? 'Gérez les codes promo, remises et limites d’utilisation.'
              : 'Manage promo codes, discounts and usage limits.'}
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {lang === 'fr' ? 'Ajouter' : 'Add'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon
                  ? lang === 'fr'
                    ? 'Modifier le coupon'
                    : 'Edit coupon'
                  : lang === 'fr'
                    ? 'Nouveau coupon'
                    : 'New coupon'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{lang === 'fr' ? 'Code' : 'Code'}</Label>
                  <Input
                    required
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>{lang === 'fr' ? 'Type' : 'Type'}</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        {lang === 'fr' ? 'Pourcentage' : 'Percentage'}
                      </SelectItem>
                      <SelectItem value="fixed">
                        {lang === 'fr' ? 'Montant fixe' : 'Fixed amount'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{lang === 'fr' ? 'Description' : 'Description'}</Label>
                <Input
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>
                    {form.type === 'percentage'
                      ? lang === 'fr'
                        ? 'Valeur (%)'
                        : 'Value (%)'
                      : lang === 'fr'
                        ? 'Montant remise'
                        : 'Discount amount'}
                  </Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={form.value}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        value: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>
                    {lang === 'fr'
                      ? 'Montant commande minimum'
                      : 'Minimum order amount'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.minOrderAmount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minOrderAmount: Number(event.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>
                    {lang === 'fr'
                      ? 'Plafond remise (optionnel)'
                      : 'Discount cap (optional)'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.maxDiscountAmount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maxDiscountAmount: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>
                    {lang === 'fr'
                      ? 'Limite d’utilisation'
                      : 'Usage limit'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={form.usageLimit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        usageLimit: Number(event.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{lang === 'fr' ? 'Début' : 'Start'}</Label>
                  <Input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startsAt: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>{lang === 'fr' ? 'Expiration' : 'Expiry'}</Label>
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expiresAt: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{lang === 'fr' ? 'Coupon actif' : 'Active coupon'}</Label>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(value) =>
                      setForm((current) => ({ ...current, isActive: value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>
                    {lang === 'fr' ? 'Usage unique par utilisateur' : 'Single use per user'}
                  </Label>
                  <Switch
                    checked={form.isSingleUsePerUser}
                    onCheckedChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        isSingleUsePerUser: value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>
                    {lang === 'fr' ? 'Réservé aux nouveaux clients' : 'New customers only'}
                  </Label>
                  <Switch
                    checked={form.isForNewCustomers}
                    onCheckedChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        isForNewCustomers: value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <Label>{lang === 'fr' ? 'Catégories autorisées' : 'Allowed categories'}</Label>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'fr'
                        ? 'Laisser vide pour autoriser toutes les catégories.'
                        : 'Leave empty to allow all categories.'}
                    </p>
                  </div>
                  <div className="max-h-48 space-y-2 overflow-auto pr-2">
                    {categories.map((category: Category) => (
                      <label key={category.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.allowedCategoryIds.includes(category.id)}
                          onCheckedChange={() =>
                            setForm((current) => ({
                              ...current,
                              allowedCategoryIds: toggleArrayValue(
                                current.allowedCategoryIds,
                                category.id,
                              ),
                            }))
                          }
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                    {!categories.length ? (
                      <p className="text-xs text-muted-foreground">{t.common.noResults}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <Label>{lang === 'fr' ? 'Produits autorisés' : 'Allowed products'}</Label>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'fr'
                        ? 'Laisser vide pour autoriser tous les produits.'
                        : 'Leave empty to allow all products.'}
                    </p>
                  </div>
                  <div className="max-h-48 space-y-2 overflow-auto pr-2">
                    {products.map((product: Product) => (
                      <label key={product.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.allowedProductIds.includes(product.id)}
                          onCheckedChange={() =>
                            setForm((current) => ({
                              ...current,
                              allowedProductIds: toggleArrayValue(
                                current.allowedProductIds,
                                product.id,
                              ),
                            }))
                          }
                        />
                        <span className="line-clamp-1">{product.name}</span>
                      </label>
                    ))}
                    {!products.length ? (
                      <p className="text-xs text-muted-foreground">{t.common.noResults}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2">
                <TicketPercent className="h-4 w-4" />
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
                <TableHead>{lang === 'fr' ? 'Code' : 'Code'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Type' : 'Type'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Valeur' : 'Value'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Usage' : 'Usage'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Expiration' : 'Expiry'}</TableHead>
                <TableHead>{lang === 'fr' ? 'Statut' : 'Status'}</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{coupon.code}</p>
                      {coupon.description ? (
                        <p className="text-xs text-muted-foreground">
                          {coupon.description}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.type === 'percentage'
                      ? lang === 'fr'
                        ? 'Pourcentage'
                        : 'Percentage'
                      : lang === 'fr'
                        ? 'Fixe'
                        : 'Fixed'}
                  </TableCell>
                  <TableCell>
                    {coupon.type === 'percentage'
                      ? `${coupon.value}%`
                      : `$${coupon.value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {usageLabel.find((item) => item.id === coupon.id)?.value ||
                      coupon.usedCount}
                  </TableCell>
                  <TableCell>
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleString(
                          lang === 'fr' ? 'fr-FR' : 'en-US',
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          coupon.isActive
                            ? 'bg-accent/15 text-accent-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {coupon.isActive
                          ? lang === 'fr'
                            ? 'Actif'
                            : 'Active'
                          : lang === 'fr'
                            ? 'Inactif'
                            : 'Inactive'}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {coupon.isSingleUsePerUser
                          ? lang === 'fr'
                            ? '1 fois par utilisateur'
                            : '1 use per user'
                          : lang === 'fr'
                            ? 'multi-usage utilisateur'
                            : 'multi-use per user'}
                      </p>
                      {coupon.isForNewCustomers ? (
                        <p className="text-xs text-muted-foreground">
                          {lang === 'fr' ? 'nouveaux clients uniquement' : 'new customers only'}
                        </p>
                      ) : null}
                      {coupon.allowedCategoryIds?.length || coupon.allowedProductIds?.length ? (
                        <p className="text-xs text-muted-foreground">
                          {lang === 'fr' ? 'restrictions panier actives' : 'cart restrictions enabled'}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openForEdit(coupon)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!coupons.length ? (
            <div className="p-6">
              <PageState type="empty" title={t.common.noResults} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
