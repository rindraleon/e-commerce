import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Trash2 } from "lucide-react";
import apiService from "@/api/api-service";

const AdminReviews = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: reviews } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      try {
        const data: any = await apiService.reviews.findByUserId();
        return data || [];
      } catch { return []; }
    },
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiService.reviews.updateStatus(id, status);
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast({ title: t.common.success });
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error.message || "Failed to update review status",
        variant: "destructive",
      });
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await apiService.reviews.delete(id);
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast({ title: t.common.success });
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-warning",
    approved: "bg-accent",
    rejected: "bg-destructive",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.reviews}</h1>
      <div className="space-y-4">
        {(reviews as any[])?.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm">{r.user?.fullName || r.profiles?.full_name} → {r.product?.name || r.products?.name}</p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s}
                      className={`h-3 w-3 ${s <= r.rating ? "text-warning fill-warning" : "text-muted"}`} />)}
                  </div>
                </div>
                <Badge
                  className={statusColor[r.moderationStatus || r.moderation_status]}>{r.moderationStatus || r.moderation_status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{r.comment}</p>
              <div className="flex gap-2">
                {r.moderation_status !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => updateStatus(r.id, "approved")}>
                    <Check className="h-3 w-3" /> {t.admin.approve}
                  </Button>
                )}
                {r.moderation_status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => updateStatus(r.id, "rejected")}>
                    <X className="h-3 w-3" /> {t.admin.reject}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteReview(r.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!reviews || (reviews as any[]).length === 0) &&
          <p className="text-muted-foreground">{t.common.noResults}</p>}
      </div>
    </div>
  );
};

export default AdminReviews;
