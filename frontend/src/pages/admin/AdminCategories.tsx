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
import { Plus, Pencil, Trash2 } from "lucide-react";
import apiService from "@/api/api-service";

const AdminCategories = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      try {
        const result = await apiService.categories.findAll();
        return Array.isArray(result) ? result : (result?.data || []);
      } catch { return []; }
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name, description };
    if (nameEn.trim()) payload.name_en = nameEn;

    try {
      if (editCat) {
        await apiService.categories.update(editCat.id, payload);
      } else {
        await apiService.categories.create(payload);
      }
      toast({ title: t.common.success });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setOpen(false);
      setEditCat(null);
      setName(""); setNameEn(""); setDescription("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.categories.delete(id);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.categories}</h1>
        <Dialog
          open={open}
          onOpenChange={v => {
            setOpen(v); if (!v) {
              setEditCat(null); setName("");
              setNameEn(""); setDescription("");
            }
          }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> {lang === "fr" ? "Ajouter" : "Add"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editCat ? t.common.edit : lang === "fr" ? "Nouvelle catégorie" : "New category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>{lang === "fr" ? "Nom (FR)" : "Name (FR)"}</Label>
                <Input required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <Label>{lang === "fr" ? "Nom (EN)" : "Name (EN)"}</Label>
                <Input value={nameEn} onChange={e => setNameEn(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} />
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
                <TableHead>{lang === "fr" ? "Nom" : "Name"}</TableHead>
                <TableHead>{lang === "fr" ? "Nom (EN)" : "Name (EN)"}</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories as any[])?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.name_en || c.nameEn || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditCat(c);
                          setName(c.name);
                          setNameEn(c.name_en || c.nameEn || "");
                          setDescription(c.description || "");
                          setOpen(true);
                        }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}>
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
};

export default AdminCategories;
