import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminClients = () => {
  const { t, lang } = useLanguage();

  const { data: clients } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

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
                <TableHead>{lang === "fr" ? "Inscrit le" : "Joined"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name || "-"}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
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
