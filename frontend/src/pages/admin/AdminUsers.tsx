import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, User } from "lucide-react";
import apiService from "@/api/api-service";

const AdminUsers = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const result = await apiService.users.findAll();
        return Array.isArray(result) ? result : (result?.data || []);
      } catch { return []; }
    },
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiService.users.updateRole(userId, newRole);
      toast({
        title: t.common.success,
        description: lang === "fr" ? "Rôle mis à jour avec succès" : "Role updated successfully",
      });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.users}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{(users as any[])?.length || 0} {lang === "fr" ? "utilisateurs" : "users"}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "fr" ? "Utilisateur" : "User"}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{lang === "fr" ? "Rôle" : "Role"}</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users as any[])?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.fullName || user.full_name}</div>
                        {/* <div className="text-xs text-muted-foreground">ID: {user.id}</div> */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={user.role === "admin" ? "bg-primary" : ""}
                    >
                      {user.role === "admin" ? (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </div>
                      ) : "Client"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <h3 className="font-medium mb-2">{lang === "fr" ? "Instructions" : "Instructions"}:</h3>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>{lang === "fr" ? "Les administrateurs ont accès au panneau d'administration" : "Admins have access to the admin panel"}</li>
          <li>{lang === "fr" ? "Les clients ont seulement accès aux fonctionnalités de base" : "Clients only have access to basic features"}</li>
          <li>{lang === "fr" ? "Les changements de rôle sont appliqués immédiatement" : "Role changes are applied immediately"}</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminUsers;