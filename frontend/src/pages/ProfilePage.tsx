import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiService from "@/api/api-service";

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
    try {
      await apiService.auth.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      toast({ title: t.common.success });
    } catch (err: any) {
      toast({ title: t.common.error, description: err?.message || 'Failed to update profile', variant: "destructive" });
    }
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
      if (!user) return [];
      try {
        const data: any = await apiService.addresses.findByUserId(user.id);
        return (data || []).sort((a: any, b: any) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await apiService.addresses.create(user.id, {
        label,
        street,
        city,
        state: "",
        postalCode: "",
        country,
        phone: "",
        isDefault: false,
      });
      toast({ title: t.common.success });
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setOpen(false);
      setStreet("");
      setCity("");
    } catch (err: any) {
      toast({ title: t.common.error, description: err?.message || 'Failed to add address', variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.addresses.delete(id);
      qc.invalidateQueries({ queryKey: ["addresses"] });
    } catch (err: any) {
      toast({ title: t.common.error, description: err?.message || 'Failed to delete address', variant: "destructive" });
    }
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

      {(addresses as any[])?.map((addr: any) => (
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
