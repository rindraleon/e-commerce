import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

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
      const { data } = await supabase.from("categories").select("*").order("name");
      return data || [];
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, name_en: nameEn, description };
    if (editCat) {
      await supabase.from("categories").update(payload).eq("id", editCat.id);
    } else {
      await supabase.from("categories").insert(payload);
    }
    toast({ title: t.common.success });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    setOpen(false); setEditCat(null); setName(""); setNameEn(""); setDescription("");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.categories}</h1>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditCat(null); setName(""); setNameEn(""); setDescription(""); } }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> {lang === "fr" ? "Ajouter" : "Add"}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editCat ? t.common.edit : lang === "fr" ? "Nouvelle catégorie" : "New category"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label>{lang === "fr" ? "Nom (FR)" : "Name (FR)"}</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>{lang === "fr" ? "Nom (EN)" : "Name (EN)"}</Label><Input value={nameEn} onChange={e => setNameEn(e.target.value)} /></div>
              <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
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
              {categories?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.name_en || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditCat(c); setName(c.name); setNameEn(c.name_en || ""); setDescription(c.description || ""); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
