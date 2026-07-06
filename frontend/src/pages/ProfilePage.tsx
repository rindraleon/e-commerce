import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import Seo from '@/components/common/Seo';
import PageState from '@/components/common/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiService.auth.updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      await refreshProfile();
      toast({ title: t.common.success });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="container mx-auto px-4 py-8"><PageState type="loading" title={t.common.loading} /></div>;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Seo title="Mon profil" description="Gérez votre profil E-shop Pro." path="/profile" noIndex />
      <h1 className="mb-8 font-heading text-3xl font-bold">{t.profile.title}</h1>
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
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label>{t.auth.fullName}</Label>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
                <div>
                  <Label>{lang === 'fr' ? 'Téléphone' : 'Phone'}</Label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
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

const AddressesSection = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('MG');
  const [label, setLabel] = useState(lang === 'fr' ? 'Domicile' : 'Home');

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => apiService.addresses.findByUserId(user?.id || ''),
    enabled: !!user,
  });

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      await apiService.addresses.create(user.id, {
        label,
        street,
        city,
        state: '',
        postalCode: '',
        country,
        phone: '',
        isDefault: addressesQuery.data?.length === 0,
      });
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setOpen(false);
      setStreet('');
      setCity('');
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message || 'Failed to add address', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.addresses.delete(id);
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message || 'Failed to delete address', variant: 'destructive' });
    }
  };

  if (addressesQuery.isLoading) return <PageState type="loading" title={t.common.loading} />;

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2"><Plus className="h-4 w-4" /> {t.profile.addAddress}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.profile.addAddress}</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><Label>Label</Label><Input value={label} onChange={(event) => setLabel(event.target.value)} /></div>
            <div><Label>{lang === 'fr' ? 'Rue' : 'Street'}</Label><Input required value={street} onChange={(event) => setStreet(event.target.value)} /></div>
            <div><Label>{lang === 'fr' ? 'Ville' : 'City'}</Label><Input required value={city} onChange={(event) => setCity(event.target.value)} /></div>
            <div><Label>{lang === 'fr' ? 'Pays' : 'Country'}</Label><Input value={country} onChange={(event) => setCountry(event.target.value)} /></div>
            <Button type="submit">{t.profile.save}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {addressesQuery.data?.length ? addressesQuery.data.map((address) => (
        <Card key={address.id}>
          <CardContent className="flex items-start justify-between p-4">
            <div>
              <p className="font-medium">{address.label}</p>
              <p className="text-sm text-muted-foreground">{address.street}, {address.city}, {address.country}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(address.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </CardContent>
        </Card>
      )) : <PageState type="empty" title={lang === 'fr' ? 'Aucune adresse' : 'No address saved'} />}
    </div>
  );
};

export default ProfilePage;
