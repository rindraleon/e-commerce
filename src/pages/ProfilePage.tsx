import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfilePage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() }).eq("user_id", user.id);
    if (error) toast({ title: t.common.error, description: error.message, variant: "destructive" });
    else toast({ title: t.common.success });
    setSaving(false);
  };

  if (authLoading) return <div className="container mx-auto px-4 py-20 text-center">{t.common.loading}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="font-heading text-3xl font-bold mb-8">{t.profile.title}</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">{t.profile.editProfile}</TabsTrigger>
          <TabsTrigger value="addresses">{t.profile.addresses}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label>{t.auth.email}</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div>
                  <Label>{t.auth.fullName}</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>{t.profile.title === "Mon profil" ? "Téléphone" : "Phone"}</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <Button type="submit" disabled={saving}>{saving ? t.common.loading : t.profile.save}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="addresses">
          <AddressesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-component for addresses
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AddressesSection = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CD");
  const [label, setLabel] = useState("Domicile");

  const { data: addresses } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("addresses").insert({ user_id: user.id, street, city, country, label });
    if (error) toast({ title: t.common.error, description: error.message, variant: "destructive" });
    else { toast({ title: t.common.success }); qc.invalidateQueries({ queryKey: ["addresses"] }); setOpen(false); setStreet(""); setCity(""); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2"><Plus className="h-4 w-4" /> {t.profile.addAddress}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.profile.addAddress}</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><Label>Label</Label><Input value={label} onChange={e => setLabel(e.target.value)} /></div>
            <div><Label>{lang === "fr" ? "Rue" : "Street"}</Label><Input required value={street} onChange={e => setStreet(e.target.value)} /></div>
            <div><Label>{lang === "fr" ? "Ville" : "City"}</Label><Input required value={city} onChange={e => setCity(e.target.value)} /></div>
            <div><Label>{lang === "fr" ? "Pays" : "Country"}</Label><Input value={country} onChange={e => setCountry(e.target.value)} /></div>
            <Button type="submit">{t.profile.save}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {addresses?.map((addr: any) => (
        <Card key={addr.id}>
          <CardContent className="p-4 flex justify-between items-start">
            <div>
              <p className="font-medium">{addr.label}</p>
              <p className="text-sm text-muted-foreground">{addr.street}, {addr.city}, {addr.country}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfilePage;
