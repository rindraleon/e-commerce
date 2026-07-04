import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import apiService from "@/api/api-service";

const AdminProducts = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      try {
        const res: any = await apiService.products.findAll();
        return res?.data || res || [];
      } catch { return []; }
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const result = await apiService.categories.findAll();
        return Array.isArray(result) ? result : (result?.data || []);
      } catch { return []; }
    },
  });

  const [form, setForm] = useState({
    name: "", name_en: "", description: "", description_en: "",
    price: "", stock: "", category_id: "", is_featured: false, is_new: false, weight_kg: "",
  });

  const resetForm = () => setForm({
    name: "", name_en: "", description: "", description_en: "",
    price: "", stock: "", category_id: "", is_featured: false, is_new: false, weight_kg: "",
  });

  const openEdit = (product: any) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      name_en: product.name_en || product.nameEn || "",
      description: product.description || "",
      description_en: product.description_en || product.descriptionEn || "",
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id || product.categoryId || "",
      is_featured: product.is_featured || product.isFeatured || false,
      is_new: product.is_new || product.isNew || false,
      weight_kg: String(product.weight_kg || product.weightKg || ""),
    });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      name_en: form.name_en || undefined,
      description: form.description || undefined,
      description_en: form.description_en || undefined,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      category_id: form.category_id || null,
      is_featured: form.is_featured,
      is_new: form.is_new,
      weight_kg: parseFloat(form.weight_kg) || 0,
    };

    try {
      if (editProduct) {
        await apiService.products.update(editProduct.id, payload);
      } else {
        await apiService.products.create(payload as any);
      }
      toast({ title: t.common.success });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
      setEditProduct(null);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: t.common.error, 
        description: error.message || "An error occurred", 
        variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.products.delete(id);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: t.common.success });
    } catch (error: any) {
      toast({ 
        title: t.common.error, 
        description: error.message || "An error occurred", 
        variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.products}</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditProduct(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t.admin.addProduct}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editProduct ? t.admin.editProduct : t.admin.addProduct}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{lang === "fr" ? "Nom (FR)" : "Name (FR)"}</Label>
                  <Input
                    required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>{lang === "fr" ? "Nom (EN)" : "Name (EN)"}</Label>
                  <Input
                    value={form.name_en}
                    onChange={e => setForm({ ...form, name_en: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Description (FR)</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Description (EN)</Label>
                <Textarea
                  value={form.description_en}
                  onChange={e => setForm({ ...form, description_en: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t.product.price}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <Label>{t.product.stock}</Label>
                  <Input
                    type="number"
                    required value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div>
                  <Label>{t.product.weight} (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.weight_kg}
                    onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{lang === "fr" ? "Catégorie" : "Category"}</Label>
                <Select
                  value={form.category_id}
                  onValueChange={v => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(categories as any[])?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={v => setForm({ ...form, is_featured: v })} />
                  <Label>{lang === "fr" ? "En vedette" : "Featured"}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_new}
                    onCheckedChange={v => setForm({ ...form, is_new: v })} />
                  <Label>{lang === "fr" ? "Nouveau" : "New"}</Label>
                </div>
              </div>
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
                <TableHead>{lang === "fr" ? "Produit" : "Product"}</TableHead>
                <TableHead>{t.product.price}</TableHead>
                <TableHead>{t.product.stock}</TableHead>
                <TableHead>{lang === "fr" ? "Catégorie" : "Category"}</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products as any[])?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                        {p.productImages?.[0] || p.product_images?.[0] ? (
                          <img src={(p.productImages?.[0] || p.product_images?.[0]).imageUrl || (p.productImages?.[0] || p.product_images?.[0]).image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-full h-full p-2 text-muted-foreground/30" />
                        )}
                      </div>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell> {p.price} Ar</TableCell>
                  <TableCell>
                    <Badge
                      variant={p.stock <= 0 ? "destructive" : p.stock < 5 ? "outline" : "default"}
                      className={p.stock >= 5 ? "bg-accent" : ""}>
                      {p.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{p.category?.name || p.categories?.name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}><Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.admin.confirmDelete}</AlertDialogTitle>
                            <AlertDialogDescription>{p.name}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(p.id)}>{t.common.delete}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default AdminProducts;
